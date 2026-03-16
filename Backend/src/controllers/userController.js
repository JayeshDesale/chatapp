import db from "../config/db.js";

export const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const [users] = await db.query(
      "SELECT id, name, email FROM users WHERE id != ?",
      [currentUserId]
    );

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error while fetching users" });
  }
};