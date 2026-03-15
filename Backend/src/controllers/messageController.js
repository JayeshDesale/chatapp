import db from "../config/db.js";
import { io, onlineUsers } from "../server.js";

// SEND MESSAGE
export const sendMessage = (req, res) => {
  const { receiver_id, message } = req.body;
  const sender_id = req.user.id;

  if (!receiver_id || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.query(
    "INSERT INTO messages (sender_id, receiver_id, message, read_status) VALUES (?, ?, ?, 0)",
    [sender_id, receiver_id, message],
    (err, result) => {
      if (err) {
        console.log("sendMessage db error", err);
        return res.status(500).json({ message: "Message send failed" });
      }

      const receiverSocket = onlineUsers[receiver_id];
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", {
          sender_id,
          receiver_id,
          message,
          created_at: new Date().toISOString(),
        });
      }

      res.status(201).json({ message: "Message sent successfully" });
    }
  );
};

// GET MESSAGES
export const getMessages = (req, res) => {
  const sender_id = req.user.id;
  const receiver_id = req.params.userId;

  db.query(
    `SELECT * FROM messages 
     WHERE (sender_id = ? AND receiver_id = ?) 
        OR (sender_id = ? AND receiver_id = ?)
     ORDER BY created_at ASC`,
    [sender_id, receiver_id, receiver_id, sender_id],
    (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Fetch failed" });
      }

      res.json(results);
    }
  );
};

// MARK AS READ
export const markMessagesRead = (req, res) => {
  const user_id = req.user.id;
  const sender_id = req.body.sender_id;

  if (!sender_id) {
    return res.status(400).json({ message: "sender_id required" });
  }

  db.query(
    "UPDATE messages SET read_status = 1 WHERE sender_id = ? AND receiver_id = ?",
    [sender_id, user_id],
    (err, result) => {
      if (err) {
        console.log("markMessagesRead db error", err);
        return res.status(500).json({ message: "Read update failed" });
      }

      const senderSocket = onlineUsers[sender_id];
      if (senderSocket) {
        io.to(senderSocket).emit("messageRead", {
          fromUserId: user_id,
          toUserId: sender_id,
        });
      }

      res.json({ message: "Messages marked read" });
    }
  );
};
