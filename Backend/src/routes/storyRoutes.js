import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createStory, getStories } from "../controllers/storyController.js";

const router = express.Router();

router.get("/", authMiddleware, getStories);
router.post("/", authMiddleware, createStory);

export default router;
