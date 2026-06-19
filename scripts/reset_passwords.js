import pool from "../config/db.js";

const newHash = "$2b$10$OsbOTIh9u38u9na5tIZo1eZWzJuo17oUf9lZ5mgntNxV4T9xY6f6S"; // bcrypt hash of "password123"
const usersToReset = [
  "account@gmail.com",
  "local1@gmail.com",
  "local2@gmail.com",
  "staff1@gmail.com",
  "staff2@gmail.com",
  "cashier1@gmail.com",
  "vireak@gmail.com"
];

async function resetPasswords() {
  try {
    console.log("Resetting passwords in database...");
    for (const email of usersToReset) {
      const res = await pool.query(
        "UPDATE users SET password = $1 WHERE email = $2 RETURNING email, role",
        [newHash, email]
      );
      if (res.rowCount > 0) {
        console.log(`✅ Reset password for ${email} (role: ${res.rows[0].role})`);
      } else {
        console.warn(`⚠️ User ${email} not found in database`);
      }
    }
    console.log("🎉 All passwords reset successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error resetting passwords:", err);
    process.exit(1);
  }
}

resetPasswords();
