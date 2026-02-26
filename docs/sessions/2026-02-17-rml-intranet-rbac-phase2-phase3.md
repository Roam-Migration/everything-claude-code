# RML Intranet RBAC Implementation - Phase 2 Fixes & Phase 3 Complete

**Date:** 2026-02-17
**Project:** RML Intranet (React SPA + Express API)
**Session Duration:** ~3 hours
**Branch:** `troubleshoot/notion-integration`

---

## Summary

Completed Phase 2 (Notion Integration) fixes and full Phase 3 (RBAC) implementation for RML Intranet. Fixed settings persistence issue, added avatar support, removed manual role switcher, and created admin user management interface.

---

## What Was Accomplished

### Phase 2 Fixes

**1. Settings Save Error Resolution**
- **Problem:** User reported "failed to save settings" toast but name was persisting
- **Root Cause:** Email parameter not being decoded in URL (@ symbol encoding)
- **Solution:** Added `decodeURIComponent()` to staff API route
- **Additional:** Comprehensive logging added to track request flow
- **Files Changed:**
  - `backend/src/routes/staff.ts` - Added debugging logs and email decoding
  - Enhanced error messages with details field

**2. Google Avatar Integration**
- **Problem:** User avatars not appearing (showing "authentication info unavailable")
- **Solution:** Implemented Gravatar fallback using MD5 hash of email
- **Behavior:** Auto-fetches avatar on first `/api/user` call, saves to Notion
- **Files Created:**
  - `backend/src/services/google-avatar.ts` - Avatar fetching service
- **Files Modified:**
  - `backend/src/routes/user.ts` - Integrated avatar fetching

### Phase 3 Implementation

**1. Removed Manual Role Switcher**
- Converted `UserDropdown.tsx` role selection UI to read-only display
- Removed `handleRoleChange()` function
- Added notice: "Roles are managed by administrators. Contact HR to request a role change."
- Simplified `ROLES` array to `ROLE_LABELS` record

**2. Created Admin User Management Page**
- **Route:** `/admin/users`
- **Access Control:** Admin and HR only (UI-level enforcement)
- **Features:**
  - Searchable staff directory table (name, email, department, location, role)
  - Inline role editing with dropdown selection
  - Color-coded role badges (Red=Admin, Pink=HR, Purple=Team Leader, Green=Operations, Blue=Legal Staff)
  - Confirm/cancel actions for safety
  - Real-time updates via `/api/staff/:email/role`
- **Files Created:**
  - `src/app/pages/AdminUsersPage.tsx` (411 lines)
- **Files Modified:**
  - `src/app/App.tsx` - Added route for admin page

**3. Notion Staff Directory Service**
- Full CRUD operations for Staff Directory database
- Functions:
  - `getStaffByEmail()` - Query by email
  - `updateStaffMember()` - Update profile fields
  - `updateStaffRole()` - Admin-only role changes
  - `listAllStaff()` - Fetch all staff (admin/HR only)
  - `mapNotionPageToStaffMember()` - Data transformation
- **Files Created:**
  - `backend/src/services/notion.ts` (197 lines)

**4. Staff API Routes**
- **GET /api/staff/:email** - Fetch staff by email (authenticated users)
- **PUT /api/staff/:email** - Update own record (name, phone, avatar, preferences)
- **PUT /api/staff/:email/role** - Admin-only role updates
- **GET /api/staff** - List all staff (admin/HR only)
- **Files Created:**
  - `backend/src/routes/staff.ts` (217 lines)
- **Files Modified:**
  - `backend/src/index.ts` - Registered staff router

**5. Role Mapping Utilities**
- Convert between Notion format ("Admin", "Legal Staff") and frontend format ("admin", "legal-staff")
- Functions:
  - `notionToFrontendRole()` - Notion → kebab-case
  - `frontendToNotionRole()` - kebab-case → Notion
  - `formatRoleForDisplay()` - Pretty formatting
- **Files Created:**
  - `src/app/utils/roleMapping.ts` (52 lines)

**6. Auth Middleware Updates**
- Extended role types to support all Notion roles: `admin | hr | team-leader | operations | legal-staff | manager | staff | contractor`
- Updated `determineRole()` function with note about Notion source of truth
- Updated `requireRole()` signature for new role types
- **Files Modified:**
  - `backend/src/middleware/auth.ts`

**7. Settings Page Updates**
- Load settings from Notion via `/api/user` (includes preferences from Notion)
- Save settings to Notion via `/api/staff/:email` PUT request
- Removed localStorage dependency (settings now persist after sign out)
- **Files Modified:**
  - `src/app/pages/SettingsPage.tsx`

**8. Documentation**
- Created Notion Staff Directory schema documentation
- **Files Created:**
  - `docs/NOTION_STAFF_DIRECTORY_SCHEMA.md` (248 lines)

---

## Technical Decisions

### 1. Gravatar Instead of Google People API
- **Decision:** Use Gravatar fallback for avatars
- **Rationale:**
  - Google People API requires OAuth scopes and additional setup
  - Gravatar provides reasonable fallback without API complexity
  - Many Google users have Gravatars linked to their email
- **Future:** Can enhance to Google People API with proper OAuth setup

### 2. Type Assertions for Notion SDK
- **Problem:** `notion.databases.query()` not recognized by TypeScript types
- **Solution:** Used `(notion.databases as any).query()` type assertion
- **Rationale:** Method exists at runtime, TypeScript types incomplete for SDK version
- **Note:** This is a workaround; future SDK updates may resolve

### 3. UI-Level Access Control
- **Decision:** Admin page uses client-side role checking
- **Rationale:**
  - Backend already enforces permissions on API routes
  - UI checks provide good UX (hide/show based on role)
  - Double layer: UI blocks access + API validates
- **Security:** Backend API is authoritative; UI is convenience layer

### 4. Email Decoding in Routes
- **Problem:** Email parameter in URL contains @ symbol
- **Solution:** Added `decodeURIComponent()` to all email parameter usage
- **Lesson:** Always decode URL parameters, especially with special characters

### 5. Role Format Consistency
- **Challenge:** Notion uses "Admin" (Title Case), frontend uses "admin" (kebab-case)
- **Solution:** Created bidirectional mapping utilities
- **Benefit:** Clean separation of concerns, easy to maintain

---

## Challenges and Solutions

### Challenge 1: Settings Save Error Despite Name Persisting

**Symptoms:**
- Toast showed "Failed to save settings"
- But name changes were persisting after sign out/sign in
- Confusing UX

**Investigation:**
- Added comprehensive logging to `/api/staff/:email` PUT endpoint
- Logged request email, user email, body contents
- Discovered email parameter encoding issue

**Root Cause:**
- Email in URL path had @ symbol: `/api/staff/j.taylor@roammigrationlaw.com`
- Express was receiving encoded version
- Comparison `req.user.email !== email` failed due to encoding mismatch

**Solution:**
```typescript
const decodedEmail = decodeURIComponent(email);
if (req.user.email !== decodedEmail) {
  // Now comparison works correctly
}
```

**Outcome:** Settings save now works correctly with proper success toast

### Challenge 2: Notion SDK Type Definitions

**Problem:**
- TypeScript compiler error: `Property 'query' does not exist on type '{ retrieve: ...; create: ...; update: ... }'`
- Method exists at runtime but types don't recognize it

**Attempted Solutions:**
1. ❌ Import type definitions manually
2. ❌ Update @notionhq/client version
3. ✅ Use type assertion: `(notion.databases as any).query()`

**Lesson:** Sometimes SDK types lag behind implementation; type assertions acceptable when runtime behavior confirmed

### Challenge 3: Role Management Access Control

**Consideration:** Who can change roles?
- **Option 1:** Only admin
- **Option 2:** Admin + HR
- **Decision:** Admin + HR (more flexible)

**Implementation:**
```typescript
const isAdmin = currentUserRole === 'admin' || currentUserRole === 'hr';
if (!isAdmin) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

**Rationale:** HR team should manage staff roles independently

---

## Key Metrics

### Code Changes
- **Files Modified:** 12
- **Files Created:** 7
- **Total Lines Added:** ~1,300
- **Total Lines Removed:** ~100

### Deployments
- **Backend:** Revision 00013 (3m 12s build time)
- **Frontend:** Revision 00039 (1m 49s build time)
- **Total Deployment Time:** ~5 minutes

### API Endpoints Created
- 4 new REST endpoints for staff management
- All with proper authentication and authorization

### Components Created
- 1 admin page (AdminUsersPage)
- 2 utility modules (roleMapping, google-avatar)
- 1 service module (notion staff directory)

---

## Lessons Learned

### 1. Always Decode URL Parameters
- URL encoding is automatic but decoding must be explicit
- Special characters (@ # %) require extra attention
- Test with real email addresses containing special chars

### 2. Comprehensive Logging for Debugging
- Added detailed logs at each step: request received, auth check, email comparison, Notion query
- Logs show exact values being compared (revealed encoding issue)
- Console logs acceptable for debugging; consider structured logging for production

### 3. Type Safety vs. Runtime Reality
- TypeScript types don't always match runtime behavior
- Type assertions acceptable when method existence verified
- Document why type assertion used (future maintainers)

### 4. Progressive Enhancement Strategy
- Start with simple solution (Gravatar fallback)
- Document future enhancement path (Google People API)
- Don't over-engineer initial implementation

### 5. UI + API Access Control
- UI-level checks improve UX (hide irrelevant features)
- API-level enforcement is security boundary
- Never trust client-side checks for security

### 6. Role-Based Architecture Planning
- Map out role hierarchy early
- Define permissions matrix before implementation
- Use enums/types for compile-time safety

### 7. Notion Integration Patterns
- Always fetch existing record before creating page
- Use expanded date format: `date:<property>:start`, `date:<property>:is_datetime`
- Type assertion may be needed for `databases.query()`

---

## Architecture Patterns Extracted

### Pattern 1: Bidirectional Enum Mapping
```typescript
// Define mappings in both directions
const notionToFrontend: Record<string, string> = { ... };
const frontendToNotion: Record<string, string> = { ... };

// Create conversion functions
export function notionToFrontendRole(role: string): string {
  return notionToFrontend[role] || default;
}
```

**Use Case:** When two systems use different formats for same concept
**Benefit:** Clean, testable, maintainable

### Pattern 2: Auto-Populate Missing Data
```typescript
// Fetch data
const staffMember = await getStaffByEmail(email);

// If field missing, fetch and save
if (!staffMember.avatarUrl) {
  const avatar = await getGoogleAvatarUrl(email);
  if (avatar) {
    await updateStaffMember(staffMember.id, { avatarUrl: avatar });
  }
}
```

**Use Case:** Lazy loading expensive data
**Benefit:** Improves first-load performance, data populated over time

### Pattern 3: Inline Edit with Confirm/Cancel
```typescript
// Track editing state
const [editingId, setEditingId] = useState<string | null>(null);
const [selectedValue, setSelectedValue] = useState<string>('');

// Start editing
const startEdit = (item) => {
  setEditingId(item.id);
  setSelectedValue(item.currentValue);
};

// Confirm
const confirm = async () => {
  await updateValue(editingId, selectedValue);
  setEditingId(null);
};

// Cancel
const cancel = () => {
  setEditingId(null);
  setSelectedValue('');
};
```

**Use Case:** Inline editing in tables
**Benefit:** Better UX than modal dialogs

---

## Future Enhancements

### Phase 4 Candidates

1. **Google People API Integration**
   - Replace Gravatar with actual Google Workspace profile pictures
   - Requires OAuth scope: `https://www.googleapis.com/auth/userinfo.profile`
   - Estimated effort: 5 hours

2. **Audit Logging Persistence**
   - Current: Console logging only
   - Future: Store role changes in audit table
   - Track: who changed what, when, from what to what
   - Estimated effort: 3 hours

3. **Route Guards (React Router)**
   - Protect admin routes at router level
   - Redirect unauthorized users to 403 page
   - Estimated effort: 2 hours

4. **Bulk Role Updates**
   - Select multiple staff members
   - Change roles in batch operation
   - Estimated effort: 4 hours

5. **Role Change Approval Workflow**
   - Non-admins request role change
   - Admins approve/reject requests
   - Email notifications
   - Estimated effort: 8 hours

6. **Department Management**
   - Admin interface for departments
   - Assign department heads
   - Department-level permissions
   - Estimated effort: 10 hours

---

## Testing Checklist

### Completed ✅
- [x] Settings save persists across sign out/sign in
- [x] Avatar appears (Gravatar fallback)
- [x] Role displayed as read-only in dropdown
- [x] Admin page accessible to admin/HR roles
- [x] Admin page hidden from non-admin roles
- [x] Inline role editing works
- [x] Role changes save to Notion
- [x] Search filters staff list correctly
- [x] Backend deployments successful
- [x] Frontend deployments successful

### Pending User Acceptance ⏳
- [ ] User confirms settings save works
- [ ] User confirms avatar displays correctly
- [ ] User tests admin role management
- [ ] User tests access control (non-admin can't access)

---

## Files Modified/Created

### Backend

**Created:**
- `backend/src/services/notion.ts` - Staff Directory CRUD service
- `backend/src/services/google-avatar.ts` - Avatar fetching service
- `backend/src/routes/staff.ts` - Staff management API routes

**Modified:**
- `backend/src/routes/user.ts` - Integrated avatar fetching and Notion lookup
- `backend/src/middleware/auth.ts` - Extended role types
- `backend/src/index.ts` - Registered staff router

### Frontend

**Created:**
- `src/app/pages/AdminUsersPage.tsx` - Admin user management UI
- `src/app/utils/roleMapping.ts` - Role format conversion utilities
- `src/app/types/documents.ts` - TypeScript type definitions

**Modified:**
- `src/app/components/UserDropdown.tsx` - Removed role switcher, read-only display
- `src/app/pages/SettingsPage.tsx` - Persist to Notion instead of localStorage
- `src/app/App.tsx` - Added admin users route

### Documentation

**Created:**
- `docs/NOTION_STAFF_DIRECTORY_SCHEMA.md` - Database schema specification
- `docs/sessions/2026-02-17-rml-intranet-rbac-phase2-phase3.md` - This document

---

## Deployment Details

### Backend API
- **Service:** rml-intranet-forms-api
- **Revision:** 00013
- **Build ID:** 0dcbb89e-9901-40f0-b3fe-13d26da8e3e1
- **Build Time:** 3m 12s
- **Status:** ✅ SUCCESS

### Frontend App
- **Service:** rml-intranet
- **Revision:** 00039
- **Build ID:** 01f5390b-040e-4190-9b63-e41399f8507b
- **Build Time:** 1m 49s
- **Status:** ✅ SUCCESS

### URLs
- **Frontend:** https://intranet.roammigrationlaw.com
- **Admin Page:** https://intranet.roammigrationlaw.com/admin/users
- **Backend API:** https://rml-intranet-forms-api-hmff5nrb3q-uc.a.run.app

---

## References

- **Project:** `/tmp/Rmlintranetdesign`
- **Handover:** `/tmp/Rmlintranetdesign/HANDOVER.md`
- **Notion Integration:** `docs/notion-integration.md`
- **RBAC Setup:** `/tmp/Rmlintranetdesign/docs/RBAC_SETUP_GUIDE.md`
- **Notion Database:** https://www.notion.so/36c5a71323a947b5bbd0b8d715d72056
- **Initial Staff Record:** https://www.notion.so/309e1901e36e81f6a503cabe90b5ea10

---

## Session Statistics

- **Duration:** ~3 hours
- **Context Used:** 128,000 / 200,000 tokens (64%)
- **Files Read:** 15
- **Files Written:** 19
- **Commands Executed:** 50+
- **Deployments:** 4 (2 backend, 2 frontend)
- **Git Commits:** 1 (12 files, 1,297 additions, 99 deletions)

---

**Session Completed:** 2026-02-17
**Next Session:** User acceptance testing, potential Phase 4 planning
