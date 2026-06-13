import express from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { checkAuthenticated, checkRole } from "../middleware/auth.js";
import upload from "../config/cloudinary.js"; // Import upload from your config folder

const app = express();
const saltRounds = 10;

app.get("/admin/dashboard", checkAuthenticated, checkRole(["manager", "admin", "store_manager"]), async (req, res) => {
  try {
    const client = await pool.connect();
    let filterLocationName = null;
    let locationFilterClause = "";
    let queryParams = [];

    const allLocationsRes = await client.query("SELECT * FROM locations ORDER BY name ASC");

    if (req.user.role === "store_manager" && req.user.assigned_location_id) {
      const myLoc = allLocationsRes.rows.find(l => l.id === req.user.assigned_location_id);
      filterLocationName = myLoc ? myLoc.name : "Unknown";
    } else if (req.query.location && req.query.location !== "All") {
      filterLocationName = req.query.location;
    }

    if (filterLocationName) {
      locationFilterClause = "AND pickup_location = $1";
      queryParams.push(filterLocationName);
    }

    const productCountRes = await client.query("SELECT COUNT(*) FROM products");
    const userCountRes = await client.query("SELECT COUNT(*) FROM users");
    const orderCountRes = await client.query(`SELECT COUNT(*) FROM orders WHERE 1=1 ${locationFilterClause}`, queryParams);
    const revenueRes = await client.query(`SELECT SUM(total_price) FROM orders WHERE status = 'Completed' ${locationFilterClause}`, queryParams);
    
    const chartRes = await client.query(`SELECT to_char(created_at, 'Mon DD') as day, SUM(total_price) as daily_sales FROM orders WHERE status = 'Completed' AND created_at > NOW() - INTERVAL '7 days' ${locationFilterClause} GROUP BY day, created_at ORDER BY created_at ASC`, queryParams);
    const statusRes = await client.query(`SELECT status, COUNT(*) as count FROM orders WHERE 1=1 ${locationFilterClause} GROUP BY status`, queryParams);

    client.release();
    res.json({ title: "Dashboard", productsCount: productCountRes.rows[0].count, userCount: userCountRes.rows[0].count, ordersCount: orderCountRes.rows[0].count, totalRevenue: parseFloat(revenueRes.rows[0].sum || 0).toFixed(2), chartData: chartRes.rows, statusData: statusRes.rows, locations: allLocationsRes.rows, currentFilter: filterLocationName || "All" });
  } catch (err) {
    res.json({ title: "Dashboard", productsCount: 0, userCount: 0, ordersCount: 0, totalRevenue: 0, chartData: [], statusData: [], locations: [], currentFilter: "All" });
  }
});

app.get("/admin/reports", checkAuthenticated, checkRole(["manager", "admin", "store_manager"]), async (req, res) => {
  try {
    const selectedDate = req.query.date || new Date().toISOString().split("T")[0];
    let filterLocationName = null;
    let dbParams = [selectedDate];
    let locationSql = "";

    const allLocationsRes = await pool.query("SELECT * FROM locations ORDER BY name ASC");
    if (req.user.role === "store_manager" && req.user.assigned_location_id) {
      const myLoc = allLocationsRes.rows.find(l => l.id === req.user.assigned_location_id);
      filterLocationName = myLoc ? myLoc.name : null;
    } else if (req.query.location && req.query.location !== "All") {
      filterLocationName = req.query.location;
    }

    if (filterLocationName) {
      locationSql = "AND o.pickup_location = $2";
      dbParams.push(filterLocationName);
    }

    const ordersRes = await pool.query(`SELECT o.*, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE DATE(o.created_at) = $1 ${locationSql} ORDER BY o.created_at DESC`, dbParams);
    let grossSales = 0, completedCount = 0;
    ordersRes.rows.forEach(o => { if (o.status === "Completed") { grossSales += parseFloat(o.total_price); completedCount++; } });

    res.json({ title: "Sales Reports", orders: ordersRes.rows, stats: { grossSales: grossSales.toFixed(2), netProfit: (grossSales * 0.7).toFixed(2), avgOrderValue: completedCount > 0 ? (grossSales / completedCount).toFixed(2) : "0.00", totalTx: ordersRes.rows.length }, selectedDate, locations: allLocationsRes.rows, currentFilter: filterLocationName || "All" });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get("/admin/orders", checkAuthenticated, checkRole(["manager", "admin", "store_manager", "staff", "cashier"]), async (req, res) => {
  try {
    let query = `SELECT o.*, u.email, l.address AS location_address FROM orders o LEFT JOIN users u ON o.user_id = u.id LEFT JOIN locations l ON o.pickup_location = l.name WHERE 1=1`;
    let params = [];
    let paramIdx = 1;
    if (req.query.status) {
      query += ` AND o.status = $${paramIdx++}`;
      params.push(req.query.status);
    }
    if (req.query.date) {
      query += ` AND DATE(o.created_at) = $${paramIdx++}`;
      params.push(req.query.date);
    }
    if (req.query.location) {
      query += ` AND o.pickup_location = $${paramIdx++}`;
      params.push(req.query.location);
    }
    query += ` ORDER BY CASE WHEN o.status LIKE '%Requested%' THEN 0 ELSE 1 END, o.created_at DESC`;
    const result = await pool.query(query, params);
    const locResult = await pool.query("SELECT * FROM locations ORDER BY name ASC");
    res.json({ title: "Order Management", orders: result.rows, query: req.query, locations: locResult.rows });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.patch("/admin/orders/:id/status", checkAuthenticated, checkRole(["manager", "admin", "store_manager", "staff", "cashier"]), async (req, res) => {
  try {
    await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [req.body.status, req.params.id]);
    const msg = encodeURIComponent(`Order ${req.params.id} set to ${req.body.status}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/admin/orders/handle-request/:id", checkAuthenticated, checkRole(["admin", "manager", "store_manager", "staff", "cashier"]), async (req, res) => {
  const { action } = req.body;
  let newStatus = "";
  if (action === "approve_cancel") newStatus = "Cancelled";
  if (action === "reject_cancel") newStatus = "Pending";
  if (action === "approve_refund") newStatus = "Refunded";
  if (action === "reject_refund") newStatus = "Completed";
  try {
    await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [newStatus, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.json({ success: true }); }
});

app.delete("/admin/orders/delete/:id", checkAuthenticated, checkRole(["manager", "admin", "store_manager"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM order_items WHERE order_id = $1", [req.params.id]);
    await pool.query("DELETE FROM orders WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// New delete route for singular admin/order path
app.delete("/admin/order/delete/:id", checkAuthenticated, checkRole(["manager", "admin", "store_manager", "staff", "cashier"]), async (req, res) => {
    try {
        await pool.query("DELETE FROM order_items WHERE order_id = $1", [req.params.id]);
        await pool.query("DELETE FROM orders WHERE id = $1", [req.params.id]);
        // Redirect back to the orders list after deletion
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/admin/orders/edit/:id", checkAuthenticated, checkRole(["manager", "admin", "store_manager", "staff", "cashier"]), async (req, res) => {
// Existing edit route
  try {
    const orderRes = await pool.query(`SELECT o.*, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = $1`, [req.params.id]);
    if (orderRes.rows.length === 0) return res.json({ success: true });
    const itemsRes = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [req.params.id]);
    const locRes = await pool.query("SELECT * FROM locations");
    res.json({ title: "Edit Order", order: orderRes.rows[0], items: itemsRes.rows, locations: locRes.rows });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// New edit route for singular admin/order path
app.get("/admin/order/edit/:id", checkAuthenticated, checkRole(["manager", "admin", "store_manager", "staff", "cashier"]), async (req, res) => {
    try {
        const orderRes = await pool.query(`SELECT o.*, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = $1`, [req.params.id]);
        if (orderRes.rows.length === 0) return res.json({ success: true });
        const itemsRes = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [req.params.id]);
        const locRes = await pool.query("SELECT * FROM locations");
        res.json({ title: "Edit Order", order: orderRes.rows[0], items: itemsRes.rows, locations: locRes.rows });
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.put("/admin/order/update/:id", checkAuthenticated, checkRole(["manager", "admin", "store_manager", "staff", "cashier"]), async (req, res) => {
    try {
        await pool.query("UPDATE orders SET status=$1, payment_method=$2, pickup_location=$3, table_number=$4 WHERE id=$5", [req.body.status, req.body.payment_method, req.body.pickup_location, req.body.table_number, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.delete("/admin/orders/items/delete/:itemId", checkAuthenticated, checkRole(["manager", "admin", "store_manager", "staff", "cashier"]), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const itemRes = await client.query("SELECT order_id, price, quantity FROM order_items WHERE id = $1", [req.params.itemId]);
    if (itemRes.rows.length === 0) { await client.query("ROLLBACK"); return res.json({ success: true }); }
    const { order_id, price, quantity } = itemRes.rows[0];
    await client.query("DELETE FROM order_items WHERE id = $1", [req.params.itemId]);
    await client.query("UPDATE orders SET total_price = total_price - $1 WHERE id = $2", [price * quantity, order_id]);
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) { await client.query("ROLLBACK"); res.status(500).json({ error: "Server error" }); } finally { client.release(); }
});

app.patch("/admin/orders/items/update/:itemId", checkAuthenticated, checkRole(["manager", "admin", "store_manager", "staff", "cashier"]), async (req, res) => {
  const client = await pool.connect();
  try {
    const newQuantity = parseInt(req.body.quantity);
    if (newQuantity < 1) return res.json({ success: false, action: "redirect" });
    await client.query("BEGIN");
    const itemRes = await client.query("SELECT order_id, price, quantity FROM order_items WHERE id = $1", [req.params.itemId]);
    if (itemRes.rows.length === 0) { await client.query("ROLLBACK"); return res.json({ success: true }); }
    const { order_id, price, quantity: oldQuantity } = itemRes.rows[0];
    await client.query("UPDATE order_items SET quantity = $1 WHERE id = $2", [newQuantity, req.params.itemId]);
    await client.query("UPDATE orders SET total_price = total_price + $1 WHERE id = $2", [(newQuantity - oldQuantity) * price, order_id]);
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) { await client.query("ROLLBACK"); res.status(500).json({ error: "Server error" }); } finally { client.release(); }
});

app.put("/admin/orders/update/:id", checkAuthenticated, checkRole(["manager", "admin", "store_manager", "staff", "cashier"]), async (req, res) => {
  try {
    await pool.query("UPDATE orders SET status=$1, payment_method=$2, pickup_location=$3, table_number=$4 WHERE id=$5", [req.body.status, req.body.payment_method, req.body.pickup_location, req.body.table_number, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Admin Stock & Inventory Routes
app.get("/admin/stock/menu", checkAuthenticated, checkRole(["manager", "admin"]), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM stocks ORDER BY category, name ASC");
    res.json({ title: "Master Ingredient Menu", stocks: result.rows });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/admin/stock/menu/add", checkAuthenticated, checkRole(["manager", "admin"]), upload.single("image"), async (req, res) => {
  try {
    await pool.query("INSERT INTO stocks (name, category, unit, image_url, quantity) VALUES ($1, $2, $3, $4, 0)", [req.body.name, req.body.category, req.body.unit, req.file ? req.file.path : ""]);
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: "Action failed" }); }
});

app.patch("/api/stock/menu/:id", checkAuthenticated, checkRole(["manager", "admin"]), async (req, res) => {
  try {
    await pool.query("UPDATE stocks SET name=$1, category=$2, unit=$3, image_url=$4 WHERE id=$5", [req.body.name, req.body.category, req.body.unit, req.body.image_url, req.params.id]);
    res.json({ message: "Updated" });
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

app.delete("/api/stock/menu/:id", checkAuthenticated, checkRole(["manager", "admin"]), async (req, res) => {
  try { await pool.query("DELETE FROM stocks WHERE id=$1", [req.params.id]); res.json({ message: "Deleted" }); }
  catch (err) { res.status(500).json({ error: "Error" }); }
});

app.post("/admin/stock/:id/status", checkAuthenticated, checkRole(["admin", "manager"]), async (req, res) => {
  try {
    await pool.query("UPDATE stock_requests SET status = $1 WHERE id = $2", [req.body.status, req.params.id]);
    res.json({ success: true, message: "Status updated successfully" });
  } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

app.get("/admin/stock/request/:id", checkAuthenticated, async (req, res) => {
  try {
    const requestResult = await pool.query(`SELECT * FROM stock_requests WHERE id = $1`, [req.params.id]);
    if (requestResult.rows.length === 0) return res.status(500).json({ error: "Server error" });
    const itemsResult = await pool.query(`SELECT * FROM stock_request_items WHERE request_id = $1`, [req.params.id]);
    const locationsResult = await pool.query("SELECT * FROM locations");
    res.json({ title: "View Stock Request", user: req.user, request: requestResult.rows[0], items: itemsResult.rows, locations: locationsResult.rows, query: {} });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get("/admin/stock", checkAuthenticated, checkRole(["manager", "admin", "store_manager"]), async (req, res) => {
  try {
    let query = `SELECT s.*, u.email FROM stock_requests s LEFT JOIN users u ON s.user_id = u.id `;
    let params = [];
    if (req.user.role === "store_manager" && req.user.assigned_location_id) {
      const locRes = await pool.query("SELECT name FROM locations WHERE id = $1", [req.user.assigned_location_id]);
      if (locRes.rows.length > 0) { query += ` WHERE s.location_name = $1`; params.push(locRes.rows[0].name); }
    }
    query += ` ORDER BY s.created_at DESC`;
    const result = await pool.query(query, params);
    const locResult = await pool.query("SELECT * FROM locations");
    const stockResult = await pool.query("SELECT * FROM stocks ORDER BY category, name ASC");
    res.json({ title: "Stock Requests", requests: result.rows, locations: locResult.rows, stocks: stockResult.rows });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get("/admin/stock/create", checkAuthenticated, checkRole(["manager", "admin", "store_manager"]), async (req, res) => {
  try {
    const locRes = await pool.query("SELECT * FROM locations");
    const prodRes = await pool.query("SELECT * FROM products ORDER BY category, name");
    const catRes = await pool.query("SELECT * FROM categories ORDER BY id ASC");
    let stocks = [];
    try { const stockRes = await pool.query("SELECT * FROM stocks ORDER BY category, name"); stocks = stockRes.rows; } catch (e) {}
    res.json({ title: "Stock Management", locations: locRes.rows, products: prodRes.rows, categories: catRes.rows, stocks: stocks });
  } catch (err) { res.json({ success: true }); }
});

app.post("/admin/stock/add", checkAuthenticated, checkRole(["manager", "admin", "store_manager"]), upload.single("image"), async (req, res) => {
  try {
    await pool.query("INSERT INTO stocks (name, category, quantity, unit, image_url) VALUES ($1, $2, $3, $4, $5)", [req.body.name, req.body.category, req.body.quantity || 0, req.body.unit, req.file ? req.file.path : ""]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.patch("/api/stock/:id", checkAuthenticated, checkRole(["manager", "admin", "store_manager"]), async (req, res) => {
  try {
    await pool.query("UPDATE stocks SET name=$1, category=$2, quantity=$3, unit=$4, image_url=$5 WHERE id=$6", [req.body.name, req.body.category, req.body.quantity, req.body.unit, req.body.image_url, req.params.id]);
    res.json({ message: "Updated" });
  } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

app.delete("/api/stock/:id", checkAuthenticated, checkRole(["manager", "admin", "store_manager"]), async (req, res) => {
  try { await pool.query("DELETE FROM stocks WHERE id=$1", [req.params.id]); res.json({ message: "Deleted" }); }
  catch (err) { res.status(500).json({ error: "Delete failed" }); }
});

app.post("/api/stock/create", checkAuthenticated, async (req, res) => {
  if (typeof req.user.id === "string" && req.user.id.startsWith("env-")) return res.status(403).json({ error: "Super Admins cannot submit requests." });
  try {
    const requestResult = await pool.query(`INSERT INTO stock_requests (user_id, location_name, status, created_at) VALUES ($1, $2, 'Pending', NOW()) RETURNING id`, [req.user.id, req.body.location_name]);
    for (const item of req.body.items) { await pool.query(`INSERT INTO stock_request_items (stock_request_id, item_name, quantity, category) VALUES ($1, $2, $3, $4)`, [requestResult.rows[0].id, item.name, item.quantity, item.category]); }
    res.json({ success: true, id: requestResult.rows[0].id });
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

app.post("/api/stock/update-status/:id", checkAuthenticated, async (req, res) => {
  try {
    const currentReq = await pool.query("SELECT * FROM stock_requests WHERE id = $1", [req.params.id]);
    if (currentReq.rows.length === 0) return res.status(404).json({ error: "Request not found" });
    const currentStatus = currentReq.rows[0].status;
    const role = req.user.role;
    
    if (role === "store_manager") {
      if (!((req.body.status === "Cancel Requested" && currentStatus === "Pending") || (req.body.status === "Refund Requested" && currentStatus === "Confirmed"))) return res.status(403).json({ error: "Invalid status change for Store Manager" });
    } else if (role === "admin" || role === "manager") {
      if (!["Cancelled", "Refunded", "Confirmed", "Rejected"].includes(req.body.status)) return res.status(400).json({ error: "Invalid status" });
    } else { return res.status(403).json({ error: "Unauthorized" }); }

    await pool.query("UPDATE stock_requests SET status = $1 WHERE id = $2", [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

app.get("/add-item", checkAuthenticated, checkRole(["manager", "admin"]), (req, res) => { res.json({ title: "Add Item" }); });

app.get("/admin/inventory", checkAuthenticated, checkRole(["manager", "admin"]), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
    const categoryResult = await pool.query("SELECT * FROM categories ORDER BY id ASC");
    res.json({ title: "Inventory Management", products: result.rows, categories: [{ name: "On Sale" }, ...categoryResult.rows] });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/admin/inventory/add", checkAuthenticated, checkRole(["manager", "admin"]), upload.single("image"), async (req, res) => {
  try {
    const nameCheck = await pool.query("SELECT * FROM products WHERE name = $1", [req.body.name]);
    if (nameCheck.rows.length > 0) return res.status(400).json({ error: "Action failed" });
    
    const catCheck = await pool.query("SELECT * FROM categories WHERE name = $1", [req.body.category]);
    if (catCheck.rows.length === 0) await pool.query("INSERT INTO categories (name) VALUES ($1)", [req.body.category]);

    await pool.query("INSERT INTO products (name, category, price, image_url, is_best_seller, discount_type, discount_value) VALUES ($1, $2, $3, $4, $5, $6, $7)", [req.body.name, req.body.category, req.body.price, req.file ? req.file.path : "https://via.placeholder.com/150", req.body.is_best_seller === "true", req.body.discount_type || "none", req.body.discount_value || 0]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Delete inventory item
app.delete("/api/inventory/:id", checkAuthenticated, checkRole(["manager","admin"]), async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting product" });
  }
});

// Update inventory item
app.patch("/api/inventory/:id", checkAuthenticated, checkRole(["manager","admin"]), async (req, res) => {
  try {
    const { name, category, price, discount_type, discount_value, is_best_seller } = req.body;
    await pool.query(
      "UPDATE products SET name=$1, category=$2, price=$3, discount_type=$4, discount_value=$5, is_best_seller=$6 WHERE id=$7",
      [name, category, price, discount_type, discount_value, is_best_seller === "true", req.params.id]
    );
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: "Error updating product" });
  }
});

app.get("/admin/locations", checkAuthenticated, checkRole(["manager", "admin"]), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM locations ORDER BY id ASC");
    res.json({ title: "Location Management", locations: result.rows });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/locations", checkAuthenticated, checkRole(["manager", "admin"]), async (req, res) => {
  try {
    await pool.query("INSERT INTO locations (name, address, google_map_url, status, hours_mon_fri, hours_sat_sun) VALUES ($1, $2, $3, $4, $5, $6)", [req.body.name, req.body.address, req.body.google_map_url, req.body.status, req.body.hours_mon_fri, req.body.hours_sat_sun]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.patch("/api/locations/:id", checkAuthenticated, checkRole(["manager", "admin"]), async (req, res) => {
  try {
    await pool.query("UPDATE locations SET name=$1, address=$2, google_map_url=$3, status=$4, hours_mon_fri=$5, hours_sat_sun=$6 WHERE id=$7", [req.body.name, req.body.address, req.body.google_map_url, req.body.status, req.body.hours_mon_fri, req.body.hours_sat_sun, req.params.id]);
    res.json({ message: "Updated successfully" });
  } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

app.delete("/api/locations/:id", checkAuthenticated, checkRole(["admin"]), async (req, res) => {
  try { await pool.query("DELETE FROM locations WHERE id=$1", [req.params.id]); res.json({ message: "Deleted successfully" }); }
  catch (err) { res.status(500).json({ error: "Delete failed" }); }
});

app.get("/admin/users", checkAuthenticated, checkRole(["admin"]), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id ASC");
    const locResult = await pool.query("SELECT * FROM locations ORDER BY name ASC");
    res.json({ title: "User Management", usersList: result.rows, locations: locResult.rows });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.delete("/admin/users/delete/:id", checkAuthenticated, checkRole(["admin"]), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) return res.json({ success: true });
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.json({ success: true }); }
});

app.get("/admin/users/edit/:id", checkAuthenticated, checkRole(["admin"]), async (req, res) => {
  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
    if (userResult.rows.length > 0) {
      const locResult = await pool.query("SELECT * FROM locations");
      res.json({ title: "Edit User", targetUser: userResult.rows[0], locations: locResult.rows });
    } else res.json({ success: true });
  } catch (err) { res.json({ success: true }); }
});

app.put("/admin/users/update/:id", checkAuthenticated, checkRole(["admin"]), async (req, res) => {
  try {
    const finalLocation = ["store_manager", "staff", "cashier"].includes(req.body.role) ? req.body.assigned_location_id : null;
    if (req.body.password && req.body.password.length > 0) {
      const hash = await bcrypt.hash(req.body.password, saltRounds);
      await pool.query("UPDATE users SET email = $1, password = $2, role = $3, assigned_location_id = $4 WHERE id = $5", [req.body.email, hash, req.body.role, finalLocation, req.params.id]);
    } else {
      await pool.query("UPDATE users SET email = $1, role = $2, assigned_location_id = $3 WHERE id = $4", [req.body.email, req.body.role, finalLocation, req.params.id]);
    }
    res.json({ success: true });
  } catch (err) { res.json({ success: true }); }
});

app.post("/admin/create-manager", checkAuthenticated, checkRole(["admin", "manager"]), async (req, res) => {
  try {
    const checkResult = await pool.query("SELECT * FROM users WHERE email = $1", [req.body.email]);
    if (checkResult.rows.length > 0) return res.status(400).json({ error: "Action failed" });
    if (["store_manager", "staff", "cashier"].includes(req.body.role) && !req.body.assigned_location_id) return res.status(400).json({ error: "Action failed" });
    const finalLocation = ["store_manager", "staff", "cashier"].includes(req.body.role) ? req.body.assigned_location_id : null;
    bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
      await pool.query("INSERT INTO users (email, password, role, assigned_location_id) VALUES ($1, $2, $3, $4)", [req.body.email, hash, req.body.role, finalLocation]);
      res.json({ success: true });
    });
  } catch (err) { res.json({ success: true }); }
});

app.get("/admin/category", checkAuthenticated, checkRole(["manager", "admin"]), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY id ASC");
    res.json({ title: "Category Management", layout: "layout", categories: result.rows, userRole: req.user.role });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/category", checkAuthenticated, checkRole(["manager", "admin"]), async (req, res) => {
  try { await pool.query("INSERT INTO categories (name) VALUES ($1)", [req.body.name]); res.status(201).json({ message: "Category Created" }); }
  catch (err) { res.status(500).json({ error: "Database Error" }); }
});

app.patch("/api/category/:id", checkAuthenticated, checkRole(["manager", "admin"]), async (req, res) => {
  try { await pool.query("UPDATE categories SET name = $1 WHERE id = $2", [req.body.name, req.params.id]); res.status(200).json({ message: "Category Updated" }); }
  catch (err) { res.status(500).json({ error: "Database Error" }); }
});

app.delete("/api/category/:id", checkAuthenticated, checkRole(["admin"]), async (req, res) => {
  try { await pool.query("DELETE FROM categories WHERE id = $1", [req.params.id]); res.status(200).json({ message: "Category Deleted" }); }
  catch (err) { res.status(500).json({ error: "Database Error" }); }
});

export default app;