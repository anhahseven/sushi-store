import express from "express";
import cors from "cors";
import expressLayouts from "express-ejs-layouts";
import passport from "passport";
import session from "express-session";
import env from "dotenv";
import connectPgSimple from "connect-pg-simple";
import methodOverride from "method-override";

import pool from "./config/db.js";
import upload from "./config/cloudinary.js";
import setupPassport from "./config/passportSetup.js";

import authController from "./controllers/authController.js";
import publicController from "./controllers/publicController.js";
import adminController from "./controllers/adminController.js";
import managerController from "./controllers/managerController.js";

import { checkAuthenticated, checkRole } from "./middleware/auth.js";
import { renderPaymentPage } from "./controllers/paymentController.js";
import { processStaffCheckout } from "./controllers/orderController.js";

env.config();

const app = express();
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

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
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
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
app.get("/payment/:id", checkAuthenticated, renderPaymentPage);

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

// Register Routers

app.use("/", authController);
app.use("/", publicController);
app.use("/", adminController);
app.use("/", managerController);

// Start Server

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});