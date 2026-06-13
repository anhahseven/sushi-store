import express from "express";
import pool from "../config/db.js";
import crypto from "crypto";
import { checkAuthenticated, checkRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    const products = result.rows;
    const categories = [{ name: "Most Sales" }, ...[...new Set(products.map((p) => p.category))].map((c) => ({ name: c }))];
    res.json({ products, categories });
  } catch (err) {
    res.status(500).json({ error: "Server Error", products: [], categories: [] });
  }
});

router.get("/api/locations", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM locations ORDER BY id ASC");
    res.json({ locations: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/api/offers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
    const discountedProducts = result.rows.filter(p => p.discount_type && p.discount_type !== "none" && p.discount_value > 0);
    res.json({ products: discountedProducts });
  } catch (err) {
    res.status(500).json({ error: "Server Error", products: [] });
  }
});

router.get("/api/menu", async (req, res) => {
  try {
    const productsRes = await pool.query("SELECT * FROM products ORDER BY id ASC");
    const categoriesRes = await pool.query("SELECT * FROM categories ORDER BY id ASC");
    res.json({ products: productsRes.rows, categories: categoriesRes.rows });
  } catch (err) {
    res.status(500).json({ error: "Database Error" });
  }
});

router.get("/api/cart", async (req, res) => {
  if (!req.user || (typeof req.user.id === "string" && req.user.id.startsWith("env-"))) return res.json([]);
  try {
    const result = await pool.query(`SELECT c.id as cart_id, c.quantity, p.id as product_id, p.name, p.price, p.image_url FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1 ORDER BY c.id ASC`, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/api/cart", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Please login to add items" });
  if (typeof req.user.id === "string" && req.user.id.startsWith("env-")) return res.status(403).json({ error: "Super Admins cannot use the shopping cart." });
  const { productId } = req.body;
  try {
    const check = await pool.query("SELECT * FROM cart WHERE product_id = $1 AND user_id = $2", [productId, req.user.id]);
    if (check.rows.length > 0) await pool.query("UPDATE cart SET quantity = quantity + 1 WHERE product_id = $1 AND user_id = $2", [productId, req.user.id]);
    else await pool.query("INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, 1)", [req.user.id, productId]);
    res.json({ message: "Item added" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/api/cart/:id", async (req, res) => { // Update quantity (increment/decrement)
  if (!req.user) return res.status(401).json({ error: "Login required" });
  try {
    if (req.body.action === "increment") await pool.query("UPDATE cart SET quantity = quantity + 1 WHERE id = $1", [req.params.id]);
    else if (req.body.action === "decrement") {
      const current = await pool.query("SELECT quantity FROM cart WHERE id = $1", [req.params.id]);
      if (current.rows.length > 0 && current.rows[0].quantity > 1) await pool.query("UPDATE cart SET quantity = quantity - 1 WHERE id = $1", [req.params.id]);
      else await pool.query("DELETE FROM cart WHERE id = $1", [req.params.id]);
    }
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/api/cart/:id", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Login required" });
  try {
    await pool.query("DELETE FROM cart WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/api/checkout", checkAuthenticated, async (req, res) => {
  if (typeof req.user.id === "string" && req.user.id.startsWith("env-")) return res.status(403).json({ error: "Super Admins cannot checkout" });
  try {
    const cartRes = await pool.query(`SELECT c.*, p.name, p.price FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1`, [req.user.id]);
    const locRes = await pool.query("SELECT * FROM locations WHERE status = 'Open'");
    res.json({ cart: cartRes.rows, locations: locRes.rows });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/api/orders", checkAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const cartRes = await client.query(`SELECT c.product_id, c.quantity, p.price FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1`, [req.user.id]);
    if (cartRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cart is empty" });
    }
    const total = cartRes.rows.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const paymentMethod = req.body.payment_method || 'QR';
    let pickupLocation = req.body.pickup_location;
    if (!pickupLocation && req.user.role === 'staff' && req.user.assigned_location_id) {
      const locRes = await client.query('SELECT name FROM locations WHERE id = $1', [req.user.assigned_location_id]);
      if (locRes.rows.length) pickupLocation = locRes.rows[0].name;
    }
    const orderRes = await client.query("INSERT INTO orders (user_id, total_price, payment_method, pickup_location, status, table_number) VALUES ($1, $2, $3, $4, 'Pending', $5) RETURNING id", [req.user.id, total, paymentMethod, pickupLocation, req.body.table_number]);
    for (const item of cartRes.rows) {
      await client.query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)", [orderRes.rows[0].id, item.product_id, item.quantity, item.price]);
    }
    await client.query("DELETE FROM cart WHERE user_id = $1", [req.user.id]);
    await client.query("COMMIT");

    res.json({ message: "Order placed successfully", orderId: orderRes.rows[0].id, paymentMethod });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Error processing order" });
  } finally {
    client.release();
  }
});

router.get("/api/orders", checkAuthenticated, async (req, res) => {
  if (typeof req.user.id === "string" && req.user.id.startsWith("env-")) return res.json({ orders: [] });
  try {
    const result = await pool.query("SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
    res.json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/api/orders/request-cancel/:id", checkAuthenticated, async (req, res) => {
  try {
    await pool.query("UPDATE orders SET status = 'Cancel Requested' WHERE id = $1 AND user_id = $2 AND status = 'Pending'", [req.params.id, req.user.id]);
    res.json({ message: "Cancel requested" });
  } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

router.post("/api/orders/request-refund/:id", checkAuthenticated, async (req, res) => {
  try {
    await pool.query("UPDATE orders SET status = 'Refund Requested' WHERE id = $1 AND user_id = $2 AND status = 'Completed'", [req.params.id, req.user.id]);
    res.json({ message: "Refund requested" });
  } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

export default router;