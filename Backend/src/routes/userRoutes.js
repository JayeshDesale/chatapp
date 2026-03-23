import express from "express";
import db from "../config/db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// GET USERS (exclude logged-in user)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const currentUserId = Number(req.user.id);

    const [users] = await db.query(
      "SELECT id, name, email FROM users WHERE id != ?",
      [currentUserId]
    );

    res.json(users);

  } catch (err) {
    console.error("USER FETCH ERROR:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

export default router;