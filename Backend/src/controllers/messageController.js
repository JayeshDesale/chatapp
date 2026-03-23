import db from "../config/db.js";
import { io, onlineUsers } from "../server.js";

/* -------- SEND MESSAGE -------- */

export const sendMessage = async (req, res) => {
  try {
    const senderId = Number(req.user.id);
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ message: "Missing data" });
    }

    const [result] = await db.query(
      "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
      [senderId, Number(receiverId), message]
    );

    const newMessage = {
      id: result.insertId,
      sender_id: senderId,
      receiver_id: Number(receiverId),
      message,
      created_at: new Date()
    };

    // send ONLY to correct receiver
    const receiverSocket = onlineUsers[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", newMessage);
    }

    res.json(newMessage);

  } catch (err) {
    console.error("SEND ERROR:", err);
    res.status(500).json({ message: "Error sending message" });
  }
};

/* -------- GET MESSAGES -------- */

export const getMessages = async (req, res) => {
  try {
    const currentUserId = Number(req.user.id);
    const otherUserId = Number(req.params.userId);

    const [messages] = await db.query(
      `SELECT * FROM messages 
       WHERE 
       (sender_id = ? AND receiver_id = ?)
       OR 
       (sender_id = ? AND receiver_id = ?)`,
      [currentUserId, otherUserId, otherUserId, currentUserId]
    );

    res.json(messages);

  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).json({ message: "Error fetching messages" });
  }
};