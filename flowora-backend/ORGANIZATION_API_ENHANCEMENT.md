# Organization API Enhancement - Include Project Memberships

## 🎯 Enhancement

The `/api/organizations/my` endpoint now returns **all organizations** where the user has access, including:
1. Organizations where user is a member (existing behavior)
2. Organizations where user is a project member (NEW)

## 📊 New Response Format

### Before (Old Response)
```json
[
  {
    "id": "org-uuid",
    "name": "My Organization",
    "slug": "my-org",
    "status": "ACTIVE",
    "memberRole": "OWNER",
    "joinedAt": "2026-06-22T10:00:00Z"
  }
]
```

### After (New Response)
```json
[
  {
    "id": "org-uuid",
    "name": "My Organization",
    "slug": "my-org",
    "status": "ACTIVE",
    "isOrgMember": true,
    "memberRole": "OWNER",
    "joinedAt": "2026-06-22T10:00:00Z",
    "projectMemberships": [
      {
        "projectId": "project-uuid-1",
        "projectName": "Project A",
        "projectRole": "MANAGER",
        "joinedAt": "2026-06-23T11:00:00Z"
      },
      {
        "projectId": "project-uuid-2",
        "projectName": "Project B",
        "projectRole": "MEMBER",
        "joinedAt": "2026-06-24T12:00:00Z"
      }
    ]
  },
  {
    "id": "org-uuid-2",
    "name": "Another Organization",
    "slug": "another-org",
    "status": "ACTIVE",
    "isOrgMember": false,
    "memberRole": null,
    "joinedAt": "2026-06-25T13:00:00Z",
    "projectMemberships": [
      {
        "projectId": "project-uuid-3",
        "projectName": "Project X",
        "projectRole": "MEMBER",
        "joinedAt": "2026-06-25T13:00:00Z"
      }
    ]
  }
]
```

## 🔑 New Fields

| Field | Type | Description |
|-------|------|-------------|
| `isOrgMember` | boolean | `true` if user is an org member, `false` if only project member |
| `memberRole` | string\|null | Organization role (`OWNER`, `ADMIN`, `MEMBER`) or `null` if not org member |
| `projectMemberships` | array | List of projects user is a member of in this org |
| `projectMemberships[].projectId` | string | Project UUID |
| `projectMemberships[].projectName` | string | Project title |
| `projectMemberships[].projectRole` | string | Project role (`MANAGER`, `MEMBER`, `VIEWER`) |
| `projectMemberships[].joinedAt` | string | When user joined this project |

## 📈 Use Cases

### Use Case 1: Organization Member
```json
{
  "id": "org-1",
  "name": "My Company",
  "isOrgMember": true,
  "memberRole": "ADMIN",
  "projectMemberships": [
    {
      "projectId": "proj-1",
      "projectName": "Website Redesign",
      "projectRole": "MANAGER"
    },
    {
      "projectId": "proj-2",
      "projectName": "Mobile App",
      "projectRole": "MEMBER"
    }
  ]
}
```
**Interpretation:**
- User is an ADMIN in the organization
- User is also a MANAGER of "Website Redesign" project
- User is a MEMBER of "Mobile App" project

### Use Case 2: Project-Only Member
```json
{
  "id": "org-2",
  "name": "Client Organization",
  "isOrgMember": false,
  "memberRole": null,
  "projectMemberships": [
    {
      "projectId": "proj-3",
      "projectName": "Consulting Project",
      "projectRole": "MEMBER"
    }
  ]
}
```
**Interpretation:**
- User is NOT an organization member
- User was invited directly to "Consulting Project"
- User can only access this specific project

### Use Case 3: Organization Member with No Projects
```json
{
  "id": "org-3",
  "name": "New Organization",
  "isOrgMember": true,
  "memberRole": "MEMBER",
  "projectMemberships": []
}
```
**Interpretation:**
- User is a MEMBER of the organization
- User hasn't been assigned to any projects yet
- User can see workspace/public projects

## 🎨 Frontend Usage

### Display Organization List

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  isOrgMember: boolean;
  memberRole: string | null;
  projectMemberships: Array<{
    projectId: string;
    projectName: string;
    projectRole: string;
    joinedAt: string;
  }>;
}

const OrganizationList = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    const fetchOrgs = async () => {
      const response = await api.get('/api/organizations/my');
      setOrganizations(response.data);
    };
    fetchOrgs();
  }, []);

  return (
    <div>
      {organizations.map((org) => (
        <div key={org.id}>
          <h3>{org.name}</h3>
          
          {/* Show org role if member */}
          {org.isOrgMember && (
            <span>Organization Role: {org.memberRole}</span>
          )}
          
          {/* Show project count */}
          <span>
            {org.projectMemberships.length} Project
            {org.projectMemberships.length !== 1 ? 's' : ''}
          </span>
          
          {/* List projects */}
          {org.projectMemberships.length > 0 && (
            <ul>
              {org.projectMemberships.map((proj) => (
                <li key={proj.projectId}>
                  {proj.projectName} ({proj.projectRole})
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};
```

### Show Access Level Badge

```typescript
const getAccessBadge = (org: Organization) => {
  if (org.isOrgMember) {
    return <Badge color="blue">{org.memberRole}</Badge>;
  } else {
    return <Badge color="gray">Project Member</Badge>;
  }
};

const getAccessDescription = (org: Organization) => {
  if (org.isOrgMember) {
    return `Organization ${org.memberRole.toLowerCase()}`;
  } else {
    const count = org.projectMemberships.length;
    return `Member of ${count} project${count !== 1 ? 's' : ''}`;
  }
};
```

### Filter Organizations

```typescript
// Get only organizations where user is an org member
const orgMemberOrgs = organizations.filter(org => org.isOrgMember);

// Get only organizations where user is project-only member
const projectOnlyOrgs = organizations.filter(org => !org.isOrgMember);

// Get organizations where user has admin access
const adminOrgs = organizations.filter(
  org => org.memberRole === 'OWNER' || org.memberRole === 'ADMIN'
);

// Get organizations where user is a project manager
const managerOrgs = organizations.filter(org =>
  org.projectMemberships.some(p => p.projectRole === 'MANAGER')
);
```

## 🔍 Backend Logic

### How It Works

1. **Query organization memberships:**
   ```sql
   SELECT * FROM organization_members
   WHERE user_id = ? AND status = 'ACTIVE'
   ```

2. **Query project memberships:**
   ```sql
   SELECT * FROM project_members pm
   JOIN projects p ON pm.project_id = p.id
   JOIN organizations o ON p.org_id = o.id
   WHERE pm.user_id = ? AND o.status = 'ACTIVE'
   ```

3. **Merge results:**
   - Create a map with organization ID as key
   - Add org memberships first
   - Add project memberships (create new entry if org not in map)
   - Avoid duplicates

4. **Return unified list:**
   - Each organization appears once
   - Contains both org membership and project memberships
   - Clear indication of access level

## 🎯 Benefits

### 1. Complete Access Picture
Users see ALL organizations they have access to, regardless of how they got access.

### 2. Better UX
- No confusion about missing organizations
- Clear indication of access level
- Shows which projects user is part of

### 3. Flexible Access Control
- Users can be invited to specific projects
- Don't need org-level access for project work
- Maintains security boundaries

### 4. Rich Information
- Know which projects in each org
- See role in each project
- Track when joined each project

## 🧪 Testing

### Test Scenario 1: Organization Member with Projects

```bash
# 1. Create org invitation
POST /api/invitations
{
  "email": "user@example.com",
  "role": "MEMBER",
  "scope": "ORGANIZATION",
  "organization_id": "org-uuid"
}

# 2. Accept invitation
POST /api/invitations/:token/accept

# 3. Get organizations
GET /api/organizations/my

# Expected:
{
  "id": "org-uuid",
  "isOrgMember": true,
  "memberRole": "MEMBER",
  "projectMemberships": []  // No projects yet
}
```

### Test Scenario 2: Project-Only Member

```bash
# 1. Create project invitation (not org)
POST /api/invitations
{
  "email": "contractor@example.com",
  "role": "MEMBER",
  "scope": "PROJECT",
  "organization_id": "org-uuid",
  "project_id": "project-uuid"
}

# 2. Accept invitation
POST /api/invitations/:token/accept

# 3. Get organizations
GET /api/organizations/my

# Expected:
{
  "id": "org-uuid",
  "isOrgMember": false,
  "memberRole": null,
  "projectMemberships": [
    {
      "projectId": "project-uuid",
      "projectName": "Project Name",
      "projectRole": "MEMBER"
    }
  ]
}
```

### Test Scenario 3: Mixed Access

```bash
# User is:
# - Org MEMBER
# - Project MANAGER on Project A
# - Project MEMBER on Project B

GET /api/organizations/my

# Expected:
{
  "id": "org-uuid",
  "isOrgMember": true,
  "memberRole": "MEMBER",
  "projectMemberships": [
    {
      "projectId": "project-a-uuid",
      "projectName": "Project A",
      "projectRole": "MANAGER"
    },
    {
      "projectId": "project-b-uuid",
      "projectName": "Project B",
      "projectRole": "MEMBER"
    }
  ]
}
```

## 📝 Migration Notes

### Backward Compatibility

**Breaking Changes:** Yes, response structure changed

**Old Response:**
```json
{
  "memberRole": "OWNER",
  "joinedAt": "..."
}
```

**New Response:**
```json
{
  "isOrgMember": true,
  "memberRole": "OWNER",
  "joinedAt": "...",
  "projectMemberships": []
}
```

### Frontend Updates Required

1. **Update TypeScript interfaces:**
   - Add `isOrgMember: boolean`
   - Add `projectMemberships: Array<...>`
   - Make `memberRole` nullable

2. **Update organization list rendering:**
   - Handle `isOrgMember` flag
   - Display project memberships
   - Show appropriate badges

3. **Update filtering/sorting:**
   - Consider project memberships
   - Handle project-only organizations

### Migration Steps

1. Update backend (already done)
2. Test API response
3. Update frontend types
4. Update UI components
5. Test all scenarios

## 🚀 Deployment

**Safe to deploy:** Yes  
**Requires migration:** No  
**Frontend updates:** Yes (response structure changed)

### Deployment Order

1. Deploy backend first
2. Test API manually
3. Update frontend types
4. Deploy frontend
5. Test end-to-end

## 📊 Performance

### Query Complexity
- 2 database queries (org memberships + project memberships)
- In-memory merging (fast)
- No N+1 queries

### Optimization
- Queries are indexed (user_id columns)
- Uses eager loading (include)
- Efficient map-based deduplication

### Caching Recommendations
Consider caching at:
- Application level (Redis)
- HTTP level (Cache-Control headers)
- Frontend level (React Query, SWR)

---

## ✅ Summary

**What Changed:**
- `/api/organizations/my` now includes organizations where user is project-only member
- Response includes project membership details
- Clear indication of access level (`isOrgMember` flag)

**Why:**
- Users invited to projects need to see those organizations
- Better visibility into access levels
- Complete picture of user's organizational access

**Impact:**
- Frontend needs updates (response structure changed)
- Better user experience
- More complete API

**Status:** ✅ Implemented and Ready

---

**Version:** 1.0.2  
**Date:** June 22, 2026  
**Breaking Change:** Yes (response structure)