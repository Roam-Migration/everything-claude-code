# CMS Implementation Guide
**Technical Reference for Development Team**

---

## Quick Start: Setting Up Staging Environment

### 1. Create Staging Cloud Run Service

```bash
# Navigate to project
cd /tmp/Rmlintranetdesign

# Set variables
export PROJECT_ID="rmlintranet"
export STAGING_SERVICE="rml-intranet-staging"
export REGION="us-central1"

# Build staging image
gcloud builds submit \
  --config cloudbuild.yaml \
  --project=$PROJECT_ID \
  --substitutions=_ENV=staging

# Deploy staging service
gcloud run deploy $STAGING_SERVICE \
  --image gcr.io/$PROJECT_ID/rml-intranet:latest \
  --region $REGION \
  --platform managed \
  --port 8080 \
  --set-env-vars="ENVIRONMENT=staging" \
  --allow-unauthenticated
```

### 2. Set Up Staging Database

```bash
# In Supabase dashboard:
# 1. Create new project: rml-intranet-staging
# 2. Note the connection string and anon key
# 3. Run migrations (see section below)

# Set environment variables in Cloud Run
gcloud run services update $STAGING_SERVICE \
  --update-env-vars="SUPABASE_URL=https://xxx.supabase.co" \
  --update-env-vars="SUPABASE_KEY=xxx" \
  --region $REGION
```

### 3. Configure Staging Domain

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service $STAGING_SERVICE \
  --domain staging.intranet.roammigrationlaw.com \
  --region $REGION

# Update DNS with provided records
```

---

## Database Migrations

### Initial CMS Schema Migration

```sql
-- migrations/001_cms_schema.sql

-- Enable UUID extension
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
CREATE INDEX idx_pages_parent ON pages(parent_id);

-- Page versions table (for history/rollback)
CREATE TABLE page_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  layout_config JSONB NOT NULL,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  change_summary TEXT,

  UNIQUE(page_id, version_number)
);

CREATE INDEX idx_page_versions_page_id ON page_versions(page_id);

-- Auto-increment version number trigger
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
  validation_rules JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,

  CONSTRAINT valid_form_status CHECK (status IN ('active', 'inactive', 'archived'))
);

CREATE INDEX idx_forms_slug ON forms(slug);
CREATE INDEX idx_forms_status ON forms(status);

-- Form submissions table
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  submitted_by UUID,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_submission_status CHECK (status IN ('pending', 'processed', 'archived', 'spam'))
);

CREATE INDEX idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_date ON form_submissions(submitted_at);

-- Content blocks (reusable components/templates)
CREATE TABLE content_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  is_template BOOLEAN DEFAULT false,
  category VARCHAR(100),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_blocks_type ON content_blocks(type);
CREATE INDEX idx_content_blocks_template ON content_blocks(is_template);
CREATE INDEX idx_content_blocks_category ON content_blocks(category);

-- Assets table (media library)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(500) NOT NULL,
  original_filename VARCHAR(500) NOT NULL,
  type VARCHAR(100) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  tags TEXT[],
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_asset_type CHECK (type IN ('image', 'video', 'document', 'audio', 'other'))
);

CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_uploader ON assets(uploaded_by);
CREATE INDEX idx_assets_filename ON assets(filename);

-- Audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  changes JSONB,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(performed_by);
CREATE INDEX idx_audit_log_date ON audit_log(performed_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- Updated timestamp trigger
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

CREATE TRIGGER update_content_blocks_updated_at
  BEFORE UPDATE ON content_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (adjust based on your auth system)
CREATE POLICY "Users can view published pages"
  ON pages FOR SELECT
  USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "Admins can manage all pages"
  ON pages FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'editor'));

-- Add more RLS policies as needed...
```

### Run Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL editor
# Copy and paste the migration SQL
```

---

## Backend API Implementation

### File Structure

```
backend/
├── src/
│   ├── index.ts                    # Express app entry
│   ├── config/
│   │   ├── supabase.ts            # Supabase client
│   │   └── env.ts                 # Environment config
│   ├── routes/
│   │   ├── pages.ts               # NEW: Pages CRUD
│   │   ├── page-versions.ts       # NEW: Version control
│   │   ├── forms.ts               # ENHANCE: Form builder
│   │   ├── form-submissions.ts    # Existing
│   │   ├── content-blocks.ts      # NEW: Block library
│   │   ├── assets.ts              # NEW: Media library
│   │   └── audit.ts               # NEW: Audit logs
│   ├── services/
│   │   ├── PageService.ts         # NEW
│   │   ├── FormService.ts         # ENHANCE
│   │   ├── AssetService.ts        # NEW
│   │   └── AuditService.ts        # NEW
│   ├── middleware/
│   │   ├── auth.ts                # Existing
│   │   ├── validation.ts          # NEW: Request validation
│   │   └── audit.ts               # NEW: Audit logging
│   └── types/
│       ├── page.ts                # NEW
│       ├── form.ts                # NEW
│       └── asset.ts               # NEW
```

### Example: Pages API Endpoint

```typescript
// backend/src/routes/pages.ts

import { Router } from 'express';
import { z } from 'zod';
import { PageService } from '../services/PageService';
import { authMiddleware } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';

const router = Router();
const pageService = new PageService();

// Validation schemas
const createPageSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  layout_config: z.object({
    blocks: z.array(z.any())
  }),
  meta: z.object({}).optional(),
  parent_id: z.string().uuid().optional()
});

const updatePageSchema = createPageSchema.partial();

// GET /api/pages - List all pages
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, author_id, parent_id } = req.query;

    const pages = await pageService.list({
      status: status as string,
      author_id: author_id as string,
      parent_id: parent_id as string
    });

    res.json({ success: true, data: pages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/pages/:id - Get single page
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const page = await pageService.getById(req.params.id);

    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/pages - Create new page
router.post('/', authMiddleware, auditMiddleware, async (req, res) => {
  try {
    const validated = createPageSchema.parse(req.body);

    const page = await pageService.create({
      ...validated,
      author_id: req.user.id,
      status: 'draft'
    });

    res.status(201).json({ success: true, data: page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/pages/:id - Update page
router.patch('/:id', authMiddleware, auditMiddleware, async (req, res) => {
  try {
    const validated = updatePageSchema.parse(req.body);

    const page = await pageService.update(req.params.id, validated);

    res.json({ success: true, data: page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/pages/:id/publish - Publish page
router.post('/:id/publish', authMiddleware, auditMiddleware, async (req, res) => {
  try {
    const page = await pageService.publish(req.params.id, req.user.id);

    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/pages/:id - Delete page
router.delete('/:id', authMiddleware, auditMiddleware, async (req, res) => {
  try {
    await pageService.delete(req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

### Example: Page Service

```typescript
// backend/src/services/PageService.ts

import { supabase } from '../config/supabase';
import { AuditService } from './AuditService';

export interface Page {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  layout_config: {
    blocks: any[];
  };
  meta: Record<string, any>;
  author_id: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export class PageService {
  private auditService = new AuditService();

  async list(filters: {
    status?: string;
    author_id?: string;
    parent_id?: string;
  } = {}): Promise<Page[]> {
    let query = supabase.from('pages').select('*').order('updated_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.author_id) {
      query = query.eq('author_id', filters.author_id);
    }
    if (filters.parent_id) {
      query = query.eq('parent_id', filters.parent_id);
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
      if (error.code === 'PGRST116') return null; // Not found
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

  async create(pageData: Omit<Page, 'id' | 'created_at' | 'updated_at'>): Promise<Page> {
    const { data, error } = await supabase
      .from('pages')
      .insert(pageData)
      .select()
      .single();

    if (error) throw error;

    // Create initial version
    await this.createVersion(data.id, data.layout_config, pageData.author_id, 'Initial version');

    await this.auditService.log({
      entity_type: 'page',
      entity_id: data.id,
      action: 'create',
      performed_by: pageData.author_id
    });

    return data as Page;
  }

  async update(id: string, updates: Partial<Page>): Promise<Page> {
    const { data, error } = await supabase
      .from('pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create new version if layout changed
    if (updates.layout_config) {
      await this.createVersion(id, updates.layout_config, updates.author_id!, 'Updated layout');
    }

    return data as Page;
  }

  async publish(id: string, userId: string): Promise<Page> {
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

    await this.auditService.log({
      entity_type: 'page',
      entity_id: id,
      action: 'publish',
      performed_by: userId
    });

    return data as Page;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async createVersion(
    pageId: string,
    layoutConfig: any,
    userId: string,
    summary: string
  ): Promise<void> {
    const { error } = await supabase
      .from('page_versions')
      .insert({
        page_id: pageId,
        layout_config: layoutConfig,
        created_by: userId,
        change_summary: summary
      });

    if (error) throw error;
  }

  async getVersions(pageId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('page_versions')
      .select('*')
      .eq('page_id', pageId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data;
  }

  async restoreVersion(pageId: string, versionId: string, userId: string): Promise<Page> {
    // Get version
    const { data: version, error: versionError } = await supabase
      .from('page_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (versionError) throw versionError;

    // Update page with version layout
    const page = await this.update(pageId, {
      layout_config: version.layout_config,
      author_id: userId
    });

    await this.auditService.log({
      entity_type: 'page',
      entity_id: pageId,
      action: 'restore_version',
      performed_by: userId,
      changes: { version_id: versionId }
    });

    return page;
  }
}
```

---

## Frontend Implementation

### Page Builder Component Architecture

```
src/app/components/PageBuilder/
├── index.tsx                      # Main PageBuilder component
├── BlockLibrary.tsx               # Left sidebar with available blocks
├── Canvas.tsx                     # Center drag-and-drop canvas
├── PropertyPanel.tsx              # Right sidebar for block config
├── BlockRenderer.tsx              # Renders blocks in canvas
├── blocks/
│   ├── HeroBlock.tsx
│   ├── TextBlock.tsx
│   ├── ImageBlock.tsx
│   ├── CardGridBlock.tsx
│   ├── NotionTableBlock.tsx
│   ├── ChartBlock.tsx
│   └── index.ts                   # Block registry
├── hooks/
│   ├── usePageBuilder.ts          # State management
│   ├── useDragDrop.ts             # DnD logic
│   └── useBlockConfig.ts          # Block configuration
└── types.ts                       # TypeScript types
```

### Example: Main PageBuilder Component

```typescript
// src/app/components/PageBuilder/index.tsx

import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BlockLibrary } from './BlockLibrary';
import { Canvas } from './Canvas';
import { PropertyPanel } from './PropertyPanel';
import { usePageBuilder } from './hooks/usePageBuilder';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export interface PageBuilderProps {
  pageId?: string;  // If editing existing page
  initialBlocks?: PageBuilderBlock[];
  onSave?: (blocks: PageBuilderBlock[]) => Promise<void>;
}

export function PageBuilder({ pageId, initialBlocks = [], onSave }: PageBuilderProps) {
  const {
    blocks,
    selectedBlock,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    selectBlock,
    undo,
    redo,
    canUndo,
    canRedo
  } = usePageBuilder(initialBlocks);

  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(blocks);
      toast.success('Page saved successfully');
    } catch (error) {
      toast.error('Failed to save page');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="h-screen flex flex-col"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Toolbar */}
        <div className="h-16 border-b bg-white px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Page Builder</h1>
            {pageId && <span className="text-sm text-gray-500">ID: {pageId}</span>}
          </div>

          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Cmd+Z)"
            >
              ↶ Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Cmd+Shift+Z)"
            >
              ↷ Redo
            </Button>

            {/* Mode Toggle */}
            <div className="border rounded-md">
              <Button
                variant={mode === 'edit' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('edit')}
              >
                Edit
              </Button>
              <Button
                variant={mode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('preview')}
              >
                Preview
              </Button>
            </div>

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="ml-2"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Block Library (Left) */}
          {mode === 'edit' && (
            <div className="w-64 border-r bg-gray-50 overflow-y-auto">
              <BlockLibrary onAddBlock={addBlock} />
            </div>
          )}

          {/* Canvas (Center) */}
          <div className="flex-1 overflow-y-auto bg-gray-100">
            <Canvas
              blocks={blocks}
              mode={mode}
              selectedBlockId={selectedBlock?.id}
              onSelectBlock={selectBlock}
              onUpdateBlock={updateBlock}
              onDeleteBlock={deleteBlock}
              onReorderBlocks={reorderBlocks}
            />
          </div>

          {/* Property Panel (Right) */}
          {mode === 'edit' && selectedBlock && (
            <div className="w-80 border-l bg-white overflow-y-auto">
              <PropertyPanel
                block={selectedBlock}
                onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                onDelete={() => deleteBlock(selectedBlock.id)}
              />
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}
```

### Example: Canvas Component with Drag-and-Drop

```typescript
// src/app/components/PageBuilder/Canvas.tsx

import React from 'react';
import { useDrop } from 'react-dnd';
import { BlockRenderer } from './BlockRenderer';
import { PageBuilderBlock } from './types';

export interface CanvasProps {
  blocks: PageBuilderBlock[];
  mode: 'edit' | 'preview';
  selectedBlockId?: string;
  onSelectBlock: (block: PageBuilderBlock) => void;
  onUpdateBlock: (id: string, updates: Partial<PageBuilderBlock>) => void;
  onDeleteBlock: (id: string) => void;
  onReorderBlocks: (dragIndex: number, hoverIndex: number) => void;
}

export function Canvas({
  blocks,
  mode,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onReorderBlocks
}: CanvasProps) {
  const [{ isOver }, drop] = useDrop({
    accept: ['BLOCK', 'NEW_BLOCK'],
    drop: (item: any, monitor) => {
      // Handle drop from block library (new block)
      if (item.type === 'NEW_BLOCK') {
        // onAddBlock will be called by BlockLibrary
        return;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <div
      ref={drop}
      className={`max-w-5xl mx-auto py-8 px-4 min-h-full ${
        isOver ? 'bg-blue-50' : ''
      }`}
    >
      {blocks.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">⬇️</div>
          <p className="text-lg">Drag blocks here to start building your page</p>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <BlockRenderer
              key={block.id}
              block={block}
              index={index}
              mode={mode}
              isSelected={block.id === selectedBlockId}
              onSelect={() => onSelectBlock(block)}
              onUpdate={(updates) => onUpdateBlock(block.id, updates)}
              onDelete={() => onDeleteBlock(block.id)}
              onMove={onReorderBlocks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Example: Block Registry

```typescript
// src/app/components/PageBuilder/blocks/index.ts

import { HeroBlock } from './HeroBlock';
import { TextBlock } from './TextBlock';
import { ImageBlock } from './ImageBlock';
import { CardGridBlock } from './CardGridBlock';
import { NotionTableBlock } from './NotionTableBlock';

export interface BlockDefinition {
  type: string;
  label: string;
  icon: string;
  description: string;
  category: 'content' | 'layout' | 'data' | 'media';
  component: React.ComponentType<any>;
  defaultConfig: any;
}

export const blockRegistry: Record<string, BlockDefinition> = {
  hero: {
    type: 'hero',
    label: 'Hero Section',
    icon: '🦸',
    description: 'Large header section with title and CTA',
    category: 'content',
    component: HeroBlock,
    defaultConfig: {
      title: 'Welcome to Our Platform',
      subtitle: 'Build amazing intranets with ease',
      backgroundImage: '',
      ctaText: 'Get Started',
      ctaLink: '#'
    }
  },

  text: {
    type: 'text',
    label: 'Text',
    icon: '📝',
    description: 'Rich text content block',
    category: 'content',
    component: TextBlock,
    defaultConfig: {
      content: '<p>Start typing...</p>',
      alignment: 'left'
    }
  },

  image: {
    type: 'image',
    label: 'Image',
    icon: '🖼️',
    description: 'Single image with caption',
    category: 'media',
    component: ImageBlock,
    defaultConfig: {
      src: '',
      alt: '',
      caption: '',
      width: '100%'
    }
  },

  cardGrid: {
    type: 'cardGrid',
    label: 'Card Grid',
    icon: '📇',
    description: 'Grid of cards with title and description',
    category: 'layout',
    component: CardGridBlock,
    defaultConfig: {
      columns: 3,
      cards: [
        { title: 'Card 1', description: 'Description', icon: '🎯' },
        { title: 'Card 2', description: 'Description', icon: '🚀' },
        { title: 'Card 3', description: 'Description', icon: '💡' }
      ]
    }
  },

  notionTable: {
    type: 'notionTable',
    label: 'Notion Table',
    icon: '📊',
    description: 'Embed Notion database as table',
    category: 'data',
    component: NotionTableBlock,
    defaultConfig: {
      databaseId: '',
      title: 'Database Table',
      visibleColumns: [],
      maxRows: 50
    }
  }
};

export const blockCategories = {
  content: { label: 'Content', blocks: ['hero', 'text'] },
  layout: { label: 'Layout', blocks: ['cardGrid', 'container', 'columns'] },
  data: { label: 'Data', blocks: ['notionTable', 'chart'] },
  media: { label: 'Media', blocks: ['image', 'video'] }
};
```

---

## Testing Strategy

### Unit Tests

```typescript
// src/app/components/PageBuilder/__tests__/usePageBuilder.test.ts

import { renderHook, act } from '@testing-library/react';
import { usePageBuilder } from '../hooks/usePageBuilder';

describe('usePageBuilder', () => {
  it('should add a block', () => {
    const { result } = renderHook(() => usePageBuilder([]));

    act(() => {
      result.current.addBlock({
        type: 'text',
        config: { content: 'Hello' }
      });
    });

    expect(result.current.blocks).toHaveLength(1);
    expect(result.current.blocks[0].type).toBe('text');
  });

  it('should support undo/redo', () => {
    const { result } = renderHook(() => usePageBuilder([]));

    act(() => {
      result.current.addBlock({ type: 'text', config: {} });
    });

    expect(result.current.blocks).toHaveLength(1);

    act(() => {
      result.current.undo();
    });

    expect(result.current.blocks).toHaveLength(0);

    act(() => {
      result.current.redo();
    });

    expect(result.current.blocks).toHaveLength(1);
  });
});
```

### E2E Tests with Playwright

```typescript
// tests/page-builder.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Page Builder', () => {
  test('should create a new page with blocks', async ({ page }) => {
    await page.goto('/admin/pages/new');

    // Drag hero block to canvas
    await page.dragAndDrop(
      '[data-block-type="hero"]',
      '[data-canvas]'
    );

    // Verify block added
    await expect(page.locator('[data-block-id]')).toHaveCount(1);

    // Configure block
    await page.click('[data-block-id]');
    await page.fill('[name="title"]', 'Welcome!');

    // Save page
    await page.click('button:has-text("Save")');

    // Verify saved
    await expect(page.locator('.toast')).toContainText('saved successfully');
  });

  test('should publish a page', async ({ page }) => {
    // Create page first
    await page.goto('/admin/pages/new');
    // ... add blocks ...

    // Publish
    await page.click('button:has-text("Publish")');

    // Verify published
    await expect(page.locator('[data-status="published"]')).toBeVisible();
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Database migrations run successfully
- [ ] All environment variables configured
- [ ] Staging environment tested
- [ ] E2E tests passing
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Documentation updated

### Staging Deployment

```bash
# Deploy to staging
gcloud builds submit \
  --config cloudbuild.yaml \
  --project=rmlintranet \
  --substitutions=_ENV=staging,_SERVICE_NAME=rml-intranet-staging

# Verify deployment
curl -I https://staging.intranet.roammigrationlaw.com
```

### Production Deployment

```bash
# Deploy to production
gcloud builds submit \
  --config cloudbuild.yaml \
  --project=rmlintranet

# Route traffic to new revision
gcloud run services update-traffic rml-intranet \
  --to-latest \
  --region=us-central1

# Verify
curl -I https://intranet.roammigrationlaw.com
```

### Post-Deployment

- [ ] Smoke tests on production
- [ ] Monitor error logs for 24 hours
- [ ] User acceptance testing
- [ ] Performance monitoring
- [ ] Backup verification

---

## Performance Optimization

### Frontend Optimizations

1. **Code Splitting:**
```typescript
// Lazy load page builder
const PageBuilder = React.lazy(() => import('./components/PageBuilder'));
```

2. **Virtual Scrolling:**
```typescript
// For long lists of blocks
import { FixedSizeList } from 'react-window';
```

3. **Memoization:**
```typescript
const BlockRenderer = React.memo(({ block }) => {
  // Only re-render when block changes
});
```

### Backend Optimizations

1. **Database Indexes:** Already added in migration
2. **Caching:**
```typescript
// Cache published pages
const redis = new Redis();
const cacheKey = `page:${slug}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

3. **Query Optimization:**
```typescript
// Use select() to fetch only needed fields
.select('id, title, slug, status')
```

---

## Security Considerations

### Input Validation

```typescript
// Sanitize user input
import DOMPurify from 'isomorphic-dompurify';

const sanitized = DOMPurify.sanitize(userInput);
```

### CSP Headers

```nginx
# In nginx.conf.template
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### RLS Policies

Ensure all database tables have proper Row Level Security policies.

---

## Monitoring & Observability

### Logging

```typescript
// Structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

logger.info('Page created', {
  pageId: page.id,
  userId: user.id,
  timestamp: new Date()
});
```

### Metrics

```typescript
// Track page builder usage
import { track } from './analytics';

track('page_builder.block_added', {
  blockType: block.type,
  userId: user.id
});
```

### Alerts

Set up alerts in Google Cloud Monitoring:
- Error rate > 1%
- Response time > 2s (p95)
- Memory usage > 80%

---

## Next Steps

1. **Review this guide** with the development team
2. **Set up staging environment** (Day 1)
3. **Run database migrations** (Day 1)
4. **Start implementing backend APIs** (Week 1)
5. **Begin page builder frontend** (Week 2)

**Questions?** Create an issue in the GitHub repo or contact the team lead.

---

**Document Version:** 1.0
**Last Updated:** February 18, 2026
