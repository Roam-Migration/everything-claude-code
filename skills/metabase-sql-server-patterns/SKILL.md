# Metabase SQL Server Patterns

## Purpose

Reference guide for SQL Server syntax patterns when creating Metabase queries. Prevents the most common PostgreSQL/MySQL syntax errors that cause 40% failure rates.

## Core Principle

**SQL Server is NOT PostgreSQL or MySQL**. Default database knowledge will produce broken queries. Always use SQL Server-specific syntax.

## Critical Syntax Differences

### 1. Row Limiting

**PostgreSQL/MySQL:**
```sql
SELECT * FROM table LIMIT 10
```

**SQL Server:**
```sql
SELECT TOP 10 * FROM table
```

**With ordering (recommended):**
```sql
SELECT TOP 10 *
FROM table
ORDER BY column DESC
```

**With percentage:**
```sql
SELECT TOP 10 PERCENT *
FROM table
ORDER BY column DESC
```

### 2. Date and Time Functions

#### Current Date/Time

**PostgreSQL/MySQL:**
```sql
NOW()
CURRENT_TIMESTAMP
```

**SQL Server:**
```sql
GETDATE()           -- Returns datetime
SYSDATETIME()       -- Returns datetime2 (more precise)
CURRENT_TIMESTAMP   -- Works but GETDATE() preferred
```

#### Date Arithmetic

**PostgreSQL:**
```sql
NOW() - INTERVAL '30 days'
NOW() - INTERVAL '1 month'
date_column + INTERVAL '7 days'
```

**SQL Server:**
```sql
DATEADD(day, -30, GETDATE())
DATEADD(month, -1, GETDATE())
DATEADD(day, 7, date_column)
```

**Common DATEADD units:**
- `year`, `quarter`, `month`, `week`, `day`
- `hour`, `minute`, `second`, `millisecond`

#### Date Truncation

**PostgreSQL:**
```sql
DATE_TRUNC('month', date_column)
DATE_TRUNC('day', date_column)
```

**SQL Server (start of month):**
```sql
DATEADD(month, DATEDIFF(month, 0, date_column), 0)
```

**SQL Server (start of day):**
```sql
DATEADD(day, DATEDIFF(day, 0, date_column), 0)
-- Or simply:
CAST(date_column AS DATE)
```

#### Date Difference

**PostgreSQL:**
```sql
date1 - date2  -- Returns interval
```

**SQL Server:**
```sql
DATEDIFF(day, date1, date2)     -- Returns integer
DATEDIFF(month, date1, date2)
DATEDIFF(year, date1, date2)
```

### 3. String Concatenation

**PostgreSQL/MySQL:**
```sql
field1 || field2
field1 || ' - ' || field2
CONCAT_WS('-', field1, field2, field3)
```

**SQL Server:**
```sql
field1 + field2
field1 + ' - ' + field2
CONCAT(field1, '-', field2, '-', field3)
```

**Note:** SQL Server `CONCAT()` auto-converts to strings and handles NULLs as empty strings.

### 4. Type Casting

**PostgreSQL:**
```sql
field::INTEGER
field::VARCHAR(50)
field::DATE
```

**SQL Server:**
```sql
CAST(field AS INT)
CAST(field AS VARCHAR(50))
CAST(field AS DATE)
-- Or:
CONVERT(INT, field)
CONVERT(VARCHAR(50), field)
CONVERT(DATE, field)
```

### 5. Boolean Values

**PostgreSQL:**
```sql
column BOOLEAN
WHERE active = TRUE
WHERE active = FALSE
```

**SQL Server:**
```sql
column BIT
WHERE active = 1
WHERE active = 0
```

### 6. NULL Handling

**PostgreSQL/MySQL:**
```sql
COALESCE(field, default_value)
COALESCE(field1, field2, field3)
```

**SQL Server (both work, ISNULL preferred for 2 args):**
```sql
ISNULL(field, default_value)         -- Faster for 2 arguments
COALESCE(field1, field2, field3)     -- Use for 3+ arguments
```

### 7. Case Sensitivity

**PostgreSQL:**
```sql
-- Case-sensitive by default
WHERE name = 'Smith'  -- Won't match 'SMITH'
```

**SQL Server:**
```sql
-- Case-insensitive by default (collation-dependent)
WHERE name = 'Smith'  -- Matches 'smith', 'SMITH', 'Smith'

-- Force case-sensitive:
WHERE name COLLATE Latin1_General_CS_AS = 'Smith'
```

### 8. String Functions

**PostgreSQL:**
```sql
LENGTH(string)
STRPOS(string, substring)
```

**SQL Server:**
```sql
LEN(string)                    -- Note: trims trailing spaces
DATALENGTH(string)             -- Includes trailing spaces
CHARINDEX(substring, string)   -- Returns position (1-based)
```

### 9. LIMIT with OFFSET

**PostgreSQL/MySQL:**
```sql
SELECT * FROM table
ORDER BY id
LIMIT 10 OFFSET 20
```

**SQL Server:**
```sql
SELECT * FROM table
ORDER BY id
OFFSET 20 ROWS
FETCH NEXT 10 ROWS ONLY
```

**Or for simpler cases:**
```sql
SELECT TOP 10 * FROM table
WHERE id NOT IN (SELECT TOP 20 id FROM table ORDER BY id)
ORDER BY id
```

### 10. Table and Column Qualification

**Recommended (explicit schema):**
```sql
SELECT *
FROM "htmigration"."dbo"."actions"
```

**Also works (implicit dbo):**
```sql
SELECT *
FROM "htmigration"..actions
```

**Minimum (not recommended):**
```sql
SELECT *
FROM actions
```

**Best practice:** Always use fully qualified names for clarity and performance.

## Common Metabase Query Patterns

### Pattern 1: Top N by Metric (Last 30 Days)

```sql
SELECT TOP 10
    a.action_name,
    ISNULL(COUNT(DISTINCT te.id), 0) as entry_count,
    ISNULL(SUM(te.hours), 0) as total_hours
FROM "htmigration"."dbo"."actions" a
LEFT JOIN "htmigration"."dbo"."time_entries" te
    ON a.action_id = te.action_id
    AND te.entry_date >= DATEADD(day, -30, GETDATE())
WHERE a.action_status = 'Open'
GROUP BY a.action_id, a.action_name
ORDER BY total_hours DESC
```

### Pattern 2: Current Month Aggregation

```sql
SELECT
    DATENAME(day, te.entry_date) as day_name,
    ISNULL(SUM(te.hours), 0) as hours
FROM "htmigration"."dbo"."time_entries" te
WHERE te.entry_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
  AND te.entry_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)
GROUP BY te.entry_date, DATENAME(day, te.entry_date)
ORDER BY te.entry_date
```

### Pattern 3: Year-over-Year Comparison

```sql
SELECT
    YEAR(invoice_date) as year,
    MONTH(invoice_date) as month,
    ISNULL(SUM(amount), 0) as total
FROM "htmigration"."dbo"."client_billing_invoices"
WHERE invoice_date >= DATEADD(year, -2, GETDATE())
GROUP BY YEAR(invoice_date), MONTH(invoice_date)
ORDER BY year, month
```

### Pattern 4: Rolling 12 Months

```sql
SELECT
    DATEADD(month, DATEDIFF(month, 0, invoice_date), 0) as month_start,
    ISNULL(SUM(amount), 0) as total
FROM "htmigration"."dbo"."client_billing_invoices"
WHERE invoice_date >= DATEADD(month, -12, GETDATE())
GROUP BY DATEADD(month, DATEDIFF(month, 0, invoice_date), 0)
ORDER BY month_start
```

### Pattern 5: Conditional Aggregation

```sql
SELECT
    a.action_name,
    ISNULL(SUM(CASE WHEN b.status = 'Paid' THEN b.amount ELSE 0 END), 0) as paid,
    ISNULL(SUM(CASE WHEN b.status = 'Pending' THEN b.amount ELSE 0 END), 0) as pending,
    ISNULL(SUM(b.amount), 0) as total
FROM "htmigration"."dbo"."actions" a
LEFT JOIN "htmigration"."dbo"."client_billing_invoices" b
    ON a.action_id = b.action_id
GROUP BY a.action_id, a.action_name
```

### Pattern 6: Ranking (Window Functions)

```sql
SELECT TOP 20
    action_name,
    revenue,
    ROW_NUMBER() OVER (ORDER BY revenue DESC) as rank
FROM (
    SELECT
        a.action_name,
        ISNULL(SUM(b.amount), 0) as revenue
    FROM "htmigration"."dbo"."actions" a
    LEFT JOIN "htmigration"."dbo"."client_billing_invoices" b
        ON a.action_id = b.action_id
    GROUP BY a.action_id, a.action_name
) ranked
ORDER BY rank
```

### Pattern 7: Moving Average

```sql
SELECT
    date_column,
    value,
    AVG(value) OVER (
        ORDER BY date_column
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_7day
FROM "htmigration"."dbo"."table_name"
ORDER BY date_column
```

## Date Range Quick Reference

```sql
-- Today
WHERE date_column >= CAST(GETDATE() AS DATE)
  AND date_column < DATEADD(day, 1, CAST(GETDATE() AS DATE))

-- Yesterday
WHERE date_column >= DATEADD(day, -1, CAST(GETDATE() AS DATE))
  AND date_column < CAST(GETDATE() AS DATE)

-- Last 7 days
WHERE date_column >= DATEADD(day, -7, GETDATE())

-- Last 30 days
WHERE date_column >= DATEADD(day, -30, GETDATE())

-- This week (Monday to today)
WHERE date_column >= DATEADD(day, 1-DATEPART(weekday, GETDATE()), CAST(GETDATE() AS DATE))

-- This month
WHERE date_column >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
  AND date_column < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)

-- Last month
WHERE date_column >= DATEADD(month, DATEDIFF(month, 0, GETDATE()) - 1, 0)
  AND date_column < DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)

-- This quarter
WHERE date_column >= DATEADD(quarter, DATEDIFF(quarter, 0, GETDATE()), 0)
  AND date_column < DATEADD(quarter, DATEDIFF(quarter, 0, GETDATE()) + 1, 0)

-- This year
WHERE YEAR(date_column) = YEAR(GETDATE())

-- Last 12 months
WHERE date_column >= DATEADD(month, -12, GETDATE())
```

## Performance Tips

### 1. Use ISNULL Instead of COALESCE for 2 Args
```sql
-- Faster:
ISNULL(field, 0)

-- Slower (for 2 arguments):
COALESCE(field, 0)

-- But use COALESCE for 3+ arguments:
COALESCE(field1, field2, field3, 0)
```

### 2. Avoid Functions on Indexed Columns in WHERE
```sql
-- Slow (can't use index):
WHERE YEAR(date_column) = 2024

-- Fast (can use index):
WHERE date_column >= '2024-01-01'
  AND date_column < '2025-01-01'
```

### 3. Use EXISTS Instead of IN for Subqueries
```sql
-- Slower:
WHERE action_id IN (SELECT action_id FROM other_table WHERE condition)

-- Faster:
WHERE EXISTS (SELECT 1 FROM other_table WHERE other_table.action_id = actions.action_id AND condition)
```

### 4. Avoid SELECT *
```sql
-- Slow and unclear:
SELECT * FROM table

-- Fast and clear:
SELECT action_id, action_name, action_status FROM table
```

## Common Mistakes to Avoid

1. ❌ Using `LIMIT` instead of `SELECT TOP`
2. ❌ Using `NOW()` instead of `GETDATE()`
3. ❌ Using `||` for concatenation
4. ❌ Using `::` for type casting
5. ❌ Using `INTERVAL` for date arithmetic
6. ❌ Forgetting schema qualification
7. ❌ Using `LENGTH()` instead of `LEN()`
8. ❌ Using `BOOLEAN` instead of `BIT`
9. ❌ Using functions on indexed columns in WHERE clause
10. ❌ Not handling NULL values appropriately

## Testing Your Query

Before deployment, always:

1. **Validate syntax**
   ```
   Use: validate-sql-server-query(query="...")
   ```

2. **Test execution**
   ```
   Use: test-metabase-query(query="...", max_rows=10)
   ```

3. **Check results**
   - Column names correct?
   - Data types expected?
   - Values reasonable?
   - NULL handling working?

## Resources

- Use `get-sql-server-syntax-guide` tool for quick reference
- Use `get-database-schema` to verify table/column names
- Use `get-existing-cards` to see working examples
- Refer to this skill for pattern templates

## Emergency Syntax Conversion

If you have a PostgreSQL/MySQL query that needs converting:

1. Replace `LIMIT N` with `SELECT TOP N` (move to start)
2. Replace `NOW()` with `GETDATE()`
3. Replace `INTERVAL 'N units'` with `DATEADD(unit, N, date)`
4. Replace `||` with `+` or `CONCAT()`
5. Replace `::type` with `CAST(value AS type)`
6. Add schema qualification: `"htmigration"."dbo".`
7. Replace `BOOLEAN` with `BIT`
8. Replace `TRUE/FALSE` with `1/0`
9. Validate and test before deploying

Never deploy a query without validation and testing.
