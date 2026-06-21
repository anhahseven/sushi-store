import express from "express";
import cors from "cors";
import expressLayouts from "express-ejs-layouts";
import passport from "passport";
import session from "express-session";
import env from "dotenv";
import connectPgSimple from "connect-pg-simple";
import methodOverride from "method-override";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import pool from "./config/db.js";
import upload from "./config/cloudinary.js";
import setupPassport from "./config/passportSetup.js";

import authController from "./controllers/authController.js";
import publicController from "./controllers/publicController.js";
import adminController from "./controllers/adminController.js";
import managerController from "./controllers/managerController.js";

import { checkAuthenticated, checkRole } from "./middleware/auth.js";
import { processStaffCheckout } from "./controllers/orderController.js";

env.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const port = process.env.PORT || 3000;
const pgSession = connectPgSimple(session);
const isProduction = process.env.NODE_ENV === "production";

export default app;

// Middleware Setup

app.set("trust proxy", 1);

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
app.use(methodOverride("_method"));

// Setup & Initialize Passport

setupPassport();
app.use(passport.initialize());
app.use(passport.session());

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
    res.status(500).json({ error: "Error confirming payment" });
  }
});

// Fallback route for SPA page navigation moved to the bottom

// Register Routers

app.use("/", authController);
app.use("/", publicController);
app.use("/", adminController);
app.use("/", managerController);

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
});

// Start Server

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});