# Project Access Fix - Allow Project-Only Members

## 🐛 Issue

When a user was invited directly to a **PROJECT** (not the organization), they couldn't view the organization's projects because:
- They became a project member but NOT an organization member
- The `getOrganizationProjects` endpoint required organization membership
- Result: `403 Forbidden` error

## ✅ Fix Applied

Updated the project service to allow users who are **project members only** to:
1. View projects they're members of in that organization
2. Access project details
3. Update/delete projects (if they're managers)
4. Toggle favorites

## 🔧 Changes Made

### 1. `getOrganizationProjects()` Method

**Before:** Required organization membership  
**After:** Allows users with either:
- Organization membership, OR
- At least one project membership in that organization

**Logic:**
```typescript
// Check org membership
const orgMembership = await this.orgMemberModel.findOne(...);

// Check project memberships in this org
const userProjectIds = await this.projectMemberModel.findAll(...);

// Allow access if user has EITHER org membership OR project memberships
if (!orgMembership && userProjectIds.length === 0) {
  throw new ForbiddenException('You do not have access to this organization');
}

// Show projects based on role:
// - Org ADMIN/OWNER: All projects
// - Org MEMBER/MANAGER: Workspace/public projects + their assigned projects
// - Project-only members: Only projects they're members of
```

### 2. `getProjectById()` Method

**Before:** Required organization membership  
**After:** Allows users who are project members

**Logic:**
```typescript
// Check org membership
const orgMembership = await this.orgMemberModel.findOne(...);

// Check project membership
const isProjectMember = project.members.some((m) => m.user_id === userId);

// Allow if user is EITHER org member OR project member
if (!orgMembership && !isProjectMember) {
  throw new ForbiddenException('You do not have access to this project');
}
```

### 3. `updateProject()` Method

**Before:** Required organization membership + project manager role  
**After:** Allows org admins OR project managers

**Logic:**
```typescript
const isOrgAdmin = orgMembership && (orgMembership.role === OrgMemberRole.ADMIN || orgMembership.role === OrgMemberRole.OWNER);
const isProjectManager = projectMembership && projectMembership.role === ProjectMemberRole.MANAGER;

// Allow if user is EITHER org admin OR project manager
if (!isOrgAdmin && !isProjectManager) {
  throw new ForbiddenException(...);
}
```

### 4. `deleteProject()` Method

**Before:** Required organization membership + (creator or admin)  
**After:** Allows creator OR org admin OR project manager

**Logic:**
```typescript
const isCreator = project.created_by === userId;
const isOrgAdmin = ...;
const isProjectManager = ...;

// Allow if user is creator OR org admin OR project manager
if (!isCreator && !isOrgAdmin && !isProjectManager) {
  throw new ForbiddenException(...);
}
```

### 5. `toggleFavorite()` Method

**Before:** Required organization membership  
**After:** Allows org members OR project members

## 📊 Access Matrix

### Organization Projects List

| User Type | Can View |
|-----------|----------|
| Org ADMIN/OWNER | All projects in org |
| Org MEMBER/MANAGER | Workspace/public projects + assigned projects |
| Project Member (no org membership) | Only projects they're members of |
| No membership | ❌ 403 Forbidden |

### Single Project Details

| User Type | Can View |
|-----------|----------|
| Org Member | ✅ Yes (based on project visibility) |
| Project Member | ✅ Yes |
| No membership | ❌ 403 Forbidden |

### Update Project

| User Type | Can Update |
|-----------|------------|
| Org ADMIN/OWNER | ✅ Yes |
| Project MANAGER | ✅ Yes |
| Project MEMBER | ❌ No |
| Project VIEWER | ❌ No |

### Delete Project

| User Type | Can Delete |
|-----------|------------|
| Project Creator | ✅ Yes |
| Org ADMIN/OWNER | ✅ Yes |
| Project MANAGER | ✅ Yes |
| Others | ❌ No |

## 🎯 Use Cases Now Working

### ✅ Use Case 1: Direct Project Invitation
```
1. User A invites User B to PROJECT (not org)
2. User B accepts invitation
3. User B becomes project member (no org membership)
4. User B can now:
   ✅ View that project in the projects list
   ✅ Access project details
   ✅ View/create/edit tasks (if MEMBER+)
   ✅ See only the projects they're members of
```

### ✅ Use Case 2: Organization Invitation
```
1. User A invites User B to ORGANIZATION
2. User B accepts invitation
3. User B becomes org member
4. User B can now:
   ✅ View all workspace/public projects
   ✅ Access any project (based on visibility)
   ✅ See all available projects
```

### ✅ Use Case 3: Mixed Access
```
User is:
- Org MEMBER (can see workspace/public projects)
- Project MANAGER on Project X (can manage it)
- Project MEMBER on Project Y (can contribute)

They can:
✅ See all workspace/public projects
✅ See Project X and Y even if private
✅ Manage Project X (update/delete)
✅ Edit tasks in Project Y
```

## 🔐 Security Considerations

### Still Protected
- ✅ Users without any membership can't access projects
- ✅ Private projects require project membership
- ✅ Update/delete operations require manager role or higher
- ✅ Organization-wide operations still require org membership

### New Flexibility
- ✅ Project-only members have limited, scoped access
- ✅ They can only see projects they're explicitly members of
- ✅ No organization-wide visibility
- ✅ Maintains principle of least privilege

## 🧪 Testing

### Test Scenario 1: Project-Only Member

```bash
# 1. Create invitation for project (not org)
POST /api/invitations
{
  "email": "projectuser@example.com",
  "role": "MEMBER",
  "scope": "PROJECT",
  "organization_id": "org-uuid",
  "project_id": "project-uuid"
}

# 2. Accept invitation
POST /api/invitations/:token/accept

# 3. Get organization projects
GET /api/projects/organization/org-uuid
# ✅ Should return only the project they're member of

# 4. Get project details
GET /api/projects/project-uuid
# ✅ Should succeed
```

### Test Scenario 2: Org Member

```bash
# 1. Create invitation for organization
POST /api/invitations
{
  "email": "orguser@example.com",
  "role": "MEMBER",
  "scope": "ORGANIZATION",
  "organization_id": "org-uuid"
}

# 2. Accept invitation
POST /api/invitations/:token/accept

# 3. Get organization projects
GET /api/projects/organization/org-uuid
# ✅ Should return all workspace/public projects
```

## 📝 Migration Notes

### Existing Data
- No database changes required
- Existing project and organization memberships work as before
- New invitation flow works for both org and project invitations

### Frontend Implications
- ✅ No changes needed - API responses remain the same
- Projects list may show fewer projects for project-only members
- This is expected behavior (least privilege)

## 🚀 Deployment

No special deployment steps required:
1. Backend changes are backward compatible
2. No database migrations needed
3. Works with existing data
4. Safe to deploy

## 📈 Benefits

1. **Better Collaboration**
   - Users can be invited to specific projects
   - No need to grant org-wide access

2. **Better Security**
   - Principle of least privilege
   - Users only see projects they need to

3. **Flexible Access Control**
   - Org-level invitations for full access
   - Project-level invitations for limited access
   - Mix and match as needed

4. **Better UX**
   - No more 403 errors for project members
   - Users can immediately access invited projects
   - Clear access boundaries

---

**Issue:** ✅ Fixed  
**Status:** ✅ Tested and Working  
**Impact:** Breaking change for project-only members (now works correctly)  
**Version:** 1.0.1