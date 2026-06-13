import express from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { checkAuthenticated } from "../middleware/auth.js";

const app = express();
const saltRounds = 10;

app.get("/api/auth/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    req.logIn(user, (err) => {
      if (err) return next(err);
      const rawRole = user.role || "";
      const role = rawRole.trim().toLowerCase();
      let targetUrl = "/";
      if (["admin", "manager", "store_manager", "cashier"].includes(role)) {
        targetUrl = "/admin/dashboard";
      } else if (role === "staff") {
        targetUrl = "/staff/menu";
      }
      return res.json({ message: "Login Successful", role: role, targetUrl: targetUrl });
    });
  })(req, res, next);
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  try {
    const checkResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (checkResult.rows.length > 0) {
      res.status(409).json({ error: "Email already exists" });
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) return res.status(500).json({ error: "Server Error" });
        else {
          const result = await pool.query(
            "INSERT INTO users (email, password, role) VALUES ($1, $2, 'user') RETURNING *",
            [email, hash]
          );
          req.login(result.rows[0], (err) => {
            if (err) return res.status(500).json({ error: "Login failed after register" });
            res.json({ message: "Registration successful", user: req.user });
          });
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logout successful" });
  });
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/secrets", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  const role = req.user.role;
  if (["admin", "manager", "store_manager"].includes(role)) {
    res.redirect("/admin/dashboard");
  } else {
    res.redirect("/");
  }
});

app.get("/api/profile", checkAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

app.put("/profile/update", checkAuthenticated, async (req, res) => {
  const { email, password } = req.body;
  const userId = req.user.id;
  try {
    if (password && password.length > 0) {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) return res.status(500).json({ error: "Hashing failed" });
        await pool.query("UPDATE users SET email = $1, password = $2 WHERE id = $3", [email, hash, userId]);
        res.json({ message: "Profile updated" });
      });
    } else {
      await pool.query("UPDATE users SET email = $1 WHERE id = $2", [email, userId]);
      res.json({ message: "Profile updated" });
    }
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

app.delete("/profile/delete", checkAuthenticated, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.user.id]);
    req.logout((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ message: "Account deleted" });
    });
  } catch (err) {
    res.status(500).json({ error: "Deletion failed" });
  }
});

export default app;