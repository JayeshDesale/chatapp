import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { sendMessage, getMessages, markMessagesRead } from "../controllers/messageController.js";

const router = express.Router();

router.post("/send", authMiddleware, sendMessage);
router.get("/:userId", authMiddleware, getMessages);
router.post("/read", authMiddleware, markMessagesRead);

export default router;
