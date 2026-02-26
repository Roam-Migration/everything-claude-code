# SPQR Backend 500 Errors - Debugging Guide

**Priority:** HIGH
**Endpoints Failing:**
- `/api/forms/fallback-weekly-kpi/submissions?limit=10` → 500
- `/api/position-descriptions` → 500

---

## Step 1: Access Backend Logs

### Option A: PM2 (Node.js)
```bash
# View live logs
pm2 logs api-server

# View last 200 lines
pm2 logs api-server --lines 200

# View only errors
pm2 logs api-server --err

# Search for specific errors
pm2 logs api-server --lines 500 | grep -A 10 "500\|Error\|Exception"
```

### Option B: Docker
```bash
# Find container name
docker ps | grep api

# View live logs
docker logs -f <container-name>

# View last 200 lines
docker logs --tail 200 <container-name>

# Search for errors
docker logs --tail 500 <container-name> | grep -A 10 "500\|Error\|Exception"
```

### Option C: Systemd
```bash
# View live logs
journalctl -u api-server -f

# View last 200 lines
journalctl -u api-server -n 200

# View errors only
journalctl -u api-server -p err -n 100

# Search with timestamp
journalctl -u api-server --since "2026-02-17 05:20:00" | grep -A 10 "500"
```

### Option D: Log Files
```bash
# Common log locations
tail -f /var/log/api-server/error.log
tail -f /var/log/api-server/access.log
tail -f /var/log/nginx/error.log

# Search for 500 errors around 05:27 UTC
grep "2026-02-17.*05:2[67]" /var/log/api-server/*.log | grep "500\|error"
```

---

## Step 2: Test Endpoints Manually

### Test with curl (from server where backend runs)
```bash
# Test forms submission endpoint
curl -X GET \
  'http://localhost:8080/api/forms/fallback-weekly-kpi/submissions?limit=10' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -v

# Test position descriptions endpoint
curl -X GET \
  'http://localhost:8080/api/position-descriptions' \
  -H 'Accept: application/json' \
  -v
```

### Test with authentication (if required)
```bash
# If endpoints require auth token
curl -X GET \
  'http://localhost:8080/api/forms/fallback-weekly-kpi/submissions?limit=10' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -v
```

### Expected vs Actual Response
**Expected (200 OK):**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

**Actual (500 Error):**
```json
{
  "error": "Internal Server Error",
  "message": "..."
}
```

---

## Step 3: Common Causes Checklist

### ✅ Database Connection Issues

**Symptoms:**
- "Connection refused"
- "Too many connections"
- "Database timeout"

**Check:**
```bash
# Test database connection
# For PostgreSQL:
psql -h localhost -U dbuser -d dbname -c "SELECT 1;"

# For MySQL:
mysql -h localhost -u dbuser -p -e "SELECT 1;"

# For SQL Server:
sqlcmd -S localhost -U dbuser -P password -Q "SELECT 1"

# Check if database service is running
systemctl status postgresql
# OR
systemctl status mysql
# OR
docker ps | grep database
```

**Fix:**
- Restart database: `systemctl restart postgresql`
- Check connection pool settings in backend config
- Verify database credentials in `.env` file

---

### ✅ Missing Environment Variables

**Symptoms:**
- "undefined is not a function"
- "process.env.DB_PASSWORD is undefined"

**Check:**
```bash
# View environment variables for PM2 process
pm2 env 0

# OR check .env file
cat /path/to/backend/.env

# OR check Docker environment
docker exec <container-name> env
```

**Required variables (example):**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=htmigration
DB_USER=dbuser
DB_PASSWORD=secret
API_PORT=8080
METABASE_SECRET_KEY=your-secret-key
```

**Fix:**
```bash
# Update .env file
nano /path/to/backend/.env

# Restart backend to load new env vars
pm2 restart api-server
# OR
docker restart <container-name>
```

---

### ✅ SQL Query Errors

**Symptoms:**
- "Invalid column name"
- "Syntax error near..."
- "Table or view does not exist"

**Check logs for SQL errors:**
```bash
pm2 logs api-server | grep -i "sql\|query\|syntax"
```

**Common SQL Server specific issues:**
- Using PostgreSQL syntax (LIMIT instead of TOP)
- Using MySQL syntax (CONCAT instead of +)
- Column name case sensitivity
- Missing schema prefix (dbo.tablename)

**Test the query manually:**
```sql
-- Connect to SQL Server
sqlcmd -S localhost -U user -P pass

-- Test the query from your code
SELECT TOP 10 *
FROM fallback_weekly_kpi_submissions
ORDER BY created_at DESC;
```

**Fix:**
- Update query syntax in backend code
- Check column names match database schema
- Use SQL Server syntax (see metabase-sql-server-patterns skill)

---

### ✅ Table/Column Doesn't Exist

**Symptoms:**
- "Invalid object name 'tablename'"
- "Invalid column name 'columnname'"

**Check database schema:**
```sql
-- List all tables
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';

-- List columns for specific table
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'fallback_weekly_kpi_submissions';

-- Check if table exists with different case
SELECT name FROM sys.tables WHERE name LIKE '%fallback%';
```

**Fix:**
- Run database migrations: `npm run migrate`
- Update table/column names in code to match database
- Check if table name has schema prefix: `dbo.tablename`

---

### ✅ Permissions Issues

**Symptoms:**
- "SELECT permission denied"
- "The user does not have permission to perform this action"

**Check:**
```sql
-- Check user permissions
EXEC sp_helprotect NULL, 'username';

-- Grant necessary permissions
GRANT SELECT ON tablename TO username;
```

**Fix:**
- Grant required permissions to database user
- Use account with proper permissions
- Check IAM roles if using cloud database

---

### ✅ Uncaught Exceptions

**Symptoms:**
- Backend crashes and restarts
- "Unhandled Promise Rejection"
- "TypeError: Cannot read property..."

**Add error handling to route:**
```javascript
// BEFORE (crashes on error):
app.get('/api/forms/:formId/submissions', async (req, res) => {
  const data = await db.query('SELECT * FROM submissions WHERE form_id = ?', [req.params.formId]);
  res.json(data);
});

// AFTER (handles errors):
app.get('/api/forms/:formId/submissions', async (req, res) => {
  try {
    const data = await db.query(
      'SELECT * FROM submissions WHERE form_id = ?',
      [req.params.formId]
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});
```

---

### ✅ Memory Leaks / Out of Memory

**Symptoms:**
- "JavaScript heap out of memory"
- Backend slows down over time
- PM2 shows high memory usage

**Check:**
```bash
# Check memory usage
pm2 monit

# OR
docker stats <container-name>

# Check for memory leaks
node --expose-gc --max-old-space-size=4096 server.js
```

**Fix:**
- Increase memory limit: `pm2 start server.js --max-memory-restart 1G`
- Fix memory leaks (unclosed database connections, event listeners)
- Add pagination to queries returning large datasets

---

## Step 4: Enable Debug Logging

### Add detailed logging to backend:

```javascript
// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

// Add global error handler
app.use((err, req, res, next) => {
  console.error('=== ERROR ===');
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Body:', req.body);
  console.error('Query:', req.query);
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('=============');

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});
```

### Restart with debug mode:
```bash
# Node.js debug mode
DEBUG=* pm2 restart api-server

# OR set in code
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // HTTP request logger
}
```

---

## Step 5: Check Database Connectivity

### Test connection from backend:

```javascript
// Add a health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const result = await db.query('SELECT 1 AS health_check');

    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
```

### Test health endpoint:
```bash
curl http://localhost:8080/api/health
```

---

## Step 6: Specific Endpoint Debugging

### For `/api/forms/fallback-weekly-kpi/submissions?limit=10`

**Possible issues:**
1. Form ID "fallback-weekly-kpi" doesn't exist in database
2. Query parameter `limit=10` not being parsed correctly
3. Submissions table missing or renamed
4. Foreign key constraint failing

**Debug steps:**
```sql
-- Check if form exists
SELECT * FROM forms WHERE form_id = 'fallback-weekly-kpi';

-- Check if submissions table exists
SELECT TOP 10 * FROM form_submissions WHERE form_id = 'fallback-weekly-kpi';

-- Check table structure
EXEC sp_help 'form_submissions';
```

**Add logging to endpoint:**
```javascript
app.get('/api/forms/:formId/submissions', async (req, res) => {
  console.log('=== Form Submissions Request ===');
  console.log('formId:', req.params.formId);
  console.log('limit:', req.query.limit);

  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log('Parsed limit:', limit);

    const query = `
      SELECT TOP ${limit} *
      FROM form_submissions
      WHERE form_id = @formId
      ORDER BY created_at DESC
    `;
    console.log('Executing query:', query);

    const result = await db.query(query, { formId: req.params.formId });
    console.log('Query returned', result.length, 'rows');

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### For `/api/position-descriptions`

**Possible issues:**
1. Table `position_descriptions` doesn't exist
2. Missing JOIN causing null reference error
3. No data in table (returns empty array, backend tries to access property on undefined)

**Debug steps:**
```sql
-- Check if table exists
SELECT * FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'position_descriptions';

-- Check row count
SELECT COUNT(*) FROM position_descriptions;

-- Get sample data
SELECT TOP 10 * FROM position_descriptions;
```

---

## Step 7: Quick Fixes

### If endpoint returns empty data causing frontend crash:

```javascript
// Add null checks
app.get('/api/position-descriptions', async (req, res) => {
  try {
    const descriptions = await db.query('SELECT * FROM position_descriptions');

    // Return empty array if no data (don't let frontend get undefined)
    res.json({
      success: true,
      data: descriptions || [],
      count: descriptions?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching position descriptions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: [], // Always return data field, even on error
    });
  }
});
```

---

## Step 8: Verify Fix

### After applying fixes:

```bash
# Restart backend
pm2 restart api-server
# OR
docker restart <container-name>

# Test endpoints
curl http://localhost:8080/api/forms/fallback-weekly-kpi/submissions?limit=10
curl http://localhost:8080/api/position-descriptions

# Expected: Both return 200 OK with JSON data

# Check logs show no errors
pm2 logs api-server --lines 50
```

### Test from frontend:
1. Open https://intranet.roammigrationlaw.com/business-intelligence/spqr
2. Open browser DevTools Network tab
3. Filter by "forms" and "position"
4. Verify: Both endpoints return 200 OK
5. Verify: Frontend displays data correctly

---

## Summary of Action Items

- [ ] Access backend logs and find stack trace
- [ ] Test database connection
- [ ] Verify environment variables are loaded
- [ ] Test SQL queries manually
- [ ] Check table/column names exist
- [ ] Add error handling to endpoints
- [ ] Enable debug logging
- [ ] Add health check endpoint
- [ ] Restart backend after fixes
- [ ] Verify endpoints return 200 OK

---

**Once you identify the root cause from logs, let me know and I can provide specific code fixes!**
