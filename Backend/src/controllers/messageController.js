import Message from "../models/Message.js";
import Group from "../models/Group.js";
import { io, onlineUsers } from "../server.js";

/* -------- SEND MESSAGE -------- */

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, groupId, message } = req.body;
    const normalizedMessage = String(message || "").trim();

    if ((!receiverId && !groupId) || !normalizedMessage) {
      return res.status(400).json({ message: "Missing data" });
    }

    let group = null;

    if (groupId) {
      group = await Group.findOne({ _id: groupId, members: senderId }).lean();
      if (!group) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
    }

    const newMessage = await Message.create({
      sender_id: senderId,
      receiver_id: receiverId || null,
      group_id: groupId || null,
      message: normalizedMessage,
    });

    const payload = {
      id: newMessage._id.toString(),
      sender_id: senderId,
      receiver_id: receiverId || null,
      group_id: groupId || null,
      message: normalizedMessage,
      read_status: newMessage.read_status,
      created_at: newMessage.created_at,
    };

    if (group) {
      group.members
        .map((member) => member.toString())
        .filter((memberId) => memberId !== senderId)
        .forEach((memberId) => {
          const memberSocket = onlineUsers[memberId];
          if (memberSocket) {
            io.to(memberSocket).emit("receiveGroupMessage", payload);
          }
        });
    } else {
      const receiverSocket = onlineUsers[receiverId];
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", payload);
      }
    }

    res.status(201).json(payload);

  } catch (err) {
    console.error("SEND ERROR:", err);
    res.status(500).json({ message: "Error sending message" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const groupId = req.params.groupId;

    const group = await Group.findOne({ _id: groupId, members: currentUserId }).lean();
    if (!group) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const messages = await Message.find({ group_id: groupId })
      .sort({ created_at: 1 })
      .lean();

    res.json(
      messages.map((item) => ({
        id: item._id.toString(),
        sender_id: item.sender_id.toString(),
        receiver_id: item.receiver_id ? item.receiver_id.toString() : null,
        group_id: item.group_id ? item.group_id.toString() : null,
        message: item.message,
        read_status: item.read_status,
        created_at: item.created_at,
      }))
    );
  } catch (err) {
    console.error("GET GROUP ERROR:", err);
    res.status(500).json({ message: "Error fetching group messages" });
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
