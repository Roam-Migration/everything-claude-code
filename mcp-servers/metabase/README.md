# Metabase MCP Server

MCP server for Metabase integration with SQL Server query validation. Helps Claude generate SQL Server-compatible queries instead of defaulting to PostgreSQL/MySQL syntax.

## Problem It Solves

When working with Metabase dashboards connected to **SQL Server** databases, Claude often generates PostgreSQL or MySQL syntax by default, leading to:
- 40%+ query failure rates on deployment
- Syntax debugging bottlenecks
- Multiple redeploy cycles
- Lost development time

This MCP server gives Claude the ability to:
1. **Explore your database schema** before writing queries
2. **Validate SQL Server syntax** before deployment
3. **Test queries live** against your Metabase instance
4. **Learn from existing cards** in your collections

## Features

### 5 Tools for Claude

1. **`get-database-schema`** - Query tables and columns from your database
2. **`validate-sql-server-query`** - Check SQL Server syntax compatibility
3. **test-metabase-query`** - Execute queries and see results/errors
4. **`get-existing-cards`** - Fetch working examples from collections
5. **`get-sql-server-syntax-guide`** - Reference SQL Server patterns

### SQL Server Syntax Validation

Automatically detects and corrects common errors:
- ❌ `LIMIT 10` → ✅ `SELECT TOP 10`
- ❌ `NOW()` → ✅ `GETDATE()`
- ❌ `NOW() - INTERVAL '30 days'` → ✅ `DATEADD(day, -30, GETDATE())`
- ❌ `field1 || field2` → ✅ `field1 + field2` or `CONCAT()`
- ❌ `field::INTEGER` → ✅ `CAST(field AS INT)`
- ⚠️  Missing schema qualification → ✅ `"database"."schema"."table"`

## Installation

### 1. Install Dependencies

```bash
cd mcp-servers/metabase
npm install
npm run build
```

### 2. Configure Credentials

```bash
cp .mcp.json.example .mcp.json
nano .mcp.json
```

Update with your values:
```json
{
  "metabase": {
    "command": "node",
    "args": ["/absolute/path/to/this/dir/dist/index.js"],
    "env": {
      "METABASE_URL": "https://your-instance.metabaseapp.com",
      "METABASE_API_KEY": "mb_xxxxxxxxxxxxx",
      "METABASE_DATABASE_ID": "34"
    }
  }
}
```

**Getting your API key:**
1. Go to Metabase Admin → Settings → Authentication
2. Create an API key
3. Copy the key (starts with `mb_`)

**Finding your Database ID:**
1. Go to Metabase Admin → Databases
2. Click your database
3. Check the URL: `/admin/databases/:id` ← this is your ID

### 3. Install to Claude Code

#### Option A: Global Installation (Recommended)
```bash
# Copy to Claude's MCP directory
mkdir -p ~/.claude/mcp-servers/metabase
cp -r . ~/.claude/mcp-servers/metabase/

# Link the config
mkdir -p ~/.claude/plugins/local/metabase
ln -sf ~/.claude/mcp-servers/metabase/.mcp.json ~/.claude/plugins/local/metabase/.mcp.json

# Create plugin metadata
cat > ~/.claude/plugins/local/metabase/plugin.json << 'EOF'
{
  "name": "metabase",
  "version": "1.0.0",
  "description": "Metabase integration for SQL Server query validation",
  "type": "mcp",
  "marketplace": "local"
}
EOF
```

#### Option B: Project-Specific Installation
Add to your project's `.claude/config.json`:
```json
{
  "mcpServers": {
    "metabase": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/metabase/dist/index.js"],
      "env": {
        "METABASE_URL": "https://your-instance.metabaseapp.com",
        "METABASE_API_KEY": "your_key",
        "METABASE_DATABASE_ID": "34"
      }
    }
  }
}
```

### 4. Restart Claude Code

```bash
# Exit and restart
/exit
claude
```

### 5. Test It Works

Try in Claude Code:
```
"Show me the SQL Server syntax guide"
```

Or:
```
"Get the schema for table actions"
```

If you see results, it's working! ✅

## Usage Examples

### Example 1: Exploring Database Schema

**User:** "What tables are available in my database?"

**Claude:**
1. Calls `get-database-schema()`
2. Returns list of all tables with field counts

**User:** "Show me columns in the actions table"

**Claude:**
1. Calls `get-database-schema(table_name="actions")`
2. Returns detailed field information (names, types, descriptions)

### Example 2: Validating Query Syntax

**User:** "Check if this SQL works: `SELECT * FROM actions LIMIT 10`"

**Claude:**
1. Calls `validate-sql-server-query(query="...")`
2. Detects: "LIMIT not supported in SQL Server"
3. Suggests: "Use SELECT TOP 10 instead"
4. Returns corrected query

### Example 3: Testing Queries Live

**User:** "Test this query: `SELECT TOP 5 action_name FROM actions`"

**Claude:**
1. Calls `test-metabase-query(query="...", max_rows=5)`
2. Executes against your Metabase instance
3. Returns sample results or error messages

### Example 4: Learning from Examples

**User:** "Show me existing queries that use time_entries"

**Claude:**
1. Calls `get-existing-cards(collection_id="133")`
2. Filters cards that reference time_entries
3. Shows working SQL examples

## Typical Workflow

### Creating a New Metabase Card

**Before MCP Server:**
1. User requests card
2. Claude writes PostgreSQL syntax
3. Generate deployment script
4. Deploy → **FAILS** (syntax error)
5. Debug and fix syntax manually
6. Redeploy → maybe works

**With MCP Server:**
1. User requests card
2. Claude checks schema with `get-database-schema`
3. Claude writes SQL Server-compatible query
4. Claude validates with `validate-sql-server-query` ✅
5. Claude tests with `test-metabase-query` ✅
6. Generate deployment script
7. Deploy → **SUCCESS** on first attempt

## SQL Server Syntax Reference

### Common Patterns

#### Row Limiting
```sql
-- ❌ PostgreSQL/MySQL
SELECT * FROM table LIMIT 10

-- ✅ SQL Server
SELECT TOP 10 * FROM table
```

#### Date Functions
```sql
-- ❌ Wrong
SELECT * FROM table WHERE date > NOW() - INTERVAL '30 days'

-- ✅ Correct
SELECT * FROM table WHERE date > DATEADD(day, -30, GETDATE())
```

#### String Concatenation
```sql
-- ❌ Wrong
SELECT first_name || ' ' || last_name FROM users

-- ✅ Correct
SELECT first_name + ' ' + last_name FROM users
-- OR
SELECT CONCAT(first_name, ' ', last_name) FROM users
```

#### Type Casting
```sql
-- ❌ Wrong
SELECT field::INTEGER FROM table

-- ✅ Correct
SELECT CAST(field AS INT) FROM table
```

#### Table Qualification
```sql
-- ⚠️ Works but not recommended
SELECT * FROM actions

-- ✅ Best practice
SELECT * FROM "database_name"."dbo"."actions"
```

## API Reference

### Tool: `get-database-schema`

**Parameters:**
- `table_name` (optional): Specific table to get details for

**Returns:**
- List of all tables (if no table_name)
- Detailed field information for specific table

**Example:**
```json
{
  "table": "actions",
  "schema": "dbo",
  "fields": [
    {"name": "action_id", "type": "type/Integer"},
    {"name": "action_name", "type": "type/Text"}
  ]
}
```

### Tool: `validate-sql-server-query`

**Parameters:**
- `query` (required): SQL query to validate

**Returns:**
```json
{
  "valid": false,
  "errors": ["SQL Server does not support LIMIT"],
  "warnings": ["Tables should be fully qualified"],
  "suggestions": ["Use SELECT TOP 10 instead of LIMIT 10"]
}
```

### Tool: `test-metabase-query`

**Parameters:**
- `query` (required): SQL query to test
- `max_rows` (optional): Maximum rows to return (default: 10)

**Returns:**
```json
{
  "success": true,
  "columns": ["action_id", "action_name"],
  "rows": [[1, "Matter A"], [2, "Matter B"]],
  "row_count": 2
}
```

### Tool: `get-existing-cards`

**Parameters:**
- `collection_id` (optional): Collection ID to query
- `limit` (optional): Max cards to return (default: 20)

**Returns:**
```json
{
  "collection_id": "133",
  "card_count": 5,
  "cards": [
    {
      "id": 123,
      "name": "Top Matters by Revenue",
      "sql_query": "SELECT TOP 10 ...",
      "visualization": "bar"
    }
  ]
}
```

### Tool: `get-sql-server-syntax-guide`

**Parameters:** None

**Returns:** Markdown-formatted syntax guide with examples

## Troubleshooting

### "Tool not available"
- Rebuild: `cd mcp-servers/metabase && npm run build`
- Check config: `cat ~/.claude/mcp-servers/metabase/.mcp.json`
- Restart Claude Code

### "API Key Invalid"
- Verify key in Metabase Admin → Settings
- Check `.mcp.json` has correct key
- Ensure no extra spaces/quotes

### "Database not found"
- Verify `METABASE_DATABASE_ID` matches your database
- Check Admin → Databases for correct ID

### "Query failed"
1. Use `get-database-schema` to verify table names
2. Use `validate-sql-server-query` to check syntax
3. Read error from `test-metabase-query`
4. Consult `get-sql-server-syntax-guide`

## Development

### Project Structure
```
mcp-servers/metabase/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── metabase-client.ts    # Metabase API wrapper
│   └── sql-validator.ts      # SQL Server syntax validator
├── dist/                      # Compiled output (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

### Building
```bash
npm run build        # Compile TypeScript
npm run watch       # Watch mode for development
```

### Testing Connection
```bash
# Test API connectivity
node dist/index.js
# Should output: "Metabase MCP Server running on stdio"
```

### Adding New Validation Rules

Edit `src/sql-validator.ts`:
```typescript
validate(query: string): ValidationResult {
  // Add new pattern detection
  if (/YOUR_PATTERN/.test(query)) {
    errors.push('Your error message');
    suggestions.push('Your suggestion');
  }
}
```

Then rebuild: `npm run build`

## Success Metrics

Track these improvements:
- **Query syntax error rate**: Target <10% (from 40%)
- **First-deployment success**: Target >80% (from 60%)
- **Iteration velocity**: Target 2-3x faster
- **Debugging time**: Target <15% (from 60%)

## Contributing

Contributions welcome! Areas for improvement:
- [ ] More SQL Server syntax patterns
- [ ] Support for other databases (PostgreSQL, MySQL, Oracle)
- [ ] Dashboard creation tools
- [ ] Query optimization suggestions
- [ ] Visual query builder integration

## License

MIT

## Credits

Built for the SPQR Dashboard Project to solve SQL Server syntax incompatibility when using Metabase with Claude Code.

**Use Case:** Fixed-fee immigration law firm needing financial visibility and operational tracking through programmatically-deployed BI dashboards.

## Related

- [Metabase Documentation](https://www.metabase.com/docs/latest/)
- [Metabase API Reference](https://www.metabase.com/docs/latest/api-documentation)
- [SQL Server T-SQL Reference](https://learn.microsoft.com/en-us/sql/t-sql/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
