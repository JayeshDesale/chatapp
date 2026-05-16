import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getUsers, updateProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/", authMiddleware, getUsers);
router.put("/profile", authMiddleware, updateProfile);

export default router;
