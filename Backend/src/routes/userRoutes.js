import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/", authMiddleware, getUsers);

export default router;
