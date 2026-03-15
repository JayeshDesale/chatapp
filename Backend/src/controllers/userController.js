import db from "../config/db.js";

export const getUsers = (req, res) => {
  const currentUserId = req.user.id;

  db.query(
    "SELECT id, name, email FROM users WHERE id != ?",
    [currentUserId],
    (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Fetch users failed" });
      }

      res.json(results);
    }
  );
};