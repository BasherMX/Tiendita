import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

// Singleton pool para PostgreSQL (Serverless Reusable Pool)
let pool;

export function getPool() {
  if (!pool) {
    const connectionString =
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL ||
      (process.env.DB_HOST
        ? `postgres://${process.env.DB_USER || "postgres"}:${encodeURIComponent(process.env.DB_PASSWORD || "")}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || "tiendita"}`
        : null);

    if (connectionString) {
      pool = new pg.Pool({
        connectionString,
        ssl: process.env.DB_ENCRYPT === "true" || connectionString.includes("sslmode=require") || process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
      });
    } else {
      pool = new pg.Pool({
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || "tiendita",
        ssl: process.env.DB_ENCRYPT === "true" ? { rejectUnauthorized: false } : false,
      });
    }
  }
  return pool;
}

// Helper para ejecutar consultas SQL en PostgreSQL
export async function query(text, params) {
  const dbPool = getPool();
  return await dbPool.query(text, params);
}

// Inicialización de Esquema
async function runSchema() {
  try {
    const schemaPath = path.join(process.cwd(), "schema.sql");
    if (!fs.existsSync(schemaPath)) return;
    const schema = fs.readFileSync(schemaPath, "utf-8");
    await query(schema);
    console.log("PostgreSQL schema execution completed");
  } catch (error) {
    console.error("Error executing schema:", error.message);
  }
}

// Middleware de Autenticación
function authGuard(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret");
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Helper de Ajustes (Settings)
async function getSettings() {
  try {
    const result = await query("SELECT key, value FROM settings");
    const settings = {};
    result.rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    return settings;
  } catch (err) {
    console.error("Error reading settings:", err.message);
    return {};
  }
}

// Authentication
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USER || "admin";
  const adminPass = process.env.ADMIN_PASS || "admin123";

  if (username !== adminUser || password !== adminPass) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET || "default_jwt_secret", {
    expiresIn: "365d",
  });
  return res.json({ token });
});

// Precios Públicos
app.get("/api/prices", async (req, res) => {
  try {
    const result = await query("SELECT name, sale_price AS price FROM sweets ORDER BY name");
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// CRUD Sweets (Dulces)
app.get("/api/sweets", authGuard, async (req, res) => {
  try {
    const result = await query("SELECT id, name, purchase_price, sale_price, stock, sold_count FROM sweets ORDER BY created_at DESC");
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/sweets", authGuard, async (req, res) => {
  const { name, purchasePrice, salePrice, stock } = req.body || {};
  if (!name || purchasePrice == null || salePrice == null) {
    return res.status(400).json({ message: "Missing required sweet fields" });
  }
  try {
    const result = await query(
      "INSERT INTO sweets (name, purchase_price, sale_price, stock) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, purchasePrice, salePrice, stock || 0]
    );
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/api/sweets/:id", authGuard, async (req, res) => {
  const { id } = req.params;
  const { name, purchasePrice, salePrice, stock } = req.body || {};
  try {
    const result = await query(
      "UPDATE sweets SET name = $1, purchase_price = $2, sale_price = $3, stock = $4 WHERE id = $5 RETURNING *",
      [name, purchasePrice, salePrice, stock, id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Sweet not found" });
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.delete("/api/sweets/:id", authGuard, async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM sweets WHERE id = $1", [id]);
    return res.json({ message: "Sweet deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// CRUD Clients
app.get("/api/clients", authGuard, async (req, res) => {
  try {
    const result = await query("SELECT id, name, total_debt, points, phone FROM clients ORDER BY name ASC");
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/clients", authGuard, async (req, res) => {
  const { name, phone } = req.body || {};
  if (!name) return res.status(400).json({ message: "Name is required" });
  try {
    const result = await query(
      "INSERT INTO clients (name, phone) VALUES ($1, $2) RETURNING *",
      [name, phone || null]
    );
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/api/clients/:id", authGuard, async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body || {};
  try {
    const result = await query(
      "UPDATE clients SET name = $1, phone = $2 WHERE id = $3 RETURNING *",
      [name, phone || null, id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Client not found" });
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.delete("/api/clients/:id", authGuard, async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM clients WHERE id = $1", [id]);
    return res.json({ message: "Client deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Movements (Movimientos de cuenta cliente)
app.get("/api/movements", authGuard, async (req, res) => {
  try {
    const result = await query(`
      SELECT m.id, m.client_id, c.name AS client_name, m.concept, m.amount, m.points, m.created_at
      FROM movements m
      JOIN clients c ON m.client_id = c.id
      ORDER BY m.created_at DESC
    `);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/movements", authGuard, async (req, res) => {
  const { clientId, concept, amount, items, pointsUsed = 0 } = req.body || {};
  if (!clientId || amount == null) {
    return res.status(400).json({ message: "Missing required movement fields" });
  }

  const dbPool = getPool();
  const clientConn = await dbPool.connect();

  try {
    await clientConn.query("BEGIN");

    // Client verification
    const clientRes = await clientConn.query("SELECT id, name, total_debt, points, phone FROM clients WHERE id = $1", [clientId]);
    if (!clientRes.rows.length) {
      await clientConn.query("ROLLBACK");
      return res.status(404).json({ message: "Client not found" });
    }
    const clientObj = clientRes.rows[0];

    const totalAmount = Number(amount);
    const pUsed = Number(pointsUsed || 0);

    // Insert Movement
    const movRes = await clientConn.query(
      "INSERT INTO movements (client_id, concept, amount, points) VALUES ($1, $2, $3, $4) RETURNING id",
      [clientId, concept || "Compra", totalAmount, pUsed]
    );
    const movementId = movRes.rows[0].id;

    let ticketItems = [];
    const normalizedItems = Array.isArray(items) ? items : [];

    if (normalizedItems.length > 0) {
      for (const item of normalizedItems) {
        const sweetRes = await clientConn.query("SELECT id, name, sale_price, stock FROM sweets WHERE id = $1", [item.sweetId]);
        if (sweetRes.rows.length > 0) {
          const sweet = sweetRes.rows[0];
          const qty = Number(item.quantity);
          const uPrice = Number(sweet.sale_price);

          await clientConn.query(
            "INSERT INTO movement_items (movement_id, sweet_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
            [movementId, item.sweetId, qty, uPrice]
          );

          await clientConn.query(
            "UPDATE sweets SET stock = stock - $1, sold_count = sold_count + $1 WHERE id = $2",
            [qty, item.sweetId]
          );

          ticketItems.push({ name: sweet.name, quantity: qty, unitPrice: uPrice });
        }
      }
    }

    // Update Client Debt & Points
    const settings = await getSettings();
    const rewardFactor = parseFloat(settings.reward_factor || "0.10");

    let newDebt = Number(clientObj.total_debt) + totalAmount;
    let earnedPoints = totalAmount > 0 ? totalAmount * rewardFactor : 0;
    let newPoints = Number(clientObj.points || 0) + earnedPoints - pUsed;

    await clientConn.query(
      "UPDATE clients SET total_debt = $1, points = $2 WHERE id = $3",
      [newDebt, Math.max(0, newPoints), clientId]
    );

    await clientConn.query("COMMIT");

    const updatedClientRes = await query("SELECT id, name, total_debt, points, phone FROM clients WHERE id = $1", [clientId]);
    const updatedClient = updatedClientRes.rows[0];

    // WhatsApp Ticket Dispatch
    sendWhatsAppTicketAutomatically(updatedClient, concept || "Compra", totalAmount, pUsed, ticketItems);

    return res.json({ message: "Movement created successfully", movementId });
  } catch (error) {
    await clientConn.query("ROLLBACK");
    return res.status(500).json({ message: error.message });
  } finally {
    clientConn.release();
  }
});

// Sales (Ventas al Contado)
app.get("/api/sales", authGuard, async (req, res) => {
  try {
    const result = await query("SELECT id, total_amount, created_at FROM sales ORDER BY created_at DESC");
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/sales", authGuard, async (req, res) => {
  const { totalAmount, items } = req.body || {};
  if (!items || !items.length) {
    return res.status(400).json({ message: "Sale must contain items" });
  }

  const dbPool = getPool();
  const clientConn = await dbPool.connect();

  try {
    await clientConn.query("BEGIN");

    const saleRes = await clientConn.query(
      "INSERT INTO sales (total_amount) VALUES ($1) RETURNING id",
      [totalAmount]
    );
    const saleId = saleRes.rows[0].id;

    for (const item of items) {
      const sweetRes = await clientConn.query("SELECT sale_price FROM sweets WHERE id = $1", [item.sweetId]);
      const uPrice = sweetRes.rows.length > 0 ? Number(sweetRes.rows[0].sale_price) : 0;

      await clientConn.query(
        "INSERT INTO sale_items (sale_id, sweet_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
        [saleId, item.sweetId, item.quantity, uPrice]
      );

      await clientConn.query(
        "UPDATE sweets SET stock = stock - $1, sold_count = sold_count + $1 WHERE id = $2",
        [item.quantity, item.sweetId]
      );
    }

    await clientConn.query("COMMIT");
    return res.json({ message: "Sale recorded successfully", saleId });
  } catch (error) {
    await clientConn.query("ROLLBACK");
    return res.status(500).json({ message: error.message });
  } finally {
    clientConn.release();
  }
});

// Purchase Places & Package Purchases
app.get("/api/purchase-places", authGuard, async (req, res) => {
  try {
    const result = await query("SELECT id, name, created_at FROM purchase_places ORDER BY name ASC");
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/purchase-places", authGuard, async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: "Place name is required" });
  try {
    const result = await query("INSERT INTO purchase_places (name) VALUES ($1) RETURNING *", [name]);
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/package-purchases", authGuard, async (req, res) => {
  try {
    const result = await query(`
      SELECT pp.id, pp.sweet_id, pp.product_name, pp.place_id, pl.name AS place_name, pp.package_cost, pp.created_at
      FROM package_purchases pp
      JOIN purchase_places pl ON pp.place_id = pl.id
      ORDER BY pp.created_at DESC
    `);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/package-purchases", authGuard, async (req, res) => {
  const { sweetId, productName, placeId, packageCost } = req.body || {};
  if (!productName || !placeId || packageCost == null) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const result = await query(
      "INSERT INTO package_purchases (sweet_id, product_name, place_id, package_cost) VALUES ($1, $2, $3, $4) RETURNING *",
      [sweetId || null, productName, placeId, packageCost]
    );
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Rewards (Premios) & Redemptions (Canjes)
app.get("/api/rewards", authGuard, async (req, res) => {
  try {
    const result = await query("SELECT id, name, points_cost, stock, sweet_id FROM rewards ORDER BY points_cost ASC");
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/rewards", authGuard, async (req, res) => {
  const { name, pointsCost, stock, sweetId } = req.body || {};
  try {
    const result = await query(
      "INSERT INTO rewards (name, points_cost, stock, sweet_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, pointsCost, stock || 0, sweetId || null]
    );
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/redemptions", authGuard, async (req, res) => {
  const { clientId, rewardId, sweetId, pointsSpent } = req.body || {};
  if (!clientId || pointsSpent == null) {
    return res.status(400).json({ message: "Missing required redemption fields" });
  }

  const dbPool = getPool();
  const clientConn = await dbPool.connect();

  try {
    await clientConn.query("BEGIN");

    const clientRes = await clientConn.query("SELECT points FROM clients WHERE id = $1", [clientId]);
    if (!clientRes.rows.length) {
      await clientConn.query("ROLLBACK");
      return res.status(404).json({ message: "Client not found" });
    }

    const currentPoints = Number(clientRes.rows[0].points || 0);
    const cost = Number(pointsSpent);

    if (currentPoints < cost) {
      await clientConn.query("ROLLBACK");
      return res.status(400).json({ message: "Insufficient points" });
    }

    await clientConn.query("UPDATE clients SET points = points - $1 WHERE id = $2", [cost, clientId]);

    await clientConn.query(
      "INSERT INTO redemptions (client_id, reward_id, sweet_id, points_spent) VALUES ($1, $2, $3, $4)",
      [clientId, rewardId || null, sweetId || null, cost]
    );

    if (sweetId) {
      await clientConn.query("UPDATE sweets SET stock = stock - 1 WHERE id = $1 AND stock > 0", [sweetId]);
    } else if (rewardId) {
      await clientConn.query("UPDATE rewards SET stock = stock - 1 WHERE id = $1 AND stock > 0", [rewardId]);
    }

    await clientConn.query("COMMIT");
    return res.json({ message: "Reward redeemed successfully" });
  } catch (error) {
    await clientConn.query("ROLLBACK");
    return res.status(400).json({ message: error.message });
  } finally {
    clientConn.release();
  }
});

// Settings (Ajustes)
app.get("/api/settings", authGuard, async (req, res) => {
  try {
    const settings = await getSettings();
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/api/settings", authGuard, async (req, res) => {
  const payload = req.body || {};
  try {
    for (const [key, value] of Object.entries(payload)) {
      await query(
        "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [key, String(value)]
      );
    }
    const updated = await getSettings();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// WhatsApp Integration (Meta Cloud API & OpenWA Fallback)
function formatWhatsAppNumber(phone, defaultPrefix = "52") {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return null;
  if (cleaned.length === 10) {
    cleaned = `${defaultPrefix}${cleaned}`;
  }
  if (cleaned.startsWith("52") && cleaned.length === 12) {
    cleaned = "521" + cleaned.substring(2);
  }
  return cleaned;
}

async function sendWhatsAppMessage(phone, text) {
  const settings = await getSettings();
  const provider = settings.whatsapp_provider || (process.env.META_WHATSAPP_TOKEN ? "meta" : "openwa");

  if (provider === "meta" || process.env.META_WHATSAPP_TOKEN) {
    const token = settings.meta_whatsapp_token || process.env.META_WHATSAPP_TOKEN;
    const phoneNumberId = settings.meta_phone_number_id || process.env.META_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      throw new Error("Meta WhatsApp API Token or Phone Number ID missing in settings/env.");
    }

    const cleanPhone = formatWhatsAppNumber(phone, settings.whatsapp_default_country);
    const metaUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const resp = await fetch(metaUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: { body: text },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Meta API Error (${resp.status}): ${errText}`);
    }

    return await resp.json();
  } else {
    // OpenWA Gateway Fallback
    const gatewayUrl = settings.whatsapp_gateway_url || "http://localhost:2785";
    const apiKey = settings.whatsapp_api_key || "";
    const sessionName = settings.whatsapp_session_id || "tiendita";
    const cleanPhone = formatWhatsAppNumber(phone, settings.whatsapp_default_country);

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["api_key"] = apiKey;

    const resp = await fetch(`${gatewayUrl}/api/sessions/${sessionName}/messages/send-text`, {
      method: "POST",
      headers,
      body: JSON.stringify({ chatId: `${cleanPhone}@c.us`, text }),
    });

    if (!resp.ok) {
      throw new Error(`OpenWA Gateway Error (${resp.status})`);
    }
    return await resp.json();
  }
}

async function sendWhatsAppTicketAutomatically(client, concept, amount, pointsUsed = 0, items = []) {
  try {
    const settings = await getSettings();
    if (settings.whatsapp_enabled !== "true" && settings.whatsapp_enabled !== true) {
      return;
    }
    if (!client.phone) return;

    const dateStr = new Date().toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    let lines = [];
    lines.push(`*Ticket de movimiento - Tiendita*`);
    lines.push(`📅 _Fecha: ${dateStr}_`);
    lines.push(``);
    lines.push(`Hola *${client.name}*, te comparto el movimiento registrado en tu cuenta:`);
    lines.push(``);
    lines.push(`*Detalle:* ${concept}`);
    lines.push(`*Monto:* $${Number(Math.abs(amount)).toFixed(2)}`);
    if (pointsUsed > 0) lines.push(`*Puntos Usados:* -${Number(pointsUsed).toFixed(2)} pts`);
    lines.push(``);

    if (Array.isArray(items) && items.length > 0) {
      lines.push(`*Detalle de compra:*`);
      items.forEach((item) => {
        lines.push(`• ${item.quantity}x ${item.name} ($${Number(item.unitPrice).toFixed(2)} c/u)`);
      });
      lines.push(``);
    }
    lines.push(`───────────────────`);

    let debtValue = Number(client.total_debt);
    let debtLabel = debtValue < 0 ? "*Saldo a favor:*" : "*Saldo Total Actual:*";
    lines.push(`💰 ${debtLabel} *$${Math.abs(debtValue).toFixed(2)}*`);
    lines.push(`⭐ *Puntos Disponibles:* ${Number(client.points || 0).toFixed(1)} pts`);
    lines.push(``);
    lines.push(`¡Gracias por tu preferencia! 🙌`);

    await sendWhatsAppMessage(client.phone, lines.join("\n"));
    console.log(`WhatsApp ticket sent to ${client.name}`);
  } catch (error) {
    console.error("Error sending WhatsApp ticket:", error.message);
  }
}

app.get("/api/whatsapp/status", authGuard, async (req, res) => {
  try {
    const settings = await getSettings();
    const provider = settings.whatsapp_provider || "meta";
    if (provider === "meta" || process.env.META_WHATSAPP_TOKEN) {
      return res.json({ status: "CONNECTED", provider: "meta" });
    }
    return res.json({ status: "DISCONNECTED", provider: "openwa" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/clients/:id/whatsapp-statement", authGuard, async (req, res) => {
  try {
    const clientId = Number(req.params.id);
    const clientRes = await query("SELECT id, name, total_debt, points, phone FROM clients WHERE id = $1", [clientId]);
    if (!clientRes.rows.length) return res.status(404).json({ message: "Client not found" });

    const client = clientRes.rows[0];
    if (!client.phone) return res.status(400).json({ message: "Client has no registered phone number" });

    const message = `Hola ${client.name}, tu saldo total en Tiendita es de $${Number(client.total_debt).toFixed(2)} y cuentas con ${Number(client.points || 0).toFixed(1)} pts. ¡Gracias!`;
    await sendWhatsAppMessage(client.phone, message);

    return res.json({ message: "WhatsApp statement sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/health", (req, res) => {
  return res.json({ status: "ok" });
});

// Inicio en desarrollo local (no interfiere con Vercel Serverless)
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  runSchema().then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Tiendita backend running on port ${port}`);
    });
  });
}

export default app;
