import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import "./config/db.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

/* -------- ONLINE USERS -------- */
let onlineUsers = {};
export { onlineUsers };

/* -------- SOCKET -------- */

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173"
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
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

/* -------- MIDDLEWARE -------- */

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

/* -------- ROUTES -------- */

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

/* -------- TEST -------- */

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend running ✅" });
});

/* -------- SERVER -------- */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});