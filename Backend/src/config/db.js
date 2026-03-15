import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4_unicode_ci",
});

db.connect((err) => {
  if (err) {
    console.log("MySQL Connection Error ❌", err);
  } else {
    console.log("MySQL Connected Successfully ✅");
    db.query("SET NAMES utf8mb4", (err) => {
      if (err) {
        console.log("Error setting utf8mb4 names", err);
      } else {
        console.log("Database charset set to utf8mb4 ✅");
      }
    });

    db.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
      [process.env.DB_NAME, "messages", "read_status"],
      (err, rows) => {
        if (err) {
          console.log("Error checking read_status column", err);
          return;
        }
        if (rows.length === 0) {
          db.query(
            "ALTER TABLE messages ADD COLUMN read_status TINYINT(1) DEFAULT 0",
            (alterErr) => {
              if (alterErr) {
                console.log("Error adding read_status column", alterErr);
              } else {
                console.log("read_status column added ✅");
              }
            }
          );
        } else {
          console.log("read_status column ready ✅");
        }
      }
    );
  }
});

export default db;


