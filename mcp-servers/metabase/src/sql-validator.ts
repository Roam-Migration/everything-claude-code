export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class SQLServerValidator {
  validate(query: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for LIMIT (PostgreSQL/MySQL)
    if (/\bLIMIT\s+\d+/i.test(query)) {
      errors.push('SQL Server does not support LIMIT. Use SELECT TOP N instead.');
      suggestions.push('Replace "LIMIT 10" with "SELECT TOP 10" at the start of the query.');
    }

    // Check for INTERVAL syntax
    if (/INTERVAL\s+['"]?\d+\s+\w+['"]?/i.test(query)) {
      errors.push('SQL Server does not support INTERVAL syntax for date calculations.');
      suggestions.push('Use DATEADD(day, -30, GETDATE()) instead of NOW() - INTERVAL \'30 days\'');
    }

    // Check for NOW()
    if (/\bNOW\s*\(\s*\)/i.test(query)) {
      warnings.push('NOW() is not standard SQL Server. Use GETDATE() or SYSDATETIME().');
      suggestions.push('Replace NOW() with GETDATE()');
    }

    // Check for CONCAT_WS
    if (/\bCONCAT_WS\s*\(/i.test(query)) {
      errors.push('SQL Server does not support CONCAT_WS function.');
      suggestions.push('Use CONCAT() with explicit separators or the + operator.');
    }

    // Check for COALESCE (while it exists, ISNULL is preferred)
    if (/\bCOALESCE\s*\(/i.test(query)) {
      warnings.push('COALESCE works in SQL Server, but ISNULL is more common and slightly faster.');
      suggestions.push('Consider using ISNULL(field, 0) instead of COALESCE(field, 0)');
    }

    // Check for missing schema qualification
    if (!/["']?htmigration["']?\s*\.\s*["']?dbo["']?\s*\./i.test(query)) {
      warnings.push('Tables should be fully qualified with schema: "htmigration"."dbo"."table_name"');
      suggestions.push('Use fully qualified table names for clarity and performance.');
    }

    // Check for || concatenation operator (PostgreSQL)
    if (/\|\|/.test(query)) {
      errors.push('SQL Server does not support || for string concatenation.');
      suggestions.push('Use CONCAT() function or + operator instead of ||');
    }

    // Check for :: type casting (PostgreSQL)
    if (/::/.test(query)) {
      errors.push('SQL Server does not support :: for type casting.');
      suggestions.push('Use CAST(value AS type) or CONVERT(type, value) instead of value::type');
    }

    // Check for DATE_TRUNC (PostgreSQL)
    if (/\bDATE_TRUNC\s*\(/i.test(query)) {
      errors.push('SQL Server does not support DATE_TRUNC.');
      suggestions.push('Use DATEADD and DATEDIFF for date truncation, e.g., DATEADD(day, DATEDIFF(day, 0, date_column), 0)');
    }

    // Check for BOOLEAN type
    if (/\bBOOLEAN\b/i.test(query)) {
      warnings.push('SQL Server does not have a BOOLEAN type. Use BIT instead.');
      suggestions.push('Replace BOOLEAN with BIT (0 = false, 1 = true)');
    }

    const valid = errors.length === 0;

    return {
      valid,
      errors,
      warnings,
      suggestions,
    };
  }

  getSyntaxGuide(): string {
    return `# SQL Server Syntax Guide for Metabase

## Critical Syntax Differences

### 1. Row Limiting
❌ PostgreSQL/MySQL: \`SELECT * FROM table LIMIT 10\`
✅ SQL Server: \`SELECT TOP 10 * FROM table\`

### 2. Date Functions
❌ \`NOW()\`
✅ \`GETDATE()\` or \`SYSDATETIME()\`

❌ \`NOW() - INTERVAL '30 days'\`
✅ \`DATEADD(day, -30, GETDATE())\`

❌ \`DATE_TRUNC('month', date_column)\`
✅ \`DATEADD(month, DATEDIFF(month, 0, date_column), 0)\`

### 3. String Concatenation
❌ \`field1 || field2\`
✅ \`field1 + field2\` or \`CONCAT(field1, field2)\`

❌ \`CONCAT_WS(',', field1, field2)\`
✅ \`CONCAT(field1, ',', field2)\` or \`field1 + ',' + field2\`

### 4. Null Handling
⚠️  \`COALESCE(field, 0)\` (works but slower)
✅ \`ISNULL(field, 0)\` (preferred)

### 5. Type Casting
❌ \`field::INTEGER\`
✅ \`CAST(field AS INT)\` or \`CONVERT(INT, field)\`

### 6. Boolean Values
❌ \`BOOLEAN\`
✅ \`BIT\` (0 = false, 1 = true)

### 7. Table Qualification
⚠️  \`FROM actions\`
✅ \`FROM "htmigration"."dbo"."actions"\`

Always use fully qualified table names with database and schema.

## Common Patterns for htmigration Database

### Date Ranges
\`\`\`sql
-- Last 30 days
WHERE date_column >= DATEADD(day, -30, GETDATE())

-- This month
WHERE date_column >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
  AND date_column < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)

-- This year
WHERE YEAR(date_column) = YEAR(GETDATE())
\`\`\`

### Top N with Ordering
\`\`\`sql
SELECT TOP 10
    column1,
    column2,
    SUM(amount) as total
FROM "htmigration"."dbo"."table_name"
GROUP BY column1, column2
ORDER BY total DESC
\`\`\`

### Null-Safe Aggregations
\`\`\`sql
SELECT
    ISNULL(SUM(amount), 0) as total_amount,
    ISNULL(AVG(value), 0) as avg_value
FROM "htmigration"."dbo"."table_name"
\`\`\`

## Key Tables in htmigration

- \`actions\` - Matter/case records
- \`time_entries\` - Time tracking
- \`client_billing_invoices\` - Invoicing data
- \`dc_8_billing_schedule\` - Billing schedules
- \`systemusers\` - User records

Always query schema first with get-database-schema to verify table and column names.

## Deployment Workflow

1. Use \`get-database-schema\` to understand available tables/columns
2. Write query using SQL Server syntax
3. Use \`validate-sql-server-query\` to check syntax
4. Use \`test-metabase-query\` to verify query works
5. Deploy via Python scripts once validated

## Error Prevention Checklist

- [ ] Used SELECT TOP instead of LIMIT
- [ ] Used GETDATE() instead of NOW()
- [ ] Used DATEADD/DATEDIFF for date math
- [ ] Used + or CONCAT() instead of ||
- [ ] Used CAST/CONVERT instead of ::
- [ ] Fully qualified table names with schema
- [ ] Used ISNULL instead of COALESCE (where possible)
- [ ] Tested query with test-metabase-query tool
`;
  }
}
