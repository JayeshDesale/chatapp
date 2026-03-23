import express from "express";
import {
  sendMessage,
  getMessages
} from "../controllers/messageController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// send message
router.post("/", authMiddleware, sendMessage);

// get messages with specific user
router.get("/:userId", authMiddleware, getMessages);

export default router;