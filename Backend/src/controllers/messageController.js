import Message from "../models/Message.js";
import { io, onlineUsers } from "../server.js";

/* -------- SEND MESSAGE -------- */

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;
    const normalizedMessage = String(message || "").trim();

    if (!receiverId || !normalizedMessage) {
      return res.status(400).json({ message: "Missing data" });
    }

    const newMessage = await Message.create({
      sender_id: senderId,
      receiver_id: receiverId,
      message: normalizedMessage,
    });

    const payload = {
      id: newMessage._id.toString(),
      sender_id: senderId,
      receiver_id: receiverId,
      message: normalizedMessage,
      read_status: newMessage.read_status,
      created_at: newMessage.created_at,
    };

    const receiverSocket = onlineUsers[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", payload);
    }

    res.status(201).json(payload);

  } catch (err) {
    console.error("SEND ERROR:", err);
    res.status(500).json({ message: "Error sending message" });
  }
};

/* -------- GET MESSAGES -------- */

export const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender_id: currentUserId, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: currentUserId },
      ],
    })
      .sort({ created_at: 1 })
      .lean();

    res.json(
      messages.map((item) => ({
        id: item._id.toString(),
        sender_id: item.sender_id.toString(),
        receiver_id: item.receiver_id.toString(),
        message: item.message,
        read_status: item.read_status,
        created_at: item.created_at,
      }))
    );

  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).json({ message: "Error fetching messages" });
  }
};

export const markMessagesRead = async (req, res) => {
  try {
    const receiverId = req.user.id;
    const { sender_id } = req.body;

    if (!sender_id) {
      return res.status(400).json({ message: "sender_id is required" });
    }

    await Message.updateMany(
      {
        sender_id,
        receiver_id: receiverId,
        read_status: false,
      },
      {
        $set: { read_status: true },
      }
    );

    const senderSocket = onlineUsers[sender_id];
    if (senderSocket) {
      io.to(senderSocket).emit("messageRead", { fromUserId: receiverId });
    }

    res.json({ message: "Messages marked as read" });
  } catch (err) {
    console.error("READ ERROR:", err);
    res.status(500).json({ message: "Error marking messages as read" });
  }
};
