import express from "express";
import cors from "cors";
<<<<<<< HEAD
=======
import expressLayouts from "express-ejs-layouts";
>>>>>>> 56d8cb1 (Security audit fixes: IDOR patch, rate limiting, and POS audit logs)
import passport from "passport";
import session from "express-session";
import env from "dotenv";
import connectPgSimple from "connect-pg-simple";
import methodOverride from "method-override";
import path from "path";
import { fileURLToPath } from "url";
<<<<<<< HEAD
import fs from "fs";
=======
>>>>>>> 56d8cb1 (Security audit fixes: IDOR patch, rate limiting, and POS audit logs)

import pool from "./config/db.js";
import upload from "./config/cloudinary.js";
import setupPassport from "./config/passportSetup.js";

import authController from "./controllers/authController.js";
import publicController from "./controllers/publicController.js";
import adminController from "./controllers/adminController.js";
import managerController from "./controllers/managerController.js";

<<<<<<< HEAD
import { checkAuthenticated, checkRole } from "./middleware/auth.js";
=======
import crypto from "crypto";
import { secureHeaders, paymentRateLimiter, logAuditEvent } from "./middleware/security.js";
import { checkAuthenticated, checkRole, canAccessOrder } from "./middleware/auth.js";
import { renderPaymentPage } from "./controllers/paymentController.js";
>>>>>>> 56d8cb1 (Security audit fixes: IDOR patch, rate limiting, and POS audit logs)
import { processStaffCheckout } from "./controllers/orderController.js";

env.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
<<<<<<< HEAD

const port = process.env.PORT || 3000;
const pgSession = connectPgSimple(session);
const isProduction = process.env.NODE_ENV === "production";
=======
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

// Apply Security Headers (Equivalent to Helmet)
app.use(secureHeaders);

const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";
const isDemoMode = process.env.DEMO_MODE === "true" || pool.isMock;
>>>>>>> 56d8cb1 (Security audit fixes: IDOR patch, rate limiting, and POS audit logs)

export default app;

// Middleware Setup

app.set("trust proxy", 1);

<<<<<<< HEAD
app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, 
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

const allowedOrigins = [
  "http://localhost:5173",
  "https://sushi-frontend.onrender.com",
  "https://sushi-store.onrender.com"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".onrender.com") || origin.startsWith("http://localhost:")) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
=======
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (isProduction) {
    throw new Error("FATAL SECURITY CONFIGURATION: SESSION_SECRET environment variable is missing in production!");
  }
  console.warn("⚠️ Security Notice: Generating dynamic ephemeral session secret (for local/dev only).");
  sessionSecret = crypto.randomBytes(32).toString("hex");
}

const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  },
};

if (!isDemoMode && pool && !pool.isMock) {
  try {
    const pgSession = connectPgSimple(session);
    sessionOptions.store = new pgSession({
      pool: pool,
      tableName: "session",
    });
  } catch (err) {
    console.warn("⚠️ pgSession initialization error, using MemoryStore:", err.message);
  }
} else {
  console.log("🔒 Using In-Memory Session Store (Demo Mode)");
}

app.use(session(sessionOptions));

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "client/dist")));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));
>>>>>>> 56d8cb1 (Security audit fixes: IDOR patch, rate limiting, and POS audit logs)
app.use(methodOverride("_method"));

// Setup & Initialize Passport

setupPassport();
app.use(passport.initialize());
app.use(passport.session());

<<<<<<< HEAD
// Block write operations for 'demo' role
app.use((req, res, next) => {
  if (req.user && req.user.role === 'demo' && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (req.path.startsWith('/api/auth/logout') || req.path.startsWith('/logout') || req.path === '/api/auth/verify-password') {
      return next();
    }
    return res.status(403).json({ error: "Demo Mode: Write actions are disabled for the demo role." });
  }
  next();
});

=======
>>>>>>> 56d8cb1 (Security audit fixes: IDOR patch, rate limiting, and POS audit logs)
// Global Template Variables

app.use((req, res, next) => {
  req.pool = pool;
  res.locals.user = req.user;
  next();
});

// Admin layout removed as it's now handled by React

app.post(
  "/api/staff/checkout/:id", 
  checkAuthenticated, 
  checkRole(["manager", "admin", "store_manager", "staff", "cashier"]), 
  processStaffCheckout
);

<<<<<<< HEAD
// PAYMENT ROUTES (DEMO MODE)

// Added direct route (no router) for confirming payment (Demo Mode)
app.post("/payment/confirm/:id", checkAuthenticated, async (req, res) => {
  try {
    const orderId = req.params.id;
    const pool = req.pool;
    // Mark order as completed and payment method as QR
    await pool.query("UPDATE orders SET status = 'Completed', payment_method = 'QR' WHERE id = $1", [orderId]);
    res.json({ success: true, message: "Payment confirmed" });
  } catch (err) {
    console.error(err);
=======
// PAYMENT ROUTES (DEMO MODE & PRODUCTION)
app.get("/payment/:id", checkAuthenticated, renderPaymentPage);

// Secure payment confirmation route
app.post("/payment/confirm/:id", checkAuthenticated, paymentRateLimiter, async (req, res) => {
  try {
    const orderId = req.params.id;
    const pool = req.pool;

    const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    const order = orderRes.rows[0];

    // Authorization: Verify user is staff or the customer who placed the order
    if (!canAccessOrder(req.user, order)) {
      return res.status(403).json({ error: "Access Denied: You do not own this order." });
    }

    if (order.status === "Completed") {
      return res.json({ success: true, message: "Payment already confirmed" });
    }

    // Mark order as completed and payment method as QR
    await pool.query("UPDATE orders SET status = 'Completed', payment_method = 'QR' WHERE id = $1", [orderId]);
    
    await logAuditEvent(pool, {
      userId: req.user.id,
      role: req.user.role,
      action: "CONFIRM_PAYMENT",
      targetType: "ORDER",
      targetId: orderId,
      details: { previousStatus: order.status, total: order.total_price },
      ip: req.ip
    });

    res.json({ success: true, message: "Payment confirmed" });
  } catch (err) {
    console.error("Payment confirmation error:", err);
>>>>>>> 56d8cb1 (Security audit fixes: IDOR patch, rate limiting, and POS audit logs)
    res.status(500).json({ error: "Error confirming payment" });
  }
});

<<<<<<< HEAD
// Fallback route for SPA page navigation moved to the bottom

=======
>>>>>>> 56d8cb1 (Security audit fixes: IDOR patch, rate limiting, and POS audit logs)
// Register Routers

app.use("/", authController);
app.use("/", publicController);
app.use("/", adminController);
app.use("/", managerController);

<<<<<<< HEAD
app.get("/api/debug-paths", (req, res) => {
  try {
    const rootFiles = fs.readdirSync(__dirname);
    let clientFiles = [];
    if (fs.existsSync(path.join(__dirname, "client"))) {
      clientFiles = fs.readdirSync(path.join(__dirname, "client"));
    }
    let distFiles = [];
    if (fs.existsSync(path.join(__dirname, "client/dist"))) {
      distFiles = fs.readdirSync(path.join(__dirname, "client/dist"));
    }
    res.json({
      __dirname,
      rootFiles,
      clientFiles,
      distFiles
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root route for API status
app.get("/", (req, res) => {
  res.send("Sushi Store API is running.");
=======
// Fallback route for SPA page navigation (if frontend dist exists)
app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/auth") || req.path.includes(".")) {
    return next();
  }
  const clientDist = path.join(__dirname, "client/dist/index.html");
  res.sendFile(clientDist, (err) => {
    if (err) {
      next();
    }
  });
>>>>>>> 56d8cb1 (Security audit fixes: IDOR patch, rate limiting, and POS audit logs)
});

// Start Server

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});