# Flowora Backend API Documentation

This document provides comprehensive specifications for all backend APIs required to support the Flowora frontend application, including tasks, invitations, member management, and authentication flow.

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Task Management APIs](#task-management-apis)
3. [Invitation System APIs](#invitation-system-apis)
4. [Member Management APIs](#member-management-apis)
5. [Redis Implementation for Invitations](#redis-implementation-for-invitations)
6. [Error Handling](#error-handling)
7. [Data Models](#data-models)

---

## Authentication & Authorization

All API endpoints (except login, signup, and public invitation verification) require JWT authentication.

### Headers Required
```
Authorization: Bearer <jwt_token>
```

### User Roles & Permissions

#### Organization Level
- **ADMIN**: Full access to organization and all projects
- **MANAGER**: Can manage projects and members within organization
- **MEMBER**: Can view and participate in assigned projects
- **VIEWER**: Read-only access

#### Project Level
- **MANAGER**: Can manage project tasks and members
- **MEMBER**: Can create and edit tasks
- **VIEWER**: Read-only access to project

---

## Task Management APIs

### 1. Create Task
**Endpoint:** `POST /api/tasks/project/:projectId`

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "status": "TODO | IN_PROGRESS | REVIEW | DONE (default: TODO)",
  "priority": "LOW | MEDIUM | HIGH | URGENT (default: MEDIUM)",
  "assigned_to": "string (user_id, optional)",
  "due_date": "ISO 8601 date string (optional)",
  "start_date": "ISO 8601 date string (optional)",
  "estimated_hours": "number (optional)",
  "tags": ["string"] (optional array)
}
```

**Response:** `201 Created`
```json
{
  "id": "task_uuid",
  "title": "string",
  "description": "string",
  "status": "TODO",
  "priority": "MEDIUM",
  "project_id": "string",
  "created_by": "user_id",
  "assigned_to": "user_id",
  "assignee": {
    "id": "user_id",
    "name": "string",
    "email": "string",
    "profile_picture": "string"
  },
  "due_date": "ISO 8601 string",
  "start_date": "ISO 8601 string",
  "estimated_hours": 0,
  "tags": ["string"],
  "created_at": "ISO 8601 string",
  "updated_at": "ISO 8601 string"
}
```

**Permissions:**
- User must be a MEMBER or higher in the project
- Organization members with MANAGER role can also create tasks

**Validation:**
- `title` is required and cannot be empty
- `status` must be one of the enum values
- `priority` must be one of the enum values
- `assigned_to` must be a valid user who is a member of the project
- `due_date` and `start_date` must be valid ISO 8601 dates

---

### 2. Get Project Tasks
**Endpoint:** `GET /api/tasks/project/:projectId`

**Query Parameters (optional):**
```
?status=TODO,IN_PROGRESS
?priority=HIGH,URGENT
?assigned_to=user_id
?due_date_from=2024-01-01
?due_date_to=2024-12-31
```

**Response:** `200 OK`
```json
[
  {
    "id": "task_uuid",
    "title": "string",
    "description": "string",
    "status": "TODO",
    "priority": "MEDIUM",
    "project_id": "string",
    "created_by": "user_id",
    "assigned_to": "user_id",
    "assignee": {
      "id": "user_id",
      "name": "string",
      "email": "string",
      "profile_picture": "string"
    },
    "due_date": "ISO 8601 string",
    "start_date": "ISO 8601 string",
    "estimated_hours": 0,
    "tags": ["string"],
    "created_at": "ISO 8601 string",
    "updated_at": "ISO 8601 string"
  }
]
```

**Permissions:**
- User must have at least VIEWER access to the project

---

### 3. Get Single Task
**Endpoint:** `GET /api/tasks/:taskId`

**Response:** `200 OK`
```json
{
  "id": "task_uuid",
  "title": "string",
  "description": "string",
  "status": "TODO",
  "priority": "MEDIUM",
  "project_id": "string",
  "created_by": "user_id",
  "assigned_to": "user_id",
  "assignee": {
    "id": "user_id",
    "name": "string",
    "email": "string",
    "profile_picture": "string"
  },
  "due_date": "ISO 8601 string",
  "start_date": "ISO 8601 string",
  "estimated_hours": 0,
  "tags": ["string"],
  "created_at": "ISO 8601 string",
  "updated_at": "ISO 8601 string"
}
```

**Permissions:**
- User must have access to the project containing this task

---

### 4. Update Task
**Endpoint:** `PATCH /api/tasks/:taskId`

**Request Body (all fields optional):**
```json
{
  "title": "string",
  "description": "string",
  "status": "TODO | IN_PROGRESS | REVIEW | DONE",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "assigned_to": "user_id",
  "due_date": "ISO 8601 string",
  "start_date": "ISO 8601 string",
  "estimated_hours": 0,
  "tags": ["string"]
}
```

**Response:** `200 OK`
```json
{
  "id": "task_uuid",
  // ... full task object
}
```

**Permissions:**
- User must be MEMBER or higher in the project
- Task creator can always edit their own tasks

---

### 5. Update Task Status (Specialized endpoint for Kanban drag-drop)
**Endpoint:** `PATCH /api/tasks/:taskId/status`

**Request Body:**
```json
{
  "status": "TODO | IN_PROGRESS | REVIEW | DONE"
}
```

**Response:** `200 OK`
```json
{
  "id": "task_uuid",
  "status": "IN_PROGRESS",
  "updated_at": "ISO 8601 string"
}
```

**Permissions:**
- User must be MEMBER or higher in the project

**Notes:**
- This endpoint should be optimized for frequent updates
- Consider adding activity logging for status changes

---

### 6. Update Task Date (Specialized endpoint for Calendar drag-drop)
**Endpoint:** `PATCH /api/tasks/:taskId/date`

**Request Body:**
```json
{
  "date": "ISO 8601 string or empty string",
  "type": "due_date | start_date"
}
```

**Response:** `200 OK`
```json
{
  "id": "task_uuid",
  "due_date": "ISO 8601 string",
  "start_date": "ISO 8601 string",
  "updated_at": "ISO 8601 string"
}
```

**Permissions:**
- User must be MEMBER or higher in the project

**Notes:**
- Empty string for `date` should remove the date
- This enables drag-drop to "Unscheduled" in calendar view

---

### 7. Delete Task
**Endpoint:** `DELETE /api/tasks/:taskId`

**Response:** `200 OK`
```json
{
  "message": "Task deleted successfully"
}
```

**Permissions:**
- User must be MANAGER or higher in the project
- Task creator can delete their own tasks

---

## Invitation System APIs

### Redis Storage Structure

The invitation system uses Redis to store temporary invitation data with automatic expiration.

**Redis Key Format:**
```
invitation:token:<token_value>
```

**Redis Value (JSON):**
```json
{
  "id": "invitation_uuid",
  "email": "invitee@example.com",
  "role": "MEMBER",
  "scope": "PROJECT | ORGANIZATION",
  "organization_id": "org_uuid",
  "project_id": "project_uuid (optional)",
  "invited_by": "user_id",
  "created_at": "ISO 8601 string",
  "expires_at": "ISO 8601 string"
}
```

**Redis TTL:** 7 days (604800 seconds)

**Additional Database Table (for tracking):**
Store invitations in PostgreSQL for audit trail:
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL,
  scope VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  organization_id UUID NOT NULL,
  project_id UUID,
  invited_by UUID NOT NULL,
  accepted_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_token (token),
  INDEX idx_email (email),
  INDEX idx_organization (organization_id),
  INDEX idx_project (project_id)
);
```

---

### 1. Create Invitation
**Endpoint:** `POST /api/invitations`

**Request Body:**
```json
{
  "email": "invitee@example.com (required)",
  "role": "ADMIN | MANAGER | MEMBER | VIEWER (required)",
  "scope": "ORGANIZATION | PROJECT (required)",
  "organization_id": "org_uuid (required)",
  "project_id": "project_uuid (required if scope=PROJECT)"
}
```

**Backend Logic:**
1. Validate that user has permission to invite (ADMIN or MANAGER)
2. Check if email is already a member
3. Generate secure random token (use crypto.randomBytes(32).toString('hex'))
4. Create invitation record in PostgreSQL
5. Store invitation data in Redis with 7-day TTL
6. Generate invite link: `${FRONTEND_URL}/join?token=${token}`
7. (Optional) Send email notification to invitee

**Response:** `201 Created`
```json
{
  "id": "invitation_uuid",
  "email": "invitee@example.com",
  "role": "MEMBER",
  "scope": "PROJECT",
  "status": "PENDING",
  "token": "generated_token_string",
  "invite_link": "https://flowora.app/join?token=generated_token_string",
  "organization_id": "org_uuid",
  "project_id": "project_uuid",
  "invited_by": "user_id",
  "expires_at": "ISO 8601 string (7 days from now)",
  "created_at": "ISO 8601 string"
}
```

**Permissions:**
- Organization scope: User must be ADMIN in organization
- Project scope: User must be MANAGER or ADMIN in project/organization

**Validation:**
- Email must be valid format
- User cannot invite someone who is already a member
- Cannot create duplicate pending invitations for same email+scope+target

---

### 2. Get Invitation by Token (Public - No Auth Required)
**Endpoint:** `GET /api/invitations/token/:token`

**Response:** `200 OK`
```json
{
  "id": "invitation_uuid",
  "email": "invitee@example.com",
  "role": "MEMBER",
  "scope": "PROJECT",
  "status": "PENDING",
  "organization_id": "org_uuid",
  "project_id": "project_uuid",
  "invited_by": "user_id",
  "inviter": {
    "id": "user_id",
    "name": "string",
    "email": "string"
  },
  "expires_at": "ISO 8601 string",
  "created_at": "ISO 8601 string"
}
```

**Backend Logic:**
1. Check Redis first for token
2. If not in Redis but exists in DB and not expired, return EXPIRED status
3. If expired (current time > expires_at), return EXPIRED status
4. Update DB status to EXPIRED if necessary

**Error Responses:**
- `404 Not Found` if token doesn't exist
- Return status field to indicate EXPIRED or REVOKED

**Notes:**
- This endpoint is called from the `/join` page before user logs in
- Do NOT require authentication
- Token acts as the authorization

---

### 3. Accept Invitation (Requires Auth)
**Endpoint:** `POST /api/invitations/:token/accept`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "message": "Invitation accepted successfully",
  "organization_id": "org_uuid",
  "project_id": "project_uuid",
  "member": {
    "id": "member_uuid",
    "user_id": "user_id",
    "role": "MEMBER",
    "project_id": "project_uuid",
    "organization_id": "org_uuid"
  }
}
```

**Backend Logic:**
1. Verify JWT token and get authenticated user
2. Retrieve invitation from Redis using token
3. Verify invitation is still valid (not expired, not already accepted)
4. Verify authenticated user's email matches invitation email
5. Create member record (ProjectMember or OrganizationMember based on scope)
6. Update invitation status to ACCEPTED in database
7. Delete invitation from Redis (no longer needed)
8. Return redirect info (organization_id and project_id)

**Error Cases:**
- `401 Unauthorized` if not authenticated
- `400 Bad Request` if email doesn't match invitation
- `400 Bad Request` if invitation already accepted
- `404 Not Found` if invitation expired or doesn't exist
- `409 Conflict` if user is already a member

**Important:**
- User must be logged in and email verified
- Email must match the invitation email exactly (case-insensitive)

---

### 4. Get Organization Invitations
**Endpoint:** `GET /api/invitations/organization/:organizationId`

**Query Parameters:**
```
?status=PENDING,ACCEPTED
?scope=ORGANIZATION,PROJECT
```

**Response:** `200 OK`
```json
[
  {
    "id": "invitation_uuid",
    "email": "invitee@example.com",
    "role": "MEMBER",
    "scope": "PROJECT",
    "status": "PENDING",
    "organization_id": "org_uuid",
    "project_id": "project_uuid",
    "invited_by": "user_id",
    "inviter": {
      "id": "user_id",
      "name": "string",
      "email": "string"
    },
    "expires_at": "ISO 8601 string",
    "created_at": "ISO 8601 string"
  }
]
```

**Permissions:**
- User must be ADMIN or MANAGER in organization

---

### 5. Get Project Invitations
**Endpoint:** `GET /api/invitations/project/:projectId`

**Response:** `200 OK`
```json
[
  {
    "id": "invitation_uuid",
    "email": "invitee@example.com",
    "role": "MEMBER",
    "scope": "PROJECT",
    "status": "PENDING",
    "project_id": "project_uuid",
    // ... rest of invitation object
  }
]
```

**Permissions:**
- User must be MANAGER or higher in project

---

### 6. Revoke Invitation
**Endpoint:** `DELETE /api/invitations/:invitationId`

**Response:** `200 OK`
```json
{
  "message": "Invitation revoked successfully"
}
```

**Backend Logic:**
1. Get invitation from database
2. Update status to REVOKED in database
3. Delete from Redis (if exists)

**Permissions:**
- User must be ADMIN or MANAGER in the target organization/project
- User who created invitation can also revoke it

---

## Member Management APIs

### 1. Get Project Members
**Endpoint:** `GET /api/members/project/:projectId`

**Response:** `200 OK`
```json
[
  {
    "id": "member_uuid",
    "project_id": "project_uuid",
    "user_id": "user_id",
    "role": "MEMBER",
    "created_at": "ISO 8601 string",
    "updated_at": "ISO 8601 string",
    "user": {
      "id": "user_id",
      "name": "string",
      "email": "string",
      "profile_picture": "string"
    }
  }
]
```

**Permissions:**
- User must have at least VIEWER access to the project

---

### 2. Get Organization Members
**Endpoint:** `GET /api/members/organization/:organizationId`

**Response:** `200 OK`
```json
[
  {
    "id": "member_uuid",
    "organization_id": "org_uuid",
    "user_id": "user_id",
    "role": "MEMBER",
    "created_at": "ISO 8601 string",
    "updated_at": "ISO 8601 string",
    "user": {
      "id": "user_id",
      "name": "string",
      "email": "string",
      "profile_picture": "string"
    }
  }
]
```

**Permissions:**
- User must be a member of the organization

---

### 3. Update Project Member Role
**Endpoint:** `PATCH /api/members/project/:projectId/:memberId/role`

**Request Body:**
```json
{
  "role": "MANAGER | MEMBER | VIEWER"
}
```

**Response:** `200 OK`
```json
{
  "id": "member_uuid",
  "role": "MANAGER",
  "updated_at": "ISO 8601 string"
}
```

**Permissions:**
- User must be MANAGER or ADMIN in the project
- Cannot change your own role
- Cannot assign ADMIN role at project level

---

### 4. Update Organization Member Role
**Endpoint:** `PATCH /api/members/organization/:organizationId/:memberId/role`

**Request Body:**
```json
{
  "role": "ADMIN | MANAGER | MEMBER | VIEWER"
}
```

**Response:** `200 OK`
```json
{
  "id": "member_uuid",
  "role": "ADMIN",
  "updated_at": "ISO 8601 string"
}
```

**Permissions:**
- User must be ADMIN in the organization
- Cannot change your own role
- Must have at least one ADMIN in organization

---

### 5. Remove Project Member
**Endpoint:** `DELETE /api/members/project/:projectId/:memberId`

**Response:** `200 OK`
```json
{
  "message": "Member removed successfully"
}
```

**Backend Logic:**
- Also unassign this user from all tasks in the project
- Consider soft delete for audit purposes

**Permissions:**
- User must be MANAGER or ADMIN in the project
- Cannot remove yourself

---

### 6. Remove Organization Member
**Endpoint:** `DELETE /api/members/organization/:organizationId/:memberId`

**Response:** `200 OK`
```json
{
  "message": "Member removed successfully"
}
```

**Backend Logic:**
- Remove from all projects in organization
- Unassign from all tasks
- Consider soft delete for audit purposes

**Permissions:**
- User must be ADMIN in the organization
- Cannot remove yourself
- Cannot remove last ADMIN

---

## Redis Implementation for Invitations

### Why Redis?
1. **Automatic Expiration**: Redis TTL automatically removes expired invitations
2. **Fast Lookup**: O(1) lookup by token for join page
3. **Temporary Data**: Invitation links are temporary by nature
4. **Reduced DB Load**: Frequent token checks don't hit main database

### Setup

```javascript
// Redis client setup (Node.js example)
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

// Store invitation
async function storeInvitation(token, invitationData) {
  const key = `invitation:token:${token}`;
  const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
  
  await client.setex(
    key,
    ttl,
    JSON.stringify(invitationData)
  );
}

// Retrieve invitation
async function getInvitation(token) {
  const key = `invitation:token:${token}`;
  const data = await client.get(key);
  
  return data ? JSON.parse(data) : null;
}

// Delete invitation (after acceptance)
async function deleteInvitation(token) {
  const key = `invitation:token:${token}`;
  await client.del(key);
}
```

### Token Generation

```javascript
const crypto = require('crypto');

function generateInvitationToken() {
  // Generate cryptographically secure random token
  return crypto.randomBytes(32).toString('hex');
}
```

### Data Flow

1. **Admin sends invitation**:
   - POST /api/invitations
   - Token generated and stored in both Redis and PostgreSQL
   - Redis TTL set to 7 days
   - Link sent to invitee

2. **User clicks link** (`/join?token=xxx`):
   - GET /api/invitations/token/:token
   - Check Redis first (fast)
   - If not in Redis, check DB and return EXPIRED

3. **User accepts** (after login):
   - POST /api/invitations/:token/accept
   - Verify token in Redis
   - Create member record
   - Update DB status to ACCEPTED
   - Delete from Redis

4. **Automatic expiration**:
   - Redis TTL automatically removes old tokens
   - Cron job (daily) to update DB status for expired invitations

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common HTTP Status Codes

- `200 OK` - Successful GET/PATCH/DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid auth token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Validation failed
- `500 Internal Server Error` - Server error

### Error Codes

```
AUTH_INVALID_TOKEN
AUTH_INSUFFICIENT_PERMISSIONS
INVITATION_NOT_FOUND
INVITATION_EXPIRED
INVITATION_ALREADY_ACCEPTED
INVITATION_EMAIL_MISMATCH
MEMBER_ALREADY_EXISTS
MEMBER_NOT_FOUND
TASK_NOT_FOUND
PROJECT_NOT_FOUND
VALIDATION_ERROR
```

---

## Data Models

### Task Model (PostgreSQL)

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'TODO',
  priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  due_date TIMESTAMP,
  start_date TIMESTAMP,
  estimated_hours DECIMAL(5, 2),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_project (project_id),
  INDEX idx_status (status),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_due_date (due_date)
);

-- Trigger to update updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Project Member Model

```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(project_id, user_id),
  INDEX idx_project (project_id),
  INDEX idx_user (user_id)
);
```

### Organization Member Model

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id),
  INDEX idx_organization (organization_id),
  INDEX idx_user (user_id)
);
```

---

## Authentication Flow with Redirects

### Scenario 1: User Already Registered

1. User clicks invitation link: `/join?token=xxx`
2. Frontend checks if user is logged in
3. If yes: Call `POST /api/invitations/:token/accept`
4. Backend verifies email matches invitation
5. Create member record and redirect to project/organization

### Scenario 2: User Not Registered

1. User clicks invitation link: `/join?token=xxx`
2. Frontend detects user not logged in
3. Store token in localStorage: `redirect_after_login`
4. Redirect to `/login?redirect=/join?token=xxx`
5. User registers and verifies email
6. After successful login, check for `redirect_after_login`
7. Redirect back to `/join?token=xxx`
8. Accept invitation and redirect to destination

### Login Page Modifications

```typescript
// After successful login
const redirectUrl = localStorage.getItem('redirect_after_login');
if (redirectUrl) {
  localStorage.removeItem('redirect_after_login');
  router.push(redirectUrl);
} else {
  router.push('/dashboard');
}
```

---

## Additional Recommendations

### 1. Email Notifications (Optional but Recommended)

Send emails for:
- Invitation received
- Invitation accepted (notify inviter)
- Task assigned
- Task due date approaching

### 2. Audit Logging

Log these events in a separate audit table:
- Member invited
- Invitation accepted/revoked
- Member role changed
- Member removed
- Task created/updated/deleted

### 3. Rate Limiting

Apply rate limits to prevent abuse:
- Invitation creation: 10 per hour per user
- Invitation acceptance: 5 per hour per IP

### 4. Webhook Support (Future)

Consider adding webhooks for:
- Task status changed
- Member joined
- Project created

---

## Testing Checklist

### Invitation Flow
- [ ] Create invitation with valid data
- [ ] Cannot invite existing member
- [ ] Token is unique and cryptographically secure
- [ ] Invitation stored in both Redis and PostgreSQL
- [ ] Redis TTL set correctly (7 days)
- [ ] Invitation link generated correctly
- [ ] Public endpoint retrieves invitation without auth
- [ ] Expired invitations return correct status
- [ ] Accept invitation verifies email match
- [ ] Accept creates correct member record
- [ ] Accept deletes invitation from Redis
- [ ] Cannot accept same invitation twice
- [ ] Revoke removes from both Redis and DB

### Task Management
- [ ] Create task with all fields
- [ ] Create task with minimal fields
- [ ] Update task status via drag-drop
- [ ] Update task date via calendar drag-drop
- [ ] Clear date by dragging to unscheduled
- [ ] Cannot create task without project access
- [ ] Cannot update others' tasks without permission
- [ ] Delete task cascades properly

### Member Management
- [ ] View project members
- [ ] Update member role
- [ ] Remove member
- [ ] Cannot remove yourself
- [ ] Cannot make yourself not admin (last admin)
- [ ] Removing member unassigns tasks

### Permissions
- [ ] VIEWER cannot create/edit tasks
- [ ] MEMBER can create/edit tasks
- [ ] MANAGER can invite and manage members
- [ ] ADMIN has full access
- [ ] Org ADMIN has access to all projects

---

## Example Request/Response Flows

### Complete Invitation Flow Example

**Step 1: Admin creates invitation**
```bash
POST /api/invitations
Authorization: Bearer admin_jwt_token

{
  "email": "newuser@example.com",
  "role": "MEMBER",
  "scope": "PROJECT",
  "organization_id": "org_123",
  "project_id": "proj_456"
}

Response 201:
{
  "id": "inv_789",
  "token": "abc123def456...",
  "invite_link": "https://flowora.app/join?token=abc123def456...",
  ...
}
```

**Step 2: User visits link (not logged in)**
```bash
GET /api/invitations/token/abc123def456...
# No auth header

Response 200:
{
  "email": "newuser@example.com",
  "role": "MEMBER",
  "scope": "PROJECT",
  "status": "PENDING",
  ...
}
```

**Step 3: User signs up and logs in**
```bash
POST /api/auth/signup
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "secure_password"
}

# Email verification...

POST /api/auth/login
{
  "email": "newuser@example.com",
  "password": "secure_password"
}

Response 200:
{
  "token": "user_jwt_token",
  "user": { ... }
}
```

**Step 4: Accept invitation**
```bash
POST /api/invitations/abc123def456.../accept
Authorization: Bearer user_jwt_token

Response 200:
{
  "message": "Invitation accepted successfully",
  "organization_id": "org_123",
  "project_id": "proj_456"
}
```

---

This documentation should provide everything needed for backend implementation. Let me know if you need clarification on any section!
