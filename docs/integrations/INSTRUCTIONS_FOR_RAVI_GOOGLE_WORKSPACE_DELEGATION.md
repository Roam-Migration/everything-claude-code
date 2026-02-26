# Google Workspace Domain-Wide Delegation Setup

**For:** Ravi (System Administrator)
**From:** Jackson Taylor
**Date:** February 17, 2026
**Priority:** Normal
**Time Required:** 5 minutes

---

## Purpose

Enable the RML Intranet backend to read staff directory information from Google Workspace automatically. This allows the intranet to display current staff photos, departments, job titles, and contact information without manual updates.

**What this does:**
- ✅ Automatically sync staff profiles from Google Workspace to intranet
- ✅ Display current photos, departments, and org structure
- ✅ Eliminate duplicate data entry between Google Workspace and Notion
- ✅ Read-only access (cannot modify or delete anything)

**What this does NOT do:**
- ❌ No access to emails, calendars, or Drive files
- ❌ No ability to modify user data
- ❌ No access to sensitive information

---

## Prerequisites

- **Access Required:** Google Workspace Super Admin account
- **Account:** Must be signed in as a Super Admin (not just a regular admin)
- **Workspace:** roammigrationlaw.com

---

## Step-by-Step Instructions

### Step 1: Access Google Workspace Admin Console

1. Go to: **https://admin.google.com/**
2. Sign in with your Super Admin account
3. Verify you see the full Admin Console dashboard

---

### Step 2: Navigate to Domain-Wide Delegation

**Option A: Direct Link (Easiest)**
- Click this link: **https://admin.google.com/ac/owl/domainwidedelegation**

**Option B: Through Menu**
1. Click **Security** in the left sidebar
2. Click **Access and data control**
3. Click **API controls**
4. Scroll down to the **"Domain-wide delegation"** section
5. Click **"MANAGE DOMAIN WIDE DELEGATION"**

---

### Step 3: Add New Client

1. Click the **"Add new"** button (top right)

2. A dialog will appear titled **"Add a new client ID"**

---

### Step 4: Fill in the Client Details

**Client ID:**
```
106485902584507438101
```

**OAuth Scopes (copy and paste this exactly):**
```
https://www.googleapis.com/auth/admin.directory.user.readonly,https://www.googleapis.com/auth/admin.directory.orgunit.readonly
```

**Important Notes:**
- ✅ Include both scopes separated by a comma with NO SPACES
- ✅ Copy the entire line exactly as shown above
- ✅ Do not add quotes or extra characters

---

### Step 5: Authorize

1. Review the information:
   - Client ID: `106485902584507438101`
   - OAuth scopes: Two scopes for read-only directory access

2. Click **"AUTHORIZE"**

3. You should see a success message

4. The new entry should appear in the list of authorized clients

---

### Step 6: Verify

After authorizing, you should see an entry like this:

| Client ID | Client Name | Scopes |
|-----------|-------------|--------|
| 106485902584507438101 | rml-intranet-directory-reader@rmlintranet.iam.gserviceaccount.com | 2 scopes |

**If you click on it, you should see:**
- Scope 1: `https://www.googleapis.com/auth/admin.directory.user.readonly`
- Scope 2: `https://www.googleapis.com/auth/admin.directory.orgunit.readonly`

---

## Step 7: Notify Jackson

Once completed, please:
1. Send a quick confirmation: "Domain-wide delegation configured for intranet"
2. Include a screenshot of the authorized client (optional)

Jackson will then verify the integration is working correctly.

---

## What This Service Account Can Access

**Permissions Granted:**

✅ **Read-only access to:**
- User profiles (name, email, photo)
- Department assignments
- Job titles
- Phone numbers
- Office locations
- Organizational units
- Manager relationships

❌ **No access to:**
- Gmail messages
- Google Drive files
- Calendar events
- Any other Google Workspace services
- Ability to modify or delete data

---

## Troubleshooting

### Issue: "You don't have permission to access this page"

**Solution:** You need to be signed in as a Super Admin (not a delegated admin)
- Check with another Super Admin if you're not sure
- Verify at: Admin Console → Account → Admin roles

### Issue: "Client ID already exists"

**Solution:** The delegation was already configured (possibly by someone else)
- Check the existing authorized clients list
- Look for Client ID: `106485902584507438101`
- If found, no action needed - notify Jackson it's already set up

### Issue: "Invalid OAuth scopes"

**Solution:** Make sure you copied the scopes exactly:
- No extra spaces
- Comma between the two scopes
- No line breaks
- Copy directly from this document

### Issue: Page won't load

**Solution:**
1. Clear browser cache
2. Try in an incognito window
3. Use Chrome (recommended for Google Admin Console)

---

## Security Notes

- This follows Google's recommended practice for service accounts
- The service account uses a private key stored securely in Google Cloud
- Access is limited to the specific scopes listed above
- Can be revoked at any time through the same interface
- All API calls are logged in Google Workspace audit logs

---

## Technical Details (For Reference)

**Service Account Email:**
```
rml-intranet-directory-reader@rmlintranet.iam.gserviceaccount.com
```

**Project:**
- Name: rmlintranet
- ID: rmlintranet
- Purpose: RML Intranet backend services

**Scope Definitions:**
1. `admin.directory.user.readonly` - Read user profiles and basic info
2. `admin.directory.orgunit.readonly` - Read organizational structure

---

## Questions?

Contact Jackson Taylor:
- Email: j.taylor@roammigrationlaw.com
- Slack: @jackson
- Phone: [your number]

---

## Completion Checklist

- [ ] Signed in to Google Workspace Admin Console as Super Admin
- [ ] Navigated to Domain-wide delegation page
- [ ] Clicked "Add new"
- [ ] Entered Client ID: `106485902584507438101`
- [ ] Pasted OAuth scopes exactly as shown
- [ ] Clicked "AUTHORIZE"
- [ ] Verified new entry appears in authorized clients list
- [ ] Notified Jackson of completion

---

**Expected Time:** 5 minutes
**Difficulty:** Easy
**Risk Level:** Low (read-only access only)

Thank you for your help setting this up!
