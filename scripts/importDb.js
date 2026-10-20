import fs from "fs";
import path from "path";
<<<<<<< HEAD
import pool from "../config/db.js";

const __dirname = path.resolve();

async function importPlainSql(filePath) {
  console.log(`Reading plain SQL dump from ${path.basename(filePath)}...`);
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  console.log("Parsing database script...");
  const queries = [];
  let inCopyBlock = false;
  let copyTable = "";
  let copyCols = [];
  let copyData = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (inCopyBlock) {
      if (line === "\\.") {
        if (copyData.length > 0) {
          const colNames = copyCols.join(", ");
          for (const row of copyData) {
            const valList = row.map(val => {
              if (val === "\\N") return "NULL";
              return `'${val.replace(/'/g, "''")}'`;
            });
            queries.push(`INSERT INTO ${copyTable} (${colNames}) VALUES (${valList.join(", ")})`);
          }
        }
        inCopyBlock = false;
        copyTable = "";
        copyCols = [];
        copyData = [];
      } else {
        const rowVals = lines[i].split("\t");
        copyData.push(rowVals);
      }
      continue;
    }

    if (line.startsWith("COPY ")) {
      inCopyBlock = true;
      const match = lines[i].match(/COPY\s+([^\s\(]+)\s*\(([^\)]+)\)\s*FROM\s+stdin/i);
      if (match) {
        copyTable = match[1];
        copyCols = match[2].split(",").map(c => c.trim());
      }
      continue;
    }

    if (!line || line.startsWith("--") || line.startsWith("\\") || line.startsWith("SET ") || line.startsWith("SELECT pg_catalog.set_config")) {
      continue;
    }

    let statement = line;
    while (!statement.endsWith(";") && i + 1 < lines.length) {
      i++;
      statement += " " + lines[i].trim();
    }

    const upperStatement = statement.toUpperCase();
    if (
      upperStatement.includes(" OWNER TO ") || 
      upperStatement.startsWith("ALTER DEFAULT PRIVILEGES") ||
      upperStatement.startsWith("ALTER SCHEMA")
    ) {
      continue;
    }

    queries.push(statement);
  }

  console.log(`Found ${queries.length} queries to execute.`);
  
  const client = await pool.connect();
  try {
    const dropSequences = [
      "cart_id_seq", "categories_id_seq", "daily_inventory_items_id_seq", "daily_inventory_logs_id_seq",
      "locations_id_seq", "monthly_sales_id_seq", "order_items_id_seq", "orders_id_seq",
      "products_id_seq", "stock_request_items_id_seq", "stock_requests_id_seq", "stocks_id_seq", "users_id_seq"
    ];
    for (const seq of dropSequences) {
      await client.query(`DROP SEQUENCE IF EXISTS public.${seq} CASCADE`);
    }

    const dropTables = [
      "cart", "categories", "daily_inventory_items", "daily_inventory_logs", 
      "dashboard_metrics", "locations", "monthly_sales", "order_items", "orders", 
      "products", "session", "stock_request_items", "stock_requests", "stocks", "users"
    ];
    for (const table of dropTables) {
      await client.query(`DROP TABLE IF EXISTS public.${table} CASCADE`);
    }

    for (let q = 0; q < queries.length; q++) {
      const sql = queries[q];
      try {
        await client.query(sql);
      } catch (err) {
        console.warn(`⚠️ Warning executing query [${sql.substring(0, 100)}...]:`, err.message);
      }
    }
    
    console.log("🎉 Database plain SQL import completed successfully!");
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
=======
import { exec } from "child_process";
import env from "dotenv";

env.config();

const __dirname = path.resolve();

// Construct database connection URL for pg_restore
const dbUrl = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

async function runPgRestore(filePath) {
  console.log(`Starting pg_restore on ${path.basename(filePath)}...`);
  
  // --no-owner: Skip restoring object ownership to match the local/Render database user
  // --no-privileges: Skip restoring access privileges to avoid permission errors
  // --clean: Drop database objects before recreating them
  const cmd = `pg_restore --no-owner --no-privileges --clean -d "${dbUrl}" "${filePath}"`;

  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(`❌ pg_restore failed for ${path.basename(filePath)}:`, err.message);
        console.error("stderr details:", stderr);
        return reject(err);
      }
      console.log(`✅ Completed pg_restore for ${path.basename(filePath)}`);
      resolve();
    });
  });
>>>>>>> 56d8cb1 (Security audit fixes: IDOR patch, rate limiting, and POS audit logs)
}

(async () => {
  try {
<<<<<<< HEAD
    const sushiSqlPath = path.join(__dirname, "database", "sushi_plain.sql");
    if (fs.existsSync(sushiSqlPath)) {
      await importPlainSql(sushiSqlPath);
      console.log("🎉 Database initialization completed successfully!");
      process.exit(0);
    } else {
      console.error(`❌ database/sushi_plain.sql not found at ${sushiSqlPath}`);
=======
    const sushiSqlPath = path.join(__dirname, "database", "sushi.sql");
    if (fs.existsSync(sushiSqlPath)) {
      await runPgRestore(sushiSqlPath);
      console.log("🎉 Database initialization completed successfully!");
    } else {
      console.error(`❌ database/sushi.sql not found at ${sushiSqlPath}`);
>>>>>>> 56d8cb1 (Security audit fixes: IDOR patch, rate limiting, and POS audit logs)
      process.exit(1);
    }
  } catch (err) {
    console.error("Critical error during database import:", err);
    process.exit(1);
  }
})();
