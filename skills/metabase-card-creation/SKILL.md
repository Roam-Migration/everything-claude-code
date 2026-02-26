# Metabase Card Creation Skill

## Purpose

Systematic workflow for creating Metabase dashboard cards with SQL Server query validation. Eliminates the 40% syntax error rate by validating queries before deployment.

## When to Use

- User requests a new Metabase card or visualization
- Creating cards for dashboards (especially SPQR project)
- Working with SQL Server databases in Metabase
- Need to query business metrics from Actionstep/htmigration data

## Prerequisites

- Metabase MCP server must be configured and running
- Access to htmigration SQL Server database (ID: 34)
- Understanding of the business domain (matters, billing, time entries)

## Required Tools

- `get-database-schema` - Explore database structure
- `validate-sql-server-query` - Check SQL Server syntax
- `test-metabase-query` - Execute and verify queries
- `get-existing-cards` - Learn from working examples
- `get-sql-server-syntax-guide` - Reference SQL Server patterns

## Workflow

### Phase 1: Understand Requirements

1. **Clarify the business question**
   - What metric/data does the user want to see?
   - What filters or parameters are needed?
   - What visualization type is appropriate?
   - What time range or grouping?

2. **Review similar existing cards** (if relevant)
   ```
   Use: get-existing-cards(collection_id="133", limit=10)
   Look for: Similar queries, working patterns, common joins
   ```

### Phase 2: Explore Data Schema

**CRITICAL: Always explore schema before writing queries**

1. **Identify relevant tables**
   ```
   Use: get-database-schema()
   Review: All available tables in htmigration
   ```

2. **Examine specific table structures**
   ```
   Use: get-database-schema(table_name="actions")
   Use: get-database-schema(table_name="time_entries")
   Verify: Column names, data types, relationships
   ```

3. **Note key tables for common use cases:**
   - `actions` - Matter/case records
   - `time_entries` - Time tracking data
   - `client_billing_invoices` - Invoicing
   - `dc_8_billing_schedule` - Billing schedules
   - `systemusers` - User/staff records

### Phase 3: Write SQL Server Query

**SQL Server Syntax Rules (Non-Negotiable)**

1. **Row Limiting**
   - ❌ NEVER use: `LIMIT 10`
   - ✅ ALWAYS use: `SELECT TOP 10`

2. **Date Functions**
   - ❌ NEVER use: `NOW()` or `INTERVAL`
   - ✅ ALWAYS use: `GETDATE()` and `DATEADD()`

3. **String Concatenation**
   - ❌ NEVER use: `||` operator
   - ✅ ALWAYS use: `+` or `CONCAT()`

4. **Type Casting**
   - ❌ NEVER use: `::INTEGER`
   - ✅ ALWAYS use: `CAST(field AS INT)`

5. **Table Qualification**
   - ✅ ALWAYS use fully qualified names: `"htmigration"."dbo"."table_name"`

6. **Null Handling**
   - ✅ PREFER: `ISNULL(field, 0)` over `COALESCE(field, 0)`

### Phase 4: Validate Syntax

**Before testing, always validate syntax**

```
Use: validate-sql-server-query(query="YOUR_QUERY")
Check for:
- valid: Must be true
- errors: Must be empty array
- warnings: Review and address if critical
- suggestions: Apply improvements
```

**If validation fails:**
1. Review errors carefully
2. Use `get-sql-server-syntax-guide` for correct patterns
3. Fix issues one by one
4. Re-validate until clean

### Phase 5: Test Query Execution

**After validation passes, test against live database**

```
Use: test-metabase-query(query="YOUR_QUERY", max_rows=10)
Verify:
- success: true
- columns: Expected column names
- rows: Sample data looks correct
- No runtime errors
```

**If test fails:**
1. Read error message carefully
2. Check table/column names exist (use get-database-schema)
3. Verify joins and relationships
4. Check data type compatibility
5. Re-test until successful

### Phase 6: Generate Deployment Script

**Only after successful testing**

Create Python deployment script following existing patterns:
- Card metadata (name, description, collection_id)
- SQL query (validated and tested)
- Visualization settings (chart type, axes, colors)
- Dashboard position (row, col, size)
- Parameters/filters if needed

### Phase 7: Deploy and Verify

1. User runs Python deployment script
2. Check Metabase for new card
3. Verify card displays correctly
4. Test any parameters/filters
5. Confirm card is in correct collection/dashboard

## Common Query Patterns

### Top N Records
```sql
SELECT TOP 10
    column1,
    column2,
    ISNULL(SUM(amount), 0) as total
FROM "htmigration"."dbo"."table_name"
WHERE condition = 'value'
GROUP BY column1, column2
ORDER BY total DESC
```

### Date Range - Last 30 Days
```sql
WHERE date_column >= DATEADD(day, -30, GETDATE())
```

### Date Range - Current Month
```sql
WHERE date_column >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
  AND date_column < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)
```

### Date Range - Current Year
```sql
WHERE YEAR(date_column) = YEAR(GETDATE())
```

### Safe Joins with Null Handling
```sql
SELECT
    a.action_name,
    ISNULL(SUM(b.amount), 0) as total_amount
FROM "htmigration"."dbo"."actions" a
LEFT JOIN "htmigration"."dbo"."billing" b
    ON a.action_id = b.action_id
GROUP BY a.action_name
```

## Pre-Deployment Checklist

- [ ] Schema explored for all tables used
- [ ] Query uses SQL Server syntax (no PostgreSQL/MySQL)
- [ ] `validate-sql-server-query` returns `valid: true`
- [ ] `test-metabase-query` returns sample data successfully
- [ ] All tables fully qualified: `"htmigration"."dbo"."table_name"`
- [ ] Date functions use `GETDATE()` and `DATEADD()`
- [ ] Row limiting uses `SELECT TOP N`
- [ ] Null handling uses `ISNULL()`
- [ ] Query tested with realistic filters/parameters
- [ ] Python deployment script follows existing patterns

## Error Recovery

### Common Errors and Fixes

**"Invalid object name 'actions'"**
- Fix: Use fully qualified name `"htmigration"."dbo"."actions"`

**"Incorrect syntax near 'LIMIT'"**
- Fix: Change `LIMIT 10` to `SELECT TOP 10`

**"'NOW' is not a recognized function"**
- Fix: Change `NOW()` to `GETDATE()`

**"Invalid column name"**
- Fix: Use `get-database-schema(table_name="...")` to verify column names

**"Operand type clash: date is incompatible with int"**
- Fix: Use `CAST()` or `CONVERT()` for type compatibility

## Success Metrics

### Target Outcomes
- Query syntax error rate: <10% (down from 40%)
- First-deployment success: >80%
- Time to deploy new card: <30 minutes
- Zero runtime errors on card load

### What Success Looks Like
1. Schema explored before query written ✅
2. Validation passes on first attempt ✅
3. Test query returns expected data ✅
4. Deploy script runs without errors ✅
5. Card displays correctly in dashboard ✅
6. No syntax-related redeploys needed ✅

## Anti-Patterns to Avoid

❌ **Writing queries without exploring schema first**
- Results in: Incorrect table/column names, failed queries

❌ **Assuming PostgreSQL/MySQL syntax works**
- Results in: 40% failure rate, wasted debugging time

❌ **Skipping validation step**
- Results in: Runtime errors, failed deployments

❌ **Testing queries manually instead of using MCP tools**
- Results in: Environment differences, inconsistent results

❌ **Deploying without testing**
- Results in: Production errors, broken dashboards

❌ **Using unqualified table names**
- Results in: Ambiguous references, query failures

## Integration with SPQR Project

### Specific Considerations
- Collection ID: 133 (SPQR)
- Database ID: 34 (htmigration)
- Common metrics: Matter profitability, WIP tracking, 48-hour compliance
- Business context: Fixed-fee immigration law firm (not hourly billing)

### Key Performance Indicators
- Milestone efficiency (not billable hours)
- WIP erosion tracking
- Compliance deadlines
- Staff workload distribution

### Deployment Context
- Python bridge scripts to Metabase API
- Figma designs as source of truth for layouts
- Two-pass deployment for dashboard ID linking
- No GUI dashboard creation (100% programmatic)

## Resources

- MCP Server: `mcp-servers/metabase/README.md`
- SQL Server Syntax Guide: Use `get-sql-server-syntax-guide` tool
- Existing Cards: Use `get-existing-cards` to learn patterns
- Database Schema: Use `get-database-schema` for exploration

## Questions During Execution

If uncertain about:
- **Business requirements**: Ask user for clarification
- **Table/column names**: Use `get-database-schema` to verify
- **SQL Server syntax**: Use `get-sql-server-syntax-guide`
- **Existing patterns**: Use `get-existing-cards` to see examples
- **Query correctness**: Use `validate-sql-server-query` and `test-metabase-query`

Never guess - always validate before deploying.
