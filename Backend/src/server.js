import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import userRoutes from "./routes/userRoutes.js";
import "./config/db.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

/* ---------------- SOCKET.IO ---------------- */

export const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chatapp-iota-opal.vercel.app"
    ],
    methods: ["GET", "POST"]
  }
});

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://chatapp-iota-opal.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

/* ---------------- ROUTES ---------------- */

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

/* ---------------- HEALTH CHECK ---------------- */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "ChatShip backend is live"
  });
});

app.get("/api/auth/status", (req, res) => {
  res.json({
    status: "ok",
    message: "Auth API up",
    routes: [
      "POST /api/auth/signup",
      "POST /api/auth/login"
    ]
  });
});

/* ---------------- PROTECTED TEST ROUTE ---------------- */

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed successfully ✅",
    userId: req.user.id
  });
});

/* ---------------- ONLINE USERS ---------------- */

let onlineUsers = {};

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  socket.on("typing", (payload) => {
    const receiverSocket = onlineUsers[payload.toUserId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", payload);
    }
  });

  socket.on("messageRead", (payload) => {
    const receiverSocket = onlineUsers[payload.toUserId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("messageRead", payload);
    }
  });

  socket.on("disconnect", () => {

    console.log("User disconnected:", socket.id);

    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
      }
    }

    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

});

/* ---------------- EXPORT ONLINE USERS ---------------- */

export { onlineUsers };

/* ---------------- SERVER START ---------------- */

const PORT = process.env.PORT || 5000;

/* Render stability fix */
server.keepAliveTimeout = 120000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});