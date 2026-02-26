# SPQR MVP Iteration Summary

**Date:** 2026-02-15  
**Time Investment:** 45 minutes  
**Result:** 12 functional cards exploring formats, filters, and visualizations

---

## 📊 Card Inventory

### 1. Basic Tables (3 cards)

| Card | ID | Description |
|------|-----|-------------|
| Active Matters - All Fields | 1585 | Original MVP - complete view |
| Recent Activity - Last 30 Days | 1621 | Filtered by recent activity |
| Top 10 Busiest Staff | 1625 | Aggregated with 7-day activity |

### 2. Bar Charts (3 cards)

| Card | ID | Description |
|------|-----|-------------|
| Active Matters by Type | 1618 | Count grouped by matter type |
| Active Matters by Staff | 1619 | Workload distribution |
| Active Matters by Current Step | 1620 | Pipeline visualization |

### 3. KPIs (1 card)

| Card | ID | Description |
|------|-----|-------------|
| KPI: Total Active Matters | 1622 | Single metric display |

### 4. Visualizations (2 cards)

| Card | ID | Description |
|------|-----|-------------|
| Activity Timeline (Last 90 Days) | 1623 | Line chart showing trends |
| Matter Type Distribution | 1624 | Pie chart of proportions |

### 5. Interactive Filters (3 cards - FIXED)

| Card | ID | Description | Status |
|------|-----|-------------|--------|
| Filterable by Staff | 1628 | Optional text search | ✅ Fixed |
| Date Range Filter | 1629 | Optional date range | ✅ Fixed |
| Advanced Multi-Filter | 1630 | 5 filters combined | ✅ NEW |

---

## 🔧 Technical Learnings

### SQL Server Patterns That Work

✅ **Row Limiting:** `SELECT TOP N`  
✅ **Date Functions:** `GETDATE()`, `DATEADD()`  
✅ **Date Casting:** `CAST(date AS DATE)`  
✅ **Null Handling:** `ISNULL(field, default)`  
✅ **String Matching:** `LIKE '%' + @param + '%'`  
✅ **Qualified Names:** `"htmigration"."dbo"."actions"`

### Metabase Parameter Patterns

✅ **Optional Text Filter:**
```sql
WHERE ({{param}} IS NULL OR field LIKE '%' + {{param}} + '%')
```

✅ **Optional Date Filter:**
```sql
WHERE field >= ISNULL({{start}}, DATEADD(day, -90, GETDATE()))
```

✅ **Template Tag Config:**
```json
{
  "type": "text",
  "required": false,
  "default": null
}
```

---

## 📈 What Each Format Teaches Us

### Bar Charts (IDs: 1618, 1619, 1620)
**Best for:** Distribution analysis, comparison across categories  
**Insight:** Immediately shows which types/staff/steps have most matters  
**User value:** Quick visual understanding of workload/pipeline

### Tables (IDs: 1585, 1621, 1625, 1628, 1629, 1630)
**Best for:** Detail view, finding specific matters  
**Insight:** Users can drill into individual records  
**User value:** Operational work (find matter X, check status)

### KPIs (ID: 1622)
**Best for:** Executive summary, at-a-glance status  
**Insight:** Single number tells the story  
**User value:** Dashboard header, status monitoring

### Timeline (ID: 1623)
**Best for:** Trend analysis, identifying patterns  
**Insight:** Shows activity spikes, quiet periods  
**User value:** Resource planning, workload forecasting

### Pie Chart (ID: 1624)
**Best for:** Proportion understanding  
**Insight:** Which matter types dominate practice  
**User value:** Strategic planning, resource allocation

### Interactive Filters (IDs: 1628, 1629, 1630)
**Best for:** Self-service exploration  
**Insight:** Users can answer their own questions  
**User value:** Reduces ad-hoc report requests

---

## 🎯 Recommended Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  KPI: Total Active Matters (1622)                   │
├─────────────────────────────────────────────────────┤
│  Advanced Multi-Filter (1630)                       │
│  [Interactive table with all filters]               │
├──────────────────────┬──────────────────────────────┤
│  Matters by Type     │  Matters by Staff            │
│  (1618)              │  (1619)                      │
├──────────────────────┴──────────────────────────────┤
│  Activity Timeline (1623)                           │
├─────────────────────────────────────────────────────┤
│  Matters by Current Step (1620)                     │
└─────────────────────────────────────────────────────┘
```

**Rationale:**
- KPI at top = immediate status
- Multi-filter = power-user tool
- Bar charts = quick visual insights
- Timeline = trend awareness
- Pipeline = operational focus

---

## ✅ Success Metrics

### Speed
- ⚡ 45 minutes → 12 working cards
- ⚡ Iterate-test-fix cycle: <10 min per variation
- ⚡ Parameter debugging: 5 minutes

### Coverage
- ✅ 5 visualization types (table, bar, pie, line, scalar)
- ✅ 3 filter strategies (text, date, multi-param)
- ✅ 2 aggregation patterns (COUNT, COUNT with CASE)
- ✅ 2 time windows (30 days, 90 days)

### Quality
- ✅ All queries use correct SQL Server syntax
- ✅ All parameters optional with sensible defaults
- ✅ All cards return real data (1,811 active matters)
- ✅ Zero syntax errors on final versions

---

## 🚀 Next Steps

### Immediate (Next 30 min)
1. Add 5-6 cards to test dashboard (ID: 529)
2. Arrange in recommended layout
3. Share dashboard URL with 2-3 stakeholders
4. Collect initial feedback

### Short-term (Next week)
1. User testing with real staff members
2. Identify most-used cards
3. Refine based on actual usage
4. Add more filters to popular cards

### Medium-term (Next sprint)
1. Expand to other tables (time_entries, billing)
2. Create cross-table joins for KPIs
3. Build executive summary dashboard
4. Implement milestone efficiency calculations

---

## 💡 Key Insights

### What Waterfall Missed
- **Data structure discovery:** 25 fields in actions table, not documented
- **Status values:** Only 3 distinct values (Active, Inactive, Closed)
- **Staff distribution:** Uneven workload across team
- **Activity patterns:** Recent spike in Feb 2026
- **Current step diversity:** Multiple workflow stages

### What Iteration Revealed
- **Format flexibility:** Same data, 12+ useful views
- **Parameter complexity:** Multi-filter more powerful than single
- **Visualization impact:** Charts convey trends instantly
- **User empowerment:** Interactive filters reduce report requests
- **Technical validation:** SQL Server syntax now proven

### What We Can Reuse
- ✅ Base query pattern for all future cards
- ✅ Parameter templates for text/date filters
- ✅ Visualization configurations
- ✅ Dashboard layout structure
- ✅ Testing methodology

---

## 📁 Resources

**Dashboard:** https://wealth-fish.metabaseapp.com/dashboard/529  
**Collection:** https://wealth-fish.metabaseapp.com/collection/133  
**GitHub Repo:** https://github.com/Roam-Migration/SPQR

**Queries Saved:**
- `/tmp/spqr_mvp_query.sql` - Original MVP
- `/tmp/cards.json` - Batch 1 (bar charts)
- `/tmp/cards_batch2.json` - Batch 2 (KPIs/viz)
- `/tmp/cards_batch3.json` - Batch 3 (filters)

---

## 🎓 Lessons Learned

1. **Iteration beats speculation** - 45 min of building > weeks of planning
2. **Parameters need defaults** - Optional filters = better UX
3. **Format variety is cheap** - Same query, multiple views
4. **Real data reveals truth** - Assumptions fail, queries don't lie
5. **Early feedback is gold** - Show working cards, not specs

---

**Status:** ✅ MVP Validated | 🚀 Ready for User Testing | 📊 12 Cards Live
