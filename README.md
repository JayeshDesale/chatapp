# Realtime Chat App

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://chatapp-pi-red.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=black)](https://chatapp-suou.onrender.com)
[![Database](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io)](https://socket.io/)

A full-stack realtime one-to-one chat application built with React, Vite, Express, Socket.IO, and MongoDB Atlas.

## Live Demo

- Frontend: `https://chatapp-pi-red.vercel.app`
- Backend: `https://chatapp-suou.onrender.com`
- Backend health check: `https://chatapp-suou.onrender.com/`

## Features

- User signup and login with JWT authentication
- Realtime one-to-one messaging
- Online user presence
- Typing indicator
- Message read status
- Emoji picker support

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Realtime: Socket.IO
- Database: MongoDB Atlas with Mongoose
- Backend hosting: Render
- Frontend hosting: Vercel

## Project Structure

```text
realtime-chat-app/
|-- Backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   `-- routes/
|   `-- package.json
|-- Frontend/
|   |-- src/
|   `-- package.json
`-- README.md
```

## Environment Variables

### Backend

Create `Backend/.env` from `Backend/.env.example`.

```env
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/chatapp?retryWrites=true&w=majority&appName=chatapp
JWT_SECRET=replace-with-a-long-random-secret
```

### Frontend

Create `Frontend/.env` for local development:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

For production on Vercel:

```env
VITE_API_URL=https://chatapp-suou.onrender.com
VITE_SOCKET_URL=https://chatapp-suou.onrender.com
```

## Local Development

### 1. Install dependencies

Backend:

```bash
cd Backend
npm install
```

Frontend:

```bash
cd Frontend
npm install
```

### 2. Run backend

```bash
cd Backend
npm run dev
```

### 3. Run frontend

```bash
cd Frontend
npm run dev
```

### 4. Open the app

```text
http://localhost:5173
```

## Deployment

### MongoDB Atlas

1. Create a cluster in MongoDB Atlas.
2. Create a database user in `Database Access`.
3. Add network access in `Network Access`.
4. For initial deployment/testing, allow:

```text
0.0.0.0/0
```

5. Copy the Atlas driver connection string and use it as `MONGODB_URI`.

### Deploy Backend on Render

Create a `Web Service` with:

- Root directory: `Backend`
- Build command: `npm install`
- Start command: `node src/server.js`

Render environment variables:

```env
MONGODB_URI=your-atlas-uri
JWT_SECRET=your-random-secret
PORT=5000
```

After deployment, verify:

```text
https://your-render-service.onrender.com/
```

Expected response:

```json
{"message":"Backend running"}
```

### Deploy Frontend on Vercel

Create a Vercel project using the `Frontend` directory.

Vercel settings:

- Framework preset: `Vite`
- Root directory: `Frontend`

Vercel environment variables:

```env
VITE_API_URL=https://your-render-service.onrender.com
VITE_SOCKET_URL=https://your-render-service.onrender.com
```

Redeploy Vercel after updating env vars.

## Testing Flow

Use this quick manual flow after deployment:

1. Open the frontend URL.
2. Create two accounts.
3. Log in from two browsers or one browser plus incognito mode.
4. Send messages between both users.
5. Confirm:
   - messages appear in realtime
   - online indicator updates
   - typing indicator works
   - read status changes after opening the conversation

## API Overview

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`

### Users

- `GET /api/users`

### Messages

- `POST /api/messages`
- `GET /api/messages/:userId`
- `POST /api/messages/read`

## CORS

The backend currently allows these origins in `Backend/src/server.js`:

- `http://localhost:5173`
- `https://chatapp-pi-red.vercel.app`

If your Vercel domain changes, update `allowedOrigins` and redeploy Render.

## Common Issues

### MongoDB connection failed

Check:

- `MONGODB_URI` is correct
- Atlas database user and password are correct
- Atlas network access allows Render
- the database name is included in the URI

### Socket connection or CORS error

Check:

- `VITE_SOCKET_URL` points to the Render backend
- the frontend domain is included in backend `allowedOrigins`

### Render deploy works but login or chat fails

Check:

- `JWT_SECRET` is set on Render
- `VITE_API_URL` matches the backend URL
- the frontend was redeployed after env var changes

## Security Notes

- Do not commit `.env` files.
- Rotate credentials immediately if they are exposed.
- Restrict Atlas network access after testing if possible.
- Keep backend secrets only in Render environment variables.

## Future Improvements

- Group chat
- File or image sharing
- User profile pictures
- Chat list previews with last message
- Pagination for older messages
