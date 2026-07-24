# Vgrand-Task-Hub

React 18 + Vite + Tailwind frontend for TaskHub — multi-business task monitoring with real-time chat.

## Features

- JWT auth with role-based routing (user, admin, super_admin)
- Dashboard, tasks, notifications, profile management
- Admin: businesses, users, super-admin user passwords
- **Real-time chat** — 1:1 and group messaging with online status, typing indicators, read receipts, image sharing
- i18n support (English / Telugu)
- Light/dark theme

## Setup

```bash
npm install
npm run dev
```

## Chat Feature

### Dependencies

- `socket.io-client` — WebSocket client for real-time messaging

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Backend Socket.IO URL (without `/api`) | Derived from `VITE_API_URL` |

### Architecture

- `src/context/ChatContext.jsx` — manages Socket.IO connection, conversation list, messages, typing, presence, and unread counts
- `src/pages/Chat.jsx` — two-pane responsive layout (conversation list + message thread)
- `src/components/chat/` — `ConversationList`, `ConversationListItem`, `MessageThread`, `MessageBubble`, `MessageInput`, `TypingIndicator`, `NewConversationModal`

### Routes

- `/chat` — conversation list view
- `/chat/:conversationId` — open a specific conversation