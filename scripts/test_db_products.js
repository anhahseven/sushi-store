import pool from "../config/db.js";
pool.query("SELECT COUNT(*) FROM products")
  .then(res => {
    console.log("SUCCESS: Products count is:", res.rows[0].count);
    process.exit(0);
  })
  .catch(err => {
    console.error("ERROR querying database:", err.message);
    process.exit(1);
  });
