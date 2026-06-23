import express from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { checkAuthenticated } from "../middleware/auth.js";

const router = express.Router();
const saltRounds = 10;

router.get("/api/auth/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

router.post("/login", (req, res, next) => {
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

router.post("/register", async (req, res) => {
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

router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logout successful" });
  });
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/login");
  });
});

router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/auth/google/secrets", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  const role = req.user.role;
  if (["admin", "manager", "store_manager"].includes(role)) {
    res.redirect("/admin/dashboard?loginSuccess=true");
  } else {
    res.redirect("/?loginSuccess=true");
  }
});

router.get("/api/profile", checkAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

router.put("/profile/update", checkAuthenticated, async (req, res) => {
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

router.delete("/profile/delete", checkAuthenticated, async (req, res) => {
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

router.post("/api/auth/verify-password", checkAuthenticated, async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  try {
    const userId = req.user.id;
    const userResult = await pool.query("SELECT password FROM users WHERE id = $1", [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const hash = userResult.rows[0].password;
    const match = await bcrypt.compare(password, hash);
    if (match) {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ error: "Incorrect password" });
    }
  } catch (err) {
    console.error("Password verification error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;