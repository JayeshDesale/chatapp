import db from "../config/db.js";

export const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const [users] = await db.query(
      "SELECT id, name, email FROM users WHERE id != ?",
      [currentUserId]
    );

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
};