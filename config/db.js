import { Pool } from "pg";
import env from "dotenv";
env.config();

const isProduction = process.env.NODE_ENV === "production";
const isRemoteHost = process.env.DB_HOST && process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1";

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: (isProduction || isRemoteHost) ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(connectionConfig);

// Register an error listener to prevent idle client errors from crashing the backend process
pool.on("error", (err) => {
  console.error("⚠️ Unexpected error on idle database client:", err);
});

// Test connection by running a quick query (automatically acquires and releases client)
pool
  .query("SELECT 1")
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => console.error("❌ Database connection error:", err));

export default pool;