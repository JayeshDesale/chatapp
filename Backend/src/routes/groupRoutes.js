import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createGroup, getGroups } from "../controllers/groupController.js";

const router = express.Router();

router.get("/", authMiddleware, getGroups);
router.post("/", authMiddleware, createGroup);

export default router;
