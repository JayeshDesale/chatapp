import express from "express";
import {
  sendMessage,
  getMessages,
  markMessagesRead,
} from "../controllers/messageController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// send message
router.post("/", authMiddleware, sendMessage);

router.post("/read", authMiddleware, markMessagesRead);

// get messages with specific user
router.get("/:userId", authMiddleware, getMessages);

export default router;
