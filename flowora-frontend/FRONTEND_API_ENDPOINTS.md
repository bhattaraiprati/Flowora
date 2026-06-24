# Flowora API Endpoints - Frontend Integration Guide

Base URL: `http://localhost:8000` (or your deployed backend URL)

All endpoints (except public ones) require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication APIs

### 1. User Registration
```
POST /api/auth/signup
Content-Type: application/json

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 201 Created
{
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

### 2. User Login
```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "access_token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "profile_picture": "url",
    "role": "USER"
  }
}
```

---

## 📋 Task Management APIs

### 1. Create Task
```
POST /api/tasks/project/:projectId
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "title": "Fix login bug",
  "description": "Users cannot login with special characters",
  "status": "TODO",  // optional: TODO | IN_PROGRESS | REVIEW | DONE
  "priority": "HIGH",  // optional: LOW | MEDIUM | HIGH | URGENT
  "assigned_to": "user_uuid",  // optional
  "due_date": "2026-12-31T23:59:59Z",  // optional ISO 8601
  "start_date": "2026-06-22T00:00:00Z",  // optional ISO 8601
  "estimated_hours": 5,  // optional
  "tags": ["bug", "urgent"]  // optional
}

Response: 201 Created
{
  "id": "task_uuid",
  "title": "Fix login bug",
  "description": "Users cannot login with special characters",
  "status": "TODO",
  "priority": "HIGH",
  "project_id": "project_uuid",
  "created_by": "user_uuid",
  "assigned_to": "user_uuid",
  "assignee": {
    "id": "user_uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "profile_picture": "url"
  },
  "due_date": "2026-12-31T23:59:59Z",
  "start_date": "2026-06-22T00:00:00Z",
  "estimated_hours": 5,
  "tags": ["bug", "urgent"],
  "created_at": "2026-06-22T10:30:00Z",
  "updated_at": "2026-06-22T10:30:00Z"
}
```

### 2. Get All Tasks for a Project
```
GET /api/tasks/project/:projectId
Authorization: Bearer <token>

Optional Query Parameters:
?status=TODO,IN_PROGRESS
?priority=HIGH,URGENT
?assigned_to=user_uuid
?due_date_from=2026-01-01
?due_date_to=2026-12-31

Response: 200 OK
[
  {
    "id": "task_uuid",
    "title": "Fix login bug",
    // ... full task object
  }
]
```

### 3. Get Single Task
```
GET /api/tasks/:taskId
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "task_uuid",
  "title": "Fix login bug",
  // ... full task object with assignee and project
}
```

### 4. Update Task
```
PATCH /api/tasks/:taskId
Authorization: Bearer <token>
Content-Type: application/json

Body (all fields optional):
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "assigned_to": "user_uuid",
  "due_date": "2026-12-31T23:59:59Z",
  "start_date": "2026-06-22T00:00:00Z",
  "estimated_hours": 8,
  "tags": ["bug", "critical"]
}

Response: 200 OK
{
  // ... updated task object
}
```

### 5. Update Task Status (Kanban Drag & Drop)
```
PATCH /api/tasks/:taskId/status
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "status": "IN_PROGRESS"  // TODO | IN_PROGRESS | REVIEW | DONE
}

Response: 200 OK
{
  "id": "task_uuid",
  "status": "IN_PROGRESS",
  "updated_at": "2026-06-22T10:35:00Z"
}
```

### 6. Update Task Date (Calendar Drag & Drop)
```
PATCH /api/tasks/:taskId/date
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "date": "2026-12-31T23:59:59Z",  // or "" to clear date
  "type": "due_date"  // due_date | start_date
}

Response: 200 OK
{
  "id": "task_uuid",
  "due_date": "2026-12-31T23:59:59Z",
  "start_date": "2026-06-22T00:00:00Z",
  "updated_at": "2026-06-22T10:40:00Z"
}
```

### 7. Delete Task
```
DELETE /api/tasks/:taskId
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Task deleted successfully"
}
```

---

## 📨 Invitation System APIs

### 1. Create Invitation
```
POST /api/invitations
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "email": "newuser@example.com",
  "role": "MEMBER",  // ADMIN | MANAGER | MEMBER | VIEWER
  "scope": "PROJECT",  // ORGANIZATION | PROJECT
  "organization_id": "org_uuid",
  "project_id": "project_uuid"  // required if scope=PROJECT
}

Response: 201 Created
{
  "id": "invitation_uuid",
  "email": "newuser@example.com",
  "role": "MEMBER",
  "scope": "PROJECT",
  "status": "PENDING",
  "token": "generated_token_string",
  "invite_link": "http://localhost:3000/join?token=generated_token_string",
  "organization_id": "org_uuid",
  "project_id": "project_uuid",
  "invited_by": "user_uuid",
  "expires_at": "2026-06-29T10:30:00Z",
  "created_at": "2026-06-22T10:30:00Z"
}
```

### 2. Get Invitation by Token (Public - No Auth)
```
GET /api/invitations/token/:token

Response: 200 OK
{
  "id": "invitation_uuid",
  "email": "newuser@example.com",
  "role": "MEMBER",
  "scope": "PROJECT",
  "status": "PENDING",
  "organization_id": "org_uuid",
  "project_id": "project_uuid",
  "invited_by": "user_uuid",
  "inviter": {
    "id": "user_uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "expires_at": "2026-06-29T10:30:00Z",
  "created_at": "2026-06-22T10:30:00Z"
}
```

### 3. Accept Invitation
```
POST /api/invitations/:token/accept
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Invitation accepted successfully",
  "organization_id": "org_uuid",
  "project_id": "project_uuid",
  "member": {
    "id": "member_uuid",
    "user_id": "user_uuid",
    "role": "MEMBER",
    "project_id": "project_uuid",
    "organization_id": "org_uuid"
  }
}
```

### 4. Get Organization Invitations
```
GET /api/invitations/organization/:organizationId
Authorization: Bearer <token>

Optional Query Parameters:
?status=PENDING,ACCEPTED
?scope=ORGANIZATION,PROJECT

Response: 200 OK
[
  {
    "id": "invitation_uuid",
    "email": "newuser@example.com",
    "role": "MEMBER",
    "scope": "PROJECT",
    "status": "PENDING",
    "organization_id": "org_uuid",
    "project_id": "project_uuid",
    "invited_by": "user_uuid",
    "inviter": {
      "id": "user_uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "expires_at": "2026-06-29T10:30:00Z",
    "created_at": "2026-06-22T10:30:00Z"
  }
]
```

### 5. Get Project Invitations
```
GET /api/invitations/project/:projectId
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "invitation_uuid",
    // ... same structure as above
  }
]
```

### 6. Revoke Invitation
```
DELETE /api/invitations/:invitationId
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Invitation revoked successfully"
}
```

---

## 👥 Member Management APIs

### 1. Get Project Members
```
GET /api/members/project/:projectId
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "member_uuid",
    "project_id": "project_uuid",
    "user_id": "user_uuid",
    "role": "MEMBER",  // MANAGER | MEMBER | VIEWER
    "created_at": "2026-06-22T10:30:00Z",
    "updated_at": "2026-06-22T10:30:00Z",
    "user": {
      "id": "user_uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "profile_picture": "url"
    }
  }
]
```

### 2. Get Organization Members
```
GET /api/members/organization/:organizationId
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "member_uuid",
    "organization_id": "org_uuid",
    "user_id": "user_uuid",
    "role": "MEMBER",  // ADMIN | MANAGER | MEMBER | VIEWER
    "created_at": "2026-06-22T10:30:00Z",
    "updated_at": "2026-06-22T10:30:00Z",
    "user": {
      "id": "user_uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "profile_picture": "url"
    }
  }
]
```

### 3. Update Project Member Role
```
PATCH /api/members/project/:projectId/:memberId/role
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "role": "MANAGER"  // MANAGER | MEMBER | VIEWER
}

Response: 200 OK
{
  "id": "member_uuid",
  "role": "MANAGER",
  "updated_at": "2026-06-22T10:35:00Z"
}
```

### 4. Update Organization Member Role
```
PATCH /api/members/organization/:organizationId/:memberId/role
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "role": "ADMIN"  // ADMIN | MANAGER | MEMBER | VIEWER
}

Response: 200 OK
{
  "id": "member_uuid",
  "role": "ADMIN",
  "updated_at": "2026-06-22T10:35:00Z"
}
```

### 5. Remove Project Member
```
DELETE /api/members/project/:projectId/:memberId
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Member removed successfully"
}
```

### 6. Remove Organization Member
```
DELETE /api/members/organization/:organizationId/:memberId
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Member removed successfully"
}
```

---

## 🏢 Organization APIs (Existing)

### Get User Organizations
```
GET /api/organizations/user
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "org_uuid",
    "name": "My Organization",
    "description": "Organization description",
    "status": "ACTIVE"
  }
]
```

### Get Organization Details
```
GET /api/organizations/:organizationId
Authorization: Bearer <token>
```

---

## 📁 Project APIs (Existing)

### Create Project
```
POST /api/projects/organization/:organizationId
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "title": "My Project",
  "description": "Project description",
  "visibility": "WORKSPACE",  // PUBLIC | PRIVATE | WORKSPACE
  "color": "#6366f1"
}
```

### Get Organization Projects
```
GET /api/projects/organization/:organizationId
Authorization: Bearer <token>
```

### Get Single Project
```
GET /api/projects/:projectId
Authorization: Bearer <token>
```

### Update Project
```
PATCH /api/projects/:projectId
Authorization: Bearer <token>
```

### Delete Project
```
DELETE /api/projects/:projectId
Authorization: Bearer <token>
```

---

## ⚠️ Error Response Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Human-readable error message",
  "error": "Bad Request"
}
```

Common HTTP Status Codes:
- `200 OK` - Successful GET/PATCH/DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid auth token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## 🔑 Environment Variables Required

Create a `.env` file with:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d

# App
PORT=8000
FRONTEND_URL=http://localhost:3000

# Email (for verification and notifications)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
```

---

## 📝 Quick Integration Tips

### 1. Setting up Axios Instance

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 2. Example: Fetching Tasks

```typescript
import api from './api';

export const fetchProjectTasks = async (projectId: string) => {
  const response = await api.get(`/api/tasks/project/${projectId}`);
  return response.data;
};

export const createTask = async (projectId: string, taskData: any) => {
  const response = await api.post(`/api/tasks/project/${projectId}`, taskData);
  return response.data;
};

export const updateTaskStatus = async (taskId: string, status: string) => {
  const response = await api.patch(`/api/tasks/${taskId}/status`, { status });
  return response.data;
};
```

### 3. Example: Accepting Invitation Flow

```typescript
// 1. User visits /join?token=xxx
const token = new URLSearchParams(window.location.search).get('token');

// 2. Fetch invitation details (no auth)
const invitation = await api.get(`/api/invitations/token/${token}`);

// 3. If user not logged in, redirect to login/signup
// Store token for later: localStorage.setItem('pending_invitation', token);

// 4. After login, accept invitation
const result = await api.post(`/api/invitations/${token}/accept`);

// 5. Redirect to organization or project
router.push(`/workspace/${result.data.organization_id}/dashboard`);
```

---

## 🚀 Testing the APIs

Use this Postman/Thunder Client collection structure:

1. **Auth** folder: signup, login, verify-email
2. **Tasks** folder: create, list, update, delete, update-status, update-date
3. **Invitations** folder: create, get-by-token, accept, list-org, list-project, revoke
4. **Members** folder: list-project, list-org, update-role, remove
5. **Projects** folder: create, list, get, update, delete
6. **Organizations** folder: create, list, get

---

## 📞 Support

If you encounter any issues:
1. Check the backend logs for detailed error messages
2. Ensure all environment variables are properly set
3. Verify Redis is running (for invitations to work)
4. Check that PostgreSQL database is accessible

---

**Last Updated:** June 22, 2026
**Backend Version:** 1.0.0
**API Version:** v1