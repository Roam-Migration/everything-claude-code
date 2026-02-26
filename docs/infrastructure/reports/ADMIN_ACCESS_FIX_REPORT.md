# RML Intranet Admin Access Fix Report

## Problem Summary

**User:** j.taylor@roammigrationlaw.com
**Issue:** User's role dropdown showed "Legal" instead of "Admin", and /admin/users page was not accessible

## Root Cause Analysis

### The Issue
The frontend was **not syncing the user's role from the backend API** to the UserRoleContext. Here's what was happening:

1. **Backend was correct:**
   - Database: `607e1339-3e1b-4ed4-b8dc-679be8f0c842` (Staff Directory)
   - User's role in Notion: "Admin" ✓
   - Backend `/api/user` endpoint returns: `role: "admin"` ✓

2. **Frontend was broken:**
   - `UserDropdown` component fetched `/api/user` successfully
   - But it **never called `setRole()`** to update the UserRoleContext
   - The context kept using the old value from localStorage: "legal-staff"
   - Result: Dropdown showed "Legal" and admin pages were blocked

### Why There Was Confusion About Databases

The problem description mentioned two databases:
- `607e1339-3e1b-4ed4-b8dc-679be8f0c842` - Staff Directory (Backend uses this) ✓
- `36c5a713-23a9-47b5-bbd0-b8d715d72056` - Core Data Framework (User updated this)

**The actual issue was NOT a database mismatch.** The backend was reading from the correct database and the role was correctly set to "Admin". The problem was purely a frontend synchronization bug.

## The Fix

### File Modified
`/tmp/Rmlintranetdesign/src/app/components/UserDropdown.tsx`

### Change Made
Added role synchronization in the `useEffect` that fetches user info:

```typescript
// BEFORE: Role was fetched but never synced to context
if (!cancelled && response.ok) {
  const data = await response.json();
  const email = parseIAPEmail(data.email || '');
  setUserInfo({
    email,
    name: data.name || emailToName(email),
    avatarUrl: data.avatarUrl || null,
  });
  // ❌ Missing: No setRole() call
}

// AFTER: Role is now synced from backend
if (!cancelled && response.ok) {
  const data = await response.json();
  const email = parseIAPEmail(data.email || '');
  setUserInfo({
    email,
    name: data.name || emailToName(email),
    avatarUrl: data.avatarUrl || null,
  });

  // ✅ Added: Sync role from backend to context
  if (data.role) {
    setRole(data.role as UserRole);
  }
}
```

### Flow After Fix

1. User loads intranet → `UserDropdown` mounts
2. `UserDropdown` fetches `/api/user`
3. Backend queries Notion database `607e1339...`
4. Backend finds user with role "Admin" in Notion
5. Backend converts to frontend format: "admin" (kebab-case)
6. Backend responds: `{ email: "j.taylor@...", role: "admin", ... }`
7. **Frontend now calls `setRole("admin")`** ✓
8. `UserRoleContext` updates to "admin" ✓
9. Dropdown displays "Admin" ✓
10. `/admin/users` page is accessible ✓

## Verification Steps

### Before Deployment
- [x] Verified role is "Admin" in Notion database
- [x] Confirmed backend returns correct role
- [x] Applied frontend fix
- [x] Built successfully

### After Deployment (Required)

1. **Clear Browser State:**
   ```javascript
   // Open browser console on intranet
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Sign in as j.taylor@roammigrationlaw.com**

3. **Check User Dropdown:**
   - Click the user avatar in top-right header
   - Verify dropdown shows "Admin" under "Your Role" section
   - Should NOT show "Legal Staff"

4. **Test Admin Access:**
   - Navigate to: https://intranet.roammigrationlaw.com/admin/users
   - Page should load successfully
   - Should show the user management table
   - Should NOT show "Access Denied" message

5. **Verify Role Persistence:**
   - Refresh the page
   - Role should remain "Admin"
   - Admin pages should remain accessible

## Database Information

### Source of Truth
**Database ID:** `607e1339-3e1b-4ed4-b8dc-679be8f0c842`
**Name:** Staff Directory
**Backend Configuration:** `/tmp/Rmlintranetdesign/backend/src/services/notion.ts` (line 10)

### Current Role Data
```
User: j.taylor@roammigrationlaw.com
Role in Notion: Admin
Page ID: 309e1901-e36e-81f6-a503-cabe90b5ea10
Page URL: https://www.notion.so/309e1901e36e81f6a503cabe90b5ea10
```

### Role Mapping
| Notion Format | Frontend Format | Display Format |
|--------------|----------------|----------------|
| Admin        | admin          | Admin          |
| Legal Staff  | legal-staff    | Legal Staff    |
| HR           | hr             | HR             |
| Operations   | operations     | Operations     |
| Team Leader  | team-leader    | Team Leader    |

## Files Modified

1. **Frontend:**
   - `/tmp/Rmlintranetdesign/src/app/components/UserDropdown.tsx`
   - Added role synchronization logic

2. **Build Output:**
   - `/tmp/Rmlintranetdesign/dist/` (updated with fix)

## Important Notes

### Why LocalStorage Clear is Necessary
The `UserRoleContext` initializes from localStorage:
```typescript
const [role, setRoleState] = useState<UserRole>(() => {
  const saved = localStorage.getItem('userRole');
  return (saved as UserRole) || 'legal-staff';
});
```

If localStorage has `userRole: "legal-staff"`, that will be the initial value. The fix ensures that after the API call completes, the role is updated from the backend. However, clearing localStorage ensures a clean state.

### No Backend Changes Required
The backend was already working correctly:
- ✓ Reading from the correct database
- ✓ Returning the correct role
- ✓ Role mapping working properly

### No Database Changes Required
The Notion database already has the correct data:
- ✓ User exists in database `607e1339...`
- ✓ Role is set to "Admin"
- ✓ Backend integration has access

## Related Files

- Backend service: `/tmp/Rmlintranetdesign/backend/src/services/notion.ts`
- Backend route: `/tmp/Rmlintranetdesign/backend/src/routes/user.ts`
- Backend role mapping: `/tmp/Rmlintranetdesign/backend/src/utils/roleMapping.ts`
- Frontend context: `/tmp/Rmlintranetdesign/src/app/contexts/UserRoleContext.tsx`
- Frontend role mapping: `/tmp/Rmlintranetdesign/src/app/utils/roleMapping.ts`
- Admin page: `/tmp/Rmlintranetdesign/src/app/pages/AdminUsersPage.tsx`

## Deployment

The fix is ready for deployment:
1. Build completed successfully ✓
2. Changes are in `/tmp/Rmlintranetdesign/dist/`
3. Deploy the dist folder to production
4. Have user clear browser cache/localStorage
5. Verify admin access works

## Troubleshooting

If the issue persists after deployment:

1. **Check Browser Console:**
   ```javascript
   // View current role in localStorage
   console.log(localStorage.getItem('userRole'));

   // View API response
   fetch('/api/user', { credentials: 'same-origin' })
     .then(r => r.json())
     .then(console.log);
   ```

2. **Check Backend Response:**
   - Ensure `/api/user` returns `role: "admin"`
   - Verify IAP headers are being forwarded correctly

3. **Clear All Browser Data:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear all site data in browser settings
   - Try incognito/private window

4. **Verify Notion Database:**
   - Check role is still "Admin" in Notion
   - Ensure backend has access to the database
