# CMS MVP - Immediate Action Plan
**Transform RML Intranet into CMS Product: Week 1 Playbook**

---

## Executive Summary

**Goal:** Launch a functional staging environment and begin CMS feature development
**Timeline:** This week (Days 1-7)
**Team Required:** 1 developer + access to GCP
**Outcome:** Staging environment live + database ready + first API endpoints deployed

---

## Day 1: Environment & Infrastructure (4-6 hours)

### Morning: Staging Environment Setup

#### Task 1.1: Create Staging Cloud Run Service (45 min)

```bash
# Set up variables
export PROJECT_ID="rmlintranet"
export STAGING_SERVICE="rml-intranet-staging"
export REGION="us-central1"

# Build staging image
cd /tmp/Rmlintranetdesign
gcloud builds submit \
  --config cloudbuild.yaml \
  --project=$PROJECT_ID \
  --tag=gcr.io/$PROJECT_ID/rml-intranet:staging

# Deploy staging service
gcloud run deploy $STAGING_SERVICE \
  --image gcr.io/$PROJECT_ID/rml-intranet:staging \
  --region $REGION \
  --platform managed \
  --port 8080 \
  --set-env-vars="ENVIRONMENT=staging,NODE_ENV=staging" \
  --allow-unauthenticated \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1
```

**Validation:**
```bash
# Get staging URL
gcloud run services describe $STAGING_SERVICE --region=$REGION --format="value(status.url)"

# Test it
curl -I <STAGING_URL>
```

#### Task 1.2: Set Up Staging Database (30 min)

**Option A: New Supabase Project (Recommended)**

1. Go to https://supabase.com/dashboard
2. Create new project: `rml-intranet-staging`
3. Note the connection details:
   - Project URL: `https://xxx.supabase.co`
   - Anon Key: `eyJ...`
   - Service Role Key: `eyJ...`

**Option B: Separate Schema in Existing Database**

```sql
-- In existing Supabase project
CREATE SCHEMA staging;
-- All tables will go in staging schema
```

#### Task 1.3: Configure Environment Variables (15 min)

```bash
# Update staging service with database credentials
gcloud run services update $STAGING_SERVICE \
  --update-env-vars="SUPABASE_URL=https://xxx.supabase.co" \
  --update-env-vars="SUPABASE_ANON_KEY=xxx" \
  --update-env-vars="SUPABASE_SERVICE_KEY=xxx" \
  --region $REGION

# Verify
gcloud run services describe $STAGING_SERVICE --region=$REGION --format="yaml(spec.template.spec.containers[0].env)"
```

### Afternoon: Database Schema Implementation

#### Task 1.4: Create Database Migration File (30 min)

```bash
# Create migrations directory
mkdir -p /tmp/Rmlintranetdesign/backend/migrations

# Create migration file
cat > /tmp/Rmlintranetdesign/backend/migrations/001_cms_schema.sql << 'EOF'
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pages table
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  layout_config JSONB NOT NULL DEFAULT '{"blocks": []}',
  meta JSONB DEFAULT '{}',
  author_id UUID NOT NULL,
  parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_author ON pages(author_id);

-- Page versions
CREATE TABLE page_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  layout_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  change_summary TEXT,
  UNIQUE(page_id, version_number)
);

CREATE INDEX idx_page_versions_page_id ON page_versions(page_id);

-- Auto-increment version trigger
CREATE OR REPLACE FUNCTION increment_page_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version_number := COALESCE(
    (SELECT MAX(version_number) FROM page_versions WHERE page_id = NEW.page_id),
    0
  ) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_page_version_number
  BEFORE INSERT ON page_versions
  FOR EACH ROW
  EXECUTE FUNCTION increment_page_version();

-- Forms table
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  fields_config JSONB NOT NULL DEFAULT '{"fields": []}',
  settings JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  CONSTRAINT valid_form_status CHECK (status IN ('active', 'inactive', 'archived'))
);

CREATE INDEX idx_forms_slug ON forms(slug);
CREATE INDEX idx_forms_status ON forms(status);

-- Content blocks library
CREATE TABLE content_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  is_template BOOLEAN DEFAULT false,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL
);

CREATE INDEX idx_content_blocks_type ON content_blocks(type);
CREATE INDEX idx_content_blocks_template ON content_blocks(is_template);

-- Assets (media library)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(500) NOT NULL,
  type VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_asset_type CHECK (type IN ('image', 'video', 'document', 'other'))
);

CREATE INDEX idx_assets_type ON assets(type);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on auth)
CREATE POLICY "Public can view published pages"
  ON pages FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users can manage pages"
  ON pages FOR ALL
  USING (auth.uid() = author_id);
EOF
```

#### Task 1.5: Run Migration (15 min)

**In Supabase Dashboard:**
1. Go to SQL Editor
2. Copy contents of `001_cms_schema.sql`
3. Execute
4. Verify tables created in Table Editor

**Validation:**
```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('pages', 'forms', 'content_blocks', 'assets');
```

---

## Day 2: Backend API Development (6-8 hours)

### Morning: Pages API

#### Task 2.1: Create TypeScript Types (30 min)

```bash
# Create types directory
mkdir -p /tmp/Rmlintranetdesign/backend/src/types

cat > /tmp/Rmlintranetdesign/backend/src/types/page.ts << 'EOF'
export interface Page {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  layout_config: LayoutConfig;
  meta: Record<string, any>;
  author_id: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface LayoutConfig {
  blocks: PageBlock[];
}

export interface PageBlock {
  id: string;
  type: string;
  config: Record<string, any>;
  order: number;
}

export interface CreatePageDto {
  slug: string;
  title: string;
  layout_config?: LayoutConfig;
  meta?: Record<string, any>;
  parent_id?: string;
}

export interface UpdatePageDto extends Partial<CreatePageDto> {
  status?: Page['status'];
}
EOF
```

#### Task 2.2: Create Page Service (1 hour)

```bash
# Create services directory
mkdir -p /tmp/Rmlintranetdesign/backend/src/services

cat > /tmp/Rmlintranetdesign/backend/src/services/PageService.ts << 'EOF'
import { supabase } from '../config/supabase';
import { Page, CreatePageDto, UpdatePageDto } from '../types/page';

export class PageService {
  async list(filters: { status?: string; author_id?: string } = {}): Promise<Page[]> {
    let query = supabase
      .from('pages')
      .select('*')
      .order('updated_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.author_id) {
      query = query.eq('author_id', filters.author_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Page[];
  }

  async getById(id: string): Promise<Page | null> {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Page;
  }

  async getBySlug(slug: string): Promise<Page | null> {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Page;
  }

  async create(pageData: CreatePageDto & { author_id: string }): Promise<Page> {
    const { data, error } = await supabase
      .from('pages')
      .insert({
        ...pageData,
        status: 'draft',
        layout_config: pageData.layout_config || { blocks: [] }
      })
      .select()
      .single();

    if (error) throw error;

    // Create initial version
    await this.createVersion(
      data.id,
      data.layout_config,
      pageData.author_id,
      'Initial version'
    );

    return data as Page;
  }

  async update(id: string, updates: UpdatePageDto): Promise<Page> {
    const { data, error } = await supabase
      .from('pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Page;
  }

  async publish(id: string): Promise<Page> {
    const { data, error } = await supabase
      .from('pages')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Page;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('pages').delete().eq('id', id);
    if (error) throw error;
  }

  private async createVersion(
    pageId: string,
    layoutConfig: any,
    userId: string,
    summary: string
  ): Promise<void> {
    const { error } = await supabase.from('page_versions').insert({
      page_id: pageId,
      layout_config: layoutConfig,
      created_by: userId,
      change_summary: summary
    });

    if (error) throw error;
  }
}
EOF
```

#### Task 2.3: Create Pages Route (45 min)

```bash
# Create routes directory
mkdir -p /tmp/Rmlintranetdesign/backend/src/routes

cat > /tmp/Rmlintranetdesign/backend/src/routes/pages.ts << 'EOF'
import { Router } from 'express';
import { z } from 'zod';
import { PageService } from '../services/PageService';

const router = Router();
const pageService = new PageService();

// Validation schemas
const createPageSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  layout_config: z.object({ blocks: z.array(z.any()) }).optional(),
  meta: z.object({}).optional(),
  parent_id: z.string().uuid().optional()
});

// GET /api/cms/pages
router.get('/', async (req, res) => {
  try {
    const { status, author_id } = req.query;
    const pages = await pageService.list({
      status: status as string,
      author_id: author_id as string
    });
    res.json({ success: true, data: pages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/cms/pages/:id
router.get('/:id', async (req, res) => {
  try {
    const page = await pageService.getById(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }
    res.json({ success: true, data: page });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cms/pages
router.post('/', async (req, res) => {
  try {
    const validated = createPageSchema.parse(req.body);
    // TODO: Get author_id from authenticated user
    const author_id = req.body.author_id || '00000000-0000-0000-0000-000000000000';

    const page = await pageService.create({
      ...validated,
      author_id
    });

    res.status(201).json({ success: true, data: page });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/cms/pages/:id
router.patch('/:id', async (req, res) => {
  try {
    const page = await pageService.update(req.params.id, req.body);
    res.json({ success: true, data: page });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cms/pages/:id/publish
router.post('/:id/publish', async (req, res) => {
  try {
    const page = await pageService.publish(req.params.id);
    res.json({ success: true, data: page });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/cms/pages/:id
router.delete('/:id', async (req, res) => {
  try {
    await pageService.delete(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
EOF
```

### Afternoon: Update Backend Entry Point

#### Task 2.4: Update Express App (30 min)

```bash
# Update backend/src/index.ts
cat >> /tmp/Rmlintranetdesign/backend/src/index.ts << 'EOF'

// Import new CMS routes
import pagesRoutes from './routes/pages';

// Mount CMS routes
app.use('/api/cms/pages', pagesRoutes);

console.log('CMS routes mounted:');
console.log('  GET    /api/cms/pages');
console.log('  POST   /api/cms/pages');
console.log('  GET    /api/cms/pages/:id');
console.log('  PATCH  /api/cms/pages/:id');
console.log('  POST   /api/cms/pages/:id/publish');
console.log('  DELETE /api/cms/pages/:id');
EOF
```

#### Task 2.5: Deploy Updated Backend (20 min)

```bash
cd /tmp/Rmlintranetdesign/backend

# Build TypeScript
npm run build

# Deploy to Cloud Run
gcloud run deploy rml-intranet-forms-api-staging \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated

# Test API
curl https://rml-intranet-forms-api-staging-xxx.run.app/api/cms/pages
```

---

## Day 3: Frontend Foundation (6-8 hours)

### Morning: Page Builder UI Structure

#### Task 3.1: Install React DnD (Already Done!)

```bash
# Check if installed
cd /tmp/Rmlintranetdesign
grep "react-dnd" package.json

# Should see:
# "react-dnd": "16.0.1",
# "react-dnd-html5-backend": "16.0.1"
```

#### Task 3.2: Create Page Builder Directory Structure (15 min)

```bash
mkdir -p /tmp/Rmlintranetdesign/src/app/components/PageBuilder/{blocks,hooks}

# Create files
touch /tmp/Rmlintranetdesign/src/app/components/PageBuilder/{index.tsx,BlockLibrary.tsx,Canvas.tsx,PropertyPanel.tsx,BlockRenderer.tsx,types.ts}

touch /tmp/Rmlintranetdesign/src/app/components/PageBuilder/hooks/{usePageBuilder.ts,useDragDrop.ts}

touch /tmp/Rmlintranetdesign/src/app/components/PageBuilder/blocks/{index.ts,HeroBlock.tsx,TextBlock.tsx,CardGridBlock.tsx}
```

#### Task 3.3: Create Type Definitions (30 min)

```bash
cat > /tmp/Rmlintranetdesign/src/app/components/PageBuilder/types.ts << 'EOF'
export interface PageBuilderBlock {
  id: string;
  type: string;
  config: Record<string, any>;
  order: number;
}

export interface PageLayout {
  blocks: PageBuilderBlock[];
}

export interface BlockDefinition {
  type: string;
  label: string;
  icon: string;
  description: string;
  category: 'content' | 'layout' | 'data' | 'media';
  component: React.ComponentType<any>;
  defaultConfig: any;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  layout_config: PageLayout;
  created_at: string;
  updated_at: string;
}
EOF
```

### Afternoon: Basic Page Builder Implementation

#### Task 3.4: Create usePageBuilder Hook (1 hour)

```bash
cat > /tmp/Rmlintranetdesign/src/app/components/PageBuilder/hooks/usePageBuilder.ts << 'EOF'
import { useState, useCallback } from 'react';
import { PageBuilderBlock } from '../types';

export function usePageBuilder(initialBlocks: PageBuilderBlock[] = []) {
  const [blocks, setBlocks] = useState<PageBuilderBlock[]>(initialBlocks);
  const [selectedBlock, setSelectedBlock] = useState<PageBuilderBlock | null>(null);
  const [history, setHistory] = useState<PageBuilderBlock[][]>([initialBlocks]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const addToHistory = useCallback((newBlocks: PageBuilderBlock[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const addBlock = useCallback((type: string, config: any) => {
    const newBlock: PageBuilderBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      config,
      order: blocks.length
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    addToHistory(newBlocks);
    setSelectedBlock(newBlock);
  }, [blocks, addToHistory]);

  const updateBlock = useCallback((id: string, updates: Partial<PageBuilderBlock>) => {
    const newBlocks = blocks.map((block) =>
      block.id === id ? { ...block, ...updates } : block
    );
    setBlocks(newBlocks);
    addToHistory(newBlocks);

    if (selectedBlock?.id === id) {
      setSelectedBlock({ ...selectedBlock, ...updates });
    }
  }, [blocks, selectedBlock, addToHistory]);

  const deleteBlock = useCallback((id: string) => {
    const newBlocks = blocks.filter((block) => block.id !== id);
    setBlocks(newBlocks);
    addToHistory(newBlocks);

    if (selectedBlock?.id === id) {
      setSelectedBlock(null);
    }
  }, [blocks, selectedBlock, addToHistory]);

  const reorderBlocks = useCallback((dragIndex: number, hoverIndex: number) => {
    const newBlocks = [...blocks];
    const [removed] = newBlocks.splice(dragIndex, 1);
    newBlocks.splice(hoverIndex, 0, removed);

    // Update order
    const reordered = newBlocks.map((block, index) => ({
      ...block,
      order: index
    }));

    setBlocks(reordered);
    addToHistory(reordered);
  }, [blocks, addToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setBlocks(history[newIndex]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setBlocks(history[newIndex]);
    }
  }, [history, historyIndex]);

  return {
    blocks,
    selectedBlock,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    selectBlock: setSelectedBlock,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1
  };
}
EOF
```

#### Task 3.5: Create Basic Block Library (45 min)

```bash
cat > /tmp/Rmlintranetdesign/src/app/components/PageBuilder/BlockLibrary.tsx << 'EOF'
import React from 'react';
import { Button } from '../ui/button';

const availableBlocks = [
  { type: 'hero', label: 'Hero Section', icon: '🦸', category: 'content' },
  { type: 'text', label: 'Text', icon: '📝', category: 'content' },
  { type: 'image', label: 'Image', icon: '🖼️', category: 'media' },
  { type: 'cardGrid', label: 'Card Grid', icon: '📇', category: 'layout' }
];

export interface BlockLibraryProps {
  onAddBlock: (type: string, config: any) => void;
}

export function BlockLibrary({ onAddBlock }: BlockLibraryProps) {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Blocks</h3>

      <div className="space-y-2">
        {availableBlocks.map((block) => (
          <Button
            key={block.type}
            variant="outline"
            className="w-full justify-start"
            onClick={() => onAddBlock(block.type, {})}
          >
            <span className="mr-2">{block.icon}</span>
            {block.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
EOF
```

#### Task 3.6: Create Minimal Page Builder Component (1 hour)

```bash
cat > /tmp/Rmlintranetdesign/src/app/components/PageBuilder/index.tsx << 'EOF'
import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BlockLibrary } from './BlockLibrary';
import { usePageBuilder } from './hooks/usePageBuilder';
import { Button } from '../ui/button';

export interface PageBuilderProps {
  initialBlocks?: any[];
  onSave?: (blocks: any[]) => Promise<void>;
}

export function PageBuilder({ initialBlocks = [], onSave }: PageBuilderProps) {
  const {
    blocks,
    addBlock,
    updateBlock,
    deleteBlock,
    undo,
    redo,
    canUndo,
    canRedo
  } = usePageBuilder(initialBlocks);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(blocks);
      alert('Saved!');
    } catch (error) {
      console.error(error);
      alert('Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col">
        {/* Toolbar */}
        <div className="h-16 border-b bg-white px-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Page Builder</h1>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={undo} disabled={!canUndo}>
              ↶ Undo
            </Button>
            <Button variant="ghost" onClick={redo} disabled={!canRedo}>
              ↷ Redo
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Block Library */}
          <div className="w-64 border-r bg-gray-50 overflow-y-auto">
            <BlockLibrary onAddBlock={addBlock} />
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
            {blocks.length === 0 ? (
              <div className="text-center text-gray-400 py-20">
                <p>Click a block to add it to the page</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-4">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="bg-white p-6 rounded-lg border-2 border-dashed"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{block.type}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBlock(block.id)}
                      >
                        Delete
                      </Button>
                    </div>
                    <pre className="text-xs bg-gray-50 p-2 rounded">
                      {JSON.stringify(block.config, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
EOF
```

---

## Day 4: Test & Iterate (4 hours)

### Task 4.1: Create Test Page Route (30 min)

```bash
cat > /tmp/Rmlintranetdesign/src/app/pages/PageBuilderTestPage.tsx << 'EOF'
import React from 'react';
import { PageBuilder } from '../components/PageBuilder';

export function PageBuilderTestPage() {
  const handleSave = async (blocks: any[]) => {
    console.log('Saving blocks:', blocks);

    // Send to API
    const response = await fetch('/api/cms/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Page',
        slug: 'test-page',
        layout_config: { blocks },
        author_id: '00000000-0000-0000-0000-000000000000'
      })
    });

    const result = await response.json();
    console.log('Save result:', result);
  };

  return <PageBuilder onSave={handleSave} />;
}
EOF

# Add route to App.tsx
# <Route path="/page-builder-test" element={<PageBuilderTestPage />} />
```

### Task 4.2: Manual Testing Checklist

- [ ] Load page builder test page
- [ ] Add a block
- [ ] Delete a block
- [ ] Undo/Redo
- [ ] Save page
- [ ] Verify saved in database (Supabase dashboard)
- [ ] Test API endpoints with curl

### Task 4.3: Fix Issues & Document

Create notes document:
```bash
cat > /tmp/Rmlintranetdesign/docs/WEEK1_PROGRESS.md << 'EOF'
# Week 1 Progress Notes

## Completed
- [ ] Staging environment live
- [ ] Database schema created
- [ ] Pages API implemented
- [ ] Basic page builder UI

## Issues Found
1. [List any bugs or blockers]

## Next Steps
1. Add more block types
2. Implement drag-and-drop reordering
3. Add property panel for block configuration
4. Create form builder

## Decisions Made
- Using Supabase for CMS database
- React DnD for drag-and-drop
- Zod for API validation
EOF
```

---

## Day 5-7: Polish & Document (Flexible)

### Priorities for Remaining Days

**If Time Allows:**
1. Add 2-3 more block types (text, image, card grid)
2. Implement actual drag-and-drop reordering
3. Add property panel for editing block config
4. Improve UI styling
5. Add error handling
6. Write tests

**Documentation:**
1. Update README with new CMS features
2. Document API endpoints (Postman collection or OpenAPI)
3. Create user guide draft
4. Record demo video

---

## Success Criteria for Week 1

**Must Have (Blocking):**
- ✅ Staging environment deployed and accessible
- ✅ Database schema created with pages, forms, assets tables
- ✅ Backend API endpoints for pages (GET, POST, PATCH, DELETE)
- ✅ Basic page builder UI that can add/remove blocks
- ✅ Can save a page to the database

**Nice to Have:**
- Drag-and-drop reordering
- Property panel for editing blocks
- 5+ block types
- Form builder started
- Comprehensive tests

**Documentation:**
- Week 1 progress notes
- API endpoint documentation
- Known issues list
- Week 2 plan

---

## Troubleshooting

### Common Issues

**Issue: Staging service won't start**
```bash
# Check logs
gcloud run services logs read $STAGING_SERVICE --region=$REGION

# Check environment variables
gcloud run services describe $STAGING_SERVICE --region=$REGION
```

**Issue: Database connection fails**
```bash
# Verify Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Test connection
curl -X GET "$SUPABASE_URL/rest/v1/pages" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

**Issue: TypeScript errors in backend**
```bash
cd /tmp/Rmlintranetdesign/backend
npm run build

# If errors, check:
# - tsconfig.json is correct
# - All dependencies installed
# - Import paths are correct
```

---

## Quick Commands Reference

```bash
# Deploy staging
gcloud run deploy rml-intranet-staging --image gcr.io/rmlintranet/rml-intranet:staging --region us-central1

# View logs
gcloud run services logs read rml-intranet-staging --region us-central1 --limit 50

# Test API
curl https://rml-intranet-forms-api-staging-xxx.run.app/api/cms/pages

# Build frontend
cd /tmp/Rmlintranetdesign && npm run build

# Build backend
cd /tmp/Rmlintranetdesign/backend && npm run build
```

---

## Contact & Support

**Questions?** Post in Slack or create GitHub issue

**Blocked?** Escalate to team lead

**GCP Access Issues?** Contact DevOps

---

**Ready to start? Begin with Day 1, Task 1.1! 🚀**
