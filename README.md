# 💻 Real-time Collaborative Code Editor

A **Google Docs-style collaborative code editor** built with Node.js, Socket.io, and Monaco Editor. Multiple users can edit code simultaneously in real-time with live cursor tracking.

## ✨ Features

- 🔄 **Real-time Collaboration**: Multiple users edit same file simultaneously
- 🖱️ **Live Cursor Tracking**: See where others are typing
- 🎨 **Syntax Highlighting**: 30+ languages supported (Monaco Editor)
- 💾 **Auto-save**: Changes saved automatically
- 🔗 **Shareable Links**: Generate unique room URLs
- 🌓 **Dark/Light Mode**: Toggle themes
- 📋 **Code Execution**: Run code in browser (JavaScript, Python)
- 👥 **User Presence**: See who's online

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js, Express, Socket.io |
| Frontend | React, Monaco Editor, Tailwind CSS |
| Real-time | Socket.io (WebSockets) |
| Database | MongoDB (for room persistence) |
| Deployment | Docker, Heroku |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/realtime-code-editor.git
cd realtime-code-editor

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..

# Set environment variables
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI

# Start development servers
npm run dev
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rooms` | POST | Create new room |
| `/api/rooms/:id` | GET | Get room details |
| `/api/rooms/:id/code` | PUT | Update room code |

## 🧪 Testing

```bash
npm test
```

## 📄 License

MIT License

## 🙏 Acknowledgments
- Socket.io for real-time communication
