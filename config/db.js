import { Pool } from "pg";
import env from "dotenv";
<<<<<<< HEAD
=======
import { createMockPool } from "./mockDb.js";

>>>>>>> 56d8cb1 (Security audit fixes: IDOR patch, rate limiting, and POS audit logs)
env.config();

const isProduction = process.env.NODE_ENV === "production";
const isRemoteHost = process.env.DB_HOST && process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1";
<<<<<<< HEAD

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
=======
const isDemoMode = process.env.DEMO_MODE === "true";

let pool;

if (isDemoMode) {
  console.log("🍱 DEMO_MODE=true: Running with built-in in-memory database & mock data.");
  pool = createMockPool();
} else {
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

  const realPool = new Pool(connectionConfig);
  let mockPool = null;
  let useMock = false;

  realPool
    .connect()
    .then(async (client) => {
      console.log("✅ Database connected successfully");
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255),
            role VARCHAR(50),
            action VARCHAR(100),
            target_type VARCHAR(100),
            target_id VARCHAR(100),
            details TEXT,
            ip VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } catch (tableErr) {
        // Suppress error if table exists or insufficient permissions
      }
      client.release();
    })
    .catch((err) => {
      console.warn("⚠️ PostgreSQL connection failed:", err.message);
      console.log("🍱 Switching to DEMO MODE (In-Memory Database & Seed Data)");
      useMock = true;
      if (!mockPool) mockPool = createMockPool();
    });

  pool = new Proxy(realPool, {
    get(target, prop) {
      if (prop === "isMock") return useMock;
      if (useMock) {
        if (!mockPool) mockPool = createMockPool();
        if (typeof mockPool[prop] === "function") {
          return mockPool[prop].bind(mockPool);
        }
        return mockPool[prop];
      }
      return target[prop];
    },
  });
}
>>>>>>> 56d8cb1 (Security audit fixes: IDOR patch, rate limiting, and POS audit logs)

export default pool;