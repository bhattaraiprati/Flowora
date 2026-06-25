# 💬 Real-Time Chat Feature - Documentation

## ✅ Implementation Complete

**Frontend**: Full real-time chat with Socket.io ✅  
**Backend**: API endpoints needed ⏳

---

## 📁 Files Created

### Frontend Code
```
src/lib/socket.ts                                    # Socket.io service
src/app/.../chat/page.tsx                            # Chat page
src/components/UI/chat/ChatMessage.tsx               # Message component
src/components/UI/chat/ChatInput.tsx                 # Input component
src/components/UI/chat/ChatSidebar.tsx               # Sidebar component
src/types/ChatInterface.ts                           # TypeScript types
```

### Modified Files
```
src/lib/api.ts                                       # Added chatApi
src/components/UI/project/ProjectCard.tsx            # Added chat button
package.json                                         # Added socket.io-client
```

---

## 🚀 Features

- ✅ Real-time messaging with Socket.io
- ✅ Typing indicators
- ✅ Message reactions
- ✅ Edit/delete messages
- ✅ Member sidebar with roles
- ✅ Message grouping
- ✅ Responsive design
- ✅ Auto-scroll

---

## 🔌 Backend Requirements

### 1. Database Schema (PostgreSQL)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  reply_to UUID REFERENCES messages(id),
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_project_messages ON messages(project_id, created_at DESC);

CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);
```

### 2. REST API Endpoints

```javascript
GET    /api/chat/project/:projectId/messages     // Get all messages
POST   /api/chat/project/:projectId/messages     // Send message (optional, Socket.io handles it)
PATCH  /api/chat/messages/:messageId             // Edit message (optional)
DELETE /api/chat/messages/:messageId             // Delete message (optional)
POST   /api/chat/messages/:messageId/reactions   // Add reaction (optional)
DELETE /api/chat/messages/:messageId/reactions/:emoji  // Remove reaction (optional)
```

### 3. Socket.io Server (Node.js/Express)

```javascript
const io = require('socket.io')(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT token here
  next();
});

io.on('connection', (socket) => {
  // Join project room
  socket.on('join:project', async (projectId) => {
    // Verify user is project member
    socket.join(`project:${projectId}`);
  });

  // Send message
  socket.on('message:send', async ({ projectId, message, reply_to }) => {
    const newMessage = await db.saveMessage({
      project_id: projectId,
      user_id: socket.userId,
      message,
      reply_to
    });
    
    // Broadcast to project room
    io.to(`project:${projectId}`).emit('message:new', newMessage);
  });

  // Edit message
  socket.on('message:edit', async ({ messageId, message }) => {
    await db.updateMessage(messageId, message);
    const projectId = await db.getProjectIdFromMessage(messageId);
    io.to(`project:${projectId}`).emit('message:edited', { messageId, message });
  });

  // Delete message
  socket.on('message:delete', async ({ messageId }) => {
    const projectId = await db.getProjectIdFromMessage(messageId);
    await db.deleteMessage(messageId);
    io.to(`project:${projectId}`).emit('message:deleted', { messageId });
  });

  // Reactions
  socket.on('reaction:add', async ({ messageId, emoji }) => {
    await db.addReaction(messageId, socket.userId, emoji);
    const reactions = await db.getMessageReactions(messageId);
    const projectId = await db.getProjectIdFromMessage(messageId);
    io.to(`project:${projectId}`).emit('reaction:updated', { messageId, reactions });
  });

  // Typing indicators
  socket.on('typing:start', ({ projectId }) => {
    socket.to(`project:${projectId}`).emit('typing:user', {
      userId: socket.userId,
      userName: socket.userName
    });
  });

  socket.on('typing:stop', ({ projectId }) => {
    socket.to(`project:${projectId}`).emit('typing:stopped', {
      userName: socket.userName
    });
  });

  // Leave project
  socket.on('leave:project', (projectId) => {
    socket.leave(`project:${projectId}`);
  });
});
```

### 4. Authorization Middleware

```javascript
async function checkProjectMembership(userId, projectId) {
  const result = await db.query(
    'SELECT 1 FROM project_members WHERE user_id = $1 AND project_id = $2',
    [userId, projectId]
  );
  return result.rows.length > 0;
}
```

---

## 🎯 Access Points

1. **Project Card**: Hover → Click message icon 💬
2. **Project Page**: Click "Chat" button in header
3. **URL**: `/workspace/[orgId]/projects/[projectId]/chat`

---

## 🧪 Testing

1. Start backend with Socket.io
2. Start frontend: `npm run dev`
3. Login and open a project
4. Click "Chat" button
5. Send messages (should appear instantly)
6. Test typing indicators
7. Test reactions

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Messages not appearing | Check Socket.io connection in console |
| "Connection failed" | Verify backend URL in `.env.local` |
| 403 Forbidden | Ensure user is project member |
| Typing not working | Check Socket.io server implementation |

---

## 📦 Dependencies

```json
{
  "socket.io-client": "^4.x" // Already installed
}
```

---

**Status**: Frontend ✅ | Backend Socket.io needed ⏳  
**Time to complete backend**: 2-3 hours
