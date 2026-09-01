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
        ssl:
          process.env.DB_ENCRYPT === "true" ||
          connectionString.includes("sslmode=require") ||
          process.env.NODE_ENV === "production"
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
        ssl:
          process.env.DB_ENCRYPT === "true"
            ? { rejectUnauthorized: false }
            : false,
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
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, "utf-8");
      await query(schema);
    }
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
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_jwt_secret",
    );
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

const defaultMetaToken = process.env.META_WHATSAPP_TOKEN || "";
const defaultPhoneId = process.env.META_PHONE_NUMBER_ID || "";

// Helper de Ajustes (Settings)
async function getSettings() {
  try {
    const result = await query("SELECT key, value FROM settings");
    const settings = {
      reward_factor: 0.1,
      rewards_enabled: true,
      whatsapp_enabled: true,
      whatsapp_provider: "meta",
      whatsapp_gateway_url: "http://openwa:2785",
      whatsapp_api_key: "",
      whatsapp_session_id: "tiendita",
      whatsapp_default_country: "52",
      meta_whatsapp_token: defaultMetaToken,
      meta_phone_number_id: defaultPhoneId,
    };
    result.rows.forEach((row) => {
      if (row.key === "reward_factor")
        settings.reward_factor = parseFloat(row.value) || 0;
      else if (row.key === "rewards_enabled")
        settings.rewards_enabled = row.value === "true";
      else if (row.key === "whatsapp_enabled")
        settings.whatsapp_enabled = row.value === "true";
      else if (row.value) settings[row.key] = row.value;
    });
    return settings;
  } catch (err) {
    console.error("Error reading settings:", err.message);
    return {
      reward_factor: 0.1,
      rewards_enabled: true,
      whatsapp_enabled: true,
      whatsapp_provider: "meta",
      meta_whatsapp_token: defaultMetaToken,
      meta_phone_number_id: defaultPhoneId,
      whatsapp_default_country: "52",
    };
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

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET || "default_jwt_secret",
    {
      expiresIn: "365d",
    },
  );
  return res.json({ token });
});

// Precios Públicos
app.get("/api/prices", async (req, res) => {
  try {
    const result = await query(
      "SELECT name, sale_price AS price FROM sweets ORDER BY name",
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// CRUD Sweets
app.get("/api/sweets", authGuard, async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, purchase_price, sale_price, stock, sold_count FROM sweets ORDER BY created_at DESC",
    );
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
      [name, purchasePrice, salePrice, Number(stock) || 0],
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
      [name, purchasePrice, salePrice, Number(stock) || 0, id],
    );
    if (!result.rows.length)
      return res.status(404).json({ message: "Sweet not found" });
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

app.get("/api/sweets/stats", authGuard, async (req, res) => {
  try {
    const totals = await query(
      "SELECT COUNT(*) AS total_products, COALESCE(SUM(stock), 0) AS total_stock, COALESCE(SUM(sold_count), 0) AS total_sold FROM sweets",
    );
    const topSeller = await query(
      "SELECT name, sold_count FROM sweets ORDER BY sold_count DESC, name ASC LIMIT 1",
    );
    const lowSeller = await query(
      "SELECT name, sold_count FROM sweets ORDER BY sold_count ASC, name ASC LIMIT 1",
    );
    const lowStock = await query(
      "SELECT name, stock FROM sweets ORDER BY stock ASC, name ASC LIMIT 1",
    );
    return res.json({
      totals: totals.rows[0] || {
        total_products: 0,
        total_stock: 0,
        total_sold: 0,
      },
      topSeller: topSeller.rows[0] || null,
      lowSeller: lowSeller.rows[0] || null,
      lowStock: lowStock.rows[0] || null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Estadísticas Generales
app.get("/api/stats", authGuard, async (req, res) => {
  try {
    const lowStockThreshold = 10;
    const criticalStockThreshold = 3;

    const dailyTotals = await query(`
      SELECT day, SUM(total) AS total, SUM(profit) AS profit
      FROM (
        SELECT m.created_at::date AS day,
               SUM(mi.quantity * mi.unit_price) AS total,
               SUM(mi.quantity * (mi.unit_price - s.purchase_price)) AS profit
        FROM movements m
        JOIN movement_items mi ON mi.movement_id = m.id
        JOIN sweets s ON s.id = mi.sweet_id
        WHERE m.amount > 0 AND m.concept LIKE 'Compra%'
        GROUP BY m.created_at::date
        UNION ALL
        SELECT si.created_at::date AS day,
               SUM(si.quantity * si.unit_price) AS total,
               SUM(si.quantity * (si.unit_price - s.purchase_price)) AS profit
        FROM sale_items si
        JOIN sweets s ON s.id = si.sweet_id
        GROUP BY si.created_at::date
      ) AS combined
      GROUP BY day
      ORDER BY day DESC
    `);

    const topSeller = await query(
      "SELECT name, sold_count FROM sweets ORDER BY sold_count DESC, name ASC LIMIT 1",
    );
    const lowSeller = await query(
      "SELECT name, sold_count FROM sweets ORDER BY sold_count ASC, name ASC LIMIT 1",
    );
    const lowStock = await query(
      "SELECT id, name, stock FROM sweets WHERE stock <= $1 ORDER BY stock ASC, name ASC",
      [lowStockThreshold],
    );

    return res.json({
      dailyTotals: dailyTotals.rows || [],
      topSeller: topSeller.rows[0] || null,
      lowSeller: lowSeller.rows[0] || null,
      lowStock: lowStock.rows || [],
      thresholds: {
        low: lowStockThreshold,
        critical: criticalStockThreshold,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/stats/weekly", authGuard, async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ message: "from and to dates required" });
  }
  try {
    const result = await query(
      `SELECT day, SUM(total) AS total, SUM(profit) AS profit
       FROM (
         SELECT m.created_at::date AS day,
                SUM(mi.quantity * mi.unit_price) AS total,
                SUM(mi.quantity * (mi.unit_price - s.purchase_price)) AS profit
         FROM movements m
         JOIN movement_items mi ON mi.movement_id = m.id
         JOIN sweets s ON s.id = mi.sweet_id
         WHERE m.amount > 0 AND m.concept LIKE 'Compra%'
           AND m.created_at::date BETWEEN $1::date AND $2::date
         GROUP BY m.created_at::date
         UNION ALL
         SELECT si.created_at::date AS day,
                SUM(si.quantity * si.unit_price) AS total,
                SUM(si.quantity * (si.unit_price - s.purchase_price)) AS profit
         FROM sale_items si
         JOIN sweets s ON s.id = si.sweet_id
         WHERE si.created_at::date BETWEEN $1::date AND $2::date
         GROUP BY si.created_at::date
       ) AS combined
       GROUP BY day
       ORDER BY day ASC`,
      [from, to],
    );

    const days = result.rows || [];
    const total = days.reduce((sum, row) => sum + Number(row.total || 0), 0);
    const profit = days.reduce((sum, row) => sum + Number(row.profit || 0), 0);
    return res.json({ total, profit, days });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/stats/day/:day", authGuard, async (req, res) => {
  const day = req.params.day;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return res.status(400).json({ message: "Invalid day format" });
  }
  try {
    const movementPurchases = await query(
      `SELECT m.id,
              m.created_at,
              c.name AS buyer,
              STRING_AGG(CONCAT(s.name, ' x', mi.quantity), ', ') AS items,
              SUM(mi.quantity * mi.unit_price) AS total
       FROM movements m
       JOIN clients c ON c.id = m.client_id
       JOIN movement_items mi ON mi.movement_id = m.id
       JOIN sweets s ON s.id = mi.sweet_id
       WHERE m.amount > 0
         AND m.concept LIKE 'Compra%'
         AND m.created_at::date = $1::date
       GROUP BY m.id, m.created_at, c.name`,
      [day],
    );

    const cashSales = await query(
      `SELECT sa.id,
              sa.created_at,
              'Mostrador' AS buyer,
              STRING_AGG(CONCAT(s.name, ' x', si.quantity), ', ') AS items,
              SUM(si.quantity * si.unit_price) AS total
       FROM sales sa
       JOIN sale_items si ON si.sale_id = sa.id
       JOIN sweets s ON s.id = si.sweet_id
       WHERE sa.created_at::date = $1::date
       GROUP BY sa.id, sa.created_at`,
      [day],
    );

    const rows = [...movementPurchases.rows, ...cashSales.rows].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

const ALPHABET =
  "9A1b2C3d4E5f6G7h8I0jKlMnOpQrStUvWxYzaBcDeFgHiJkLmNoPqRsTuVwXyZ";
const N_BIG = 916132832n; // 62^5
const M_BIG = 387420489n;
const S_BIG = 123456789n;

function modInverse(a, m) {
  let m0 = m,
    t,
    q;
  let x0 = 0n,
    x1 = 1n;
  if (m === 1n) return 0n;
  while (a > 1n) {
    q = a / m;
    t = m;
    m = a % m;
    a = t;
    t = x0;
    x0 = x1 - q * x0;
    x1 = t;
  }
  if (x1 < 0n) x1 += m0;
  return x1;
}

const M_INV = modInverse(M_BIG, N_BIG);

function encodeClientId(id) {
  if (!id) return "";
  let x = (BigInt(id) * M_BIG + S_BIG) % N_BIG;
  let code = "";
  for (let i = 0; i < 5; i++) {
    code = ALPHABET[Number(x % 62n)] + code;
    x = x / 62n;
  }
  return code;
}

function decodeClientCode(code) {
  if (!code || code.length !== 5) return null;
  let x = 0n;
  for (let i = 0; i < 5; i++) {
    const idx = ALPHABET.indexOf(code[i]);
    if (idx === -1) return null;
    x = x * 62n + BigInt(idx);
  }
  let unshifted = (x - S_BIG) % N_BIG;
  if (unshifted < 0n) unshifted += N_BIG;
  let id = (unshifted * M_INV) % N_BIG;
  const numId = Number(id);
  return numId > 0 && numId < 10000000 ? numId : null;
}

// CRUD Clients
app.get("/api/clients", authGuard, async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, total_debt, points, phone FROM clients ORDER BY total_debt DESC",
    );
    const rows = result.rows.map((c) => ({
      ...c,
      public_code: encodeClientId(c.id),
    }));
    return res.json(rows);
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
      [name, phone || null],
    );
    const newClient = result.rows[0];
    return res.json({
      ...newClient,
      public_code: encodeClientId(newClient.id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Rutas Públicas para Clientes (Sin Auth)
app.get("/api/public/clients/:code", async (req, res) => {
  const { code } = req.params;
  const clientId = decodeClientCode(code);
  if (!clientId) {
    return res
      .status(404)
      .json({ message: "Enlace inválido o cliente no encontrado" });
  }
  try {
    const clientRes = await query(
      "SELECT name, total_debt, points FROM clients WHERE id = $1",
      [clientId],
    );
    if (!clientRes.rows.length) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    return res.json({
      ...clientRes.rows[0],
      public_code: code,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/public/clients/:code/movements", async (req, res) => {
  const { code } = req.params;
  const clientId = decodeClientCode(code);
  if (!clientId) {
    return res
      .status(404)
      .json({ message: "Enlace inválido o cliente no encontrado" });
  }
  try {
    const movementsRes = await query(
      `SELECT m.id AS movement_id, m.concept, m.amount, m.points, m.created_at,
              mi.quantity, mi.unit_price, s.name AS sweet_name
       FROM movements m
       LEFT JOIN movement_items mi ON mi.movement_id = m.id
       LEFT JOIN sweets s ON s.id = mi.sweet_id
       WHERE m.client_id = $1
       ORDER BY m.created_at DESC`,
      [clientId],
    );

    const movementsMap = {};
    for (const row of movementsRes.rows) {
      if (!movementsMap[row.movement_id]) {
        movementsMap[row.movement_id] = {
          id: row.movement_id,
          concept: row.concept,
          amount: Number(row.amount),
          points: Number(row.points || 0),
          created_at: row.created_at,
          items: [],
        };
      }
      if (row.sweet_name) {
        movementsMap[row.movement_id].items.push({
          name: row.sweet_name,
          quantity: row.quantity,
          unit_price: Number(row.unit_price),
        });
      }
    }

    const sortedMovements = Object.values(movementsMap).sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return res.json(sortedMovements);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/api/clients/:id", authGuard, async (req, res) => {
  const { id } = req.params;
  const { name, totalDebt, points, phone } = req.body || {};
  if (!name) return res.status(400).json({ message: "Missing name" });

  const dbPool = getPool();
  const clientConn = await dbPool.connect();

  try {
    await clientConn.query("BEGIN");

    const currentClient = await clientConn.query(
      "SELECT id, name, total_debt, points, phone FROM clients WHERE id = $1",
      [id],
    );
    if (!currentClient.rows.length) {
      await clientConn.query("ROLLBACK");
      return res.status(404).json({ message: "Client not found" });
    }

    const previousDebt = Number(currentClient.rows[0].total_debt || 0);
    const normalizedDebt = Number.isFinite(Number(totalDebt))
      ? Number(totalDebt)
      : 0;
    const normalizedPoints = Number.isFinite(Number(points))
      ? Math.max(0, Number(points))
      : 0;

    await clientConn.query(
      "UPDATE clients SET name = $1, total_debt = $2, points = $3, phone = $4 WHERE id = $5",
      [name, normalizedDebt, normalizedPoints, phone || null, id],
    );

    const delta = Number((normalizedDebt - previousDebt).toFixed(2));
    if (Math.abs(delta) > 0) {
      const concept = `Ajuste por edicion de saldo (${name})`;
      await clientConn.query(
        "INSERT INTO movements (client_id, concept, amount) VALUES ($1, $2, $3)",
        [id, concept, delta],
      );
    }

    await clientConn.query("COMMIT");
    return res.json({ message: "Client updated" });
  } catch (error) {
    await clientConn.query("ROLLBACK");
    return res.status(500).json({ message: error.message });
  } finally {
    clientConn.release();
  }
});

app.delete("/api/clients/:id", authGuard, async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM movements WHERE client_id = $1", [id]);
    await query("DELETE FROM clients WHERE id = $1", [id]);
    return res.json({ message: "Client deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/clients/:id/debt-breakdown", authGuard, async (req, res) => {
  const clientId = Number(req.params.id);
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return res.status(400).json({ message: "Invalid client id" });
  }
  try {
    const clientRes = await query(
      "SELECT id, name, total_debt, points, phone FROM clients WHERE id = $1",
      [clientId],
    );
    if (!clientRes.rows.length)
      return res.status(404).json({ message: "Client not found" });

    const client = clientRes.rows[0];

    const movementsRes = await query(
      `SELECT m.id AS movement_id, m.concept, m.amount, m.created_at,
              mi.quantity, mi.unit_price, s.name AS sweet_name
       FROM movements m
       LEFT JOIN movement_items mi ON mi.movement_id = m.id
       LEFT JOIN sweets s ON s.id = mi.sweet_id
       WHERE m.client_id = $1 AND m.concept LIKE 'Compra%' AND m.amount > 0
       ORDER BY m.created_at DESC`,
      [clientId],
    );

    const movementsMap = {};
    for (const row of movementsRes.rows) {
      if (!movementsMap[row.movement_id]) {
        movementsMap[row.movement_id] = {
          id: row.movement_id,
          concept: row.concept,
          amount: Number(row.amount),
          created_at: row.created_at,
          items: [],
        };
      }
      if (row.sweet_name) {
        movementsMap[row.movement_id].items.push({
          name: row.sweet_name,
          quantity: row.quantity,
          unit_price: Number(row.unit_price),
        });
      }
    }

    const sortedMovements = Object.values(movementsMap).sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    let remainingDebt = Number(client.total_debt || 0);
    const movements = [];

    for (const mov of sortedMovements) {
      if (remainingDebt <= 0) break;
      const movAmt = Number(mov.amount);
      if (movAmt >= remainingDebt) {
        movements.push({
          ...mov,
          owed_amount: Number(remainingDebt.toFixed(2)),
        });
        remainingDebt = 0;
      } else {
        movements.push({ ...mov, owed_amount: movAmt });
        remainingDebt = Number((remainingDebt - movAmt).toFixed(2));
      }
    }

    return res.json({ client, movements });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/clients/:id/movements", authGuard, async (req, res) => {
  const clientId = Number(req.params.id);
  try {
    const result = await query(
      "SELECT id, concept, amount, points, created_at FROM movements WHERE client_id = $1 ORDER BY created_at DESC",
      [clientId],
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/movements/:id/items", authGuard, async (req, res) => {
  const movementId = Number(req.params.id);
  if (!movementId)
    return res.status(400).json({ message: "Invalid movement id" });
  try {
    const result = await query(
      "SELECT mi.id, mi.quantity, mi.unit_price, s.name FROM movement_items mi JOIN sweets s ON mi.sweet_id = s.id WHERE mi.movement_id = $1 ORDER BY mi.id",
      [movementId],
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.delete(
  "/api/clients/:clientId/movements/:movementId",
  authGuard,
  async (req, res) => {
    const clientId = Number(req.params.clientId);
    const movementId = Number(req.params.movementId);
    const { password } = req.body || {};
    const adminPass = process.env.ADMIN_PASS || "admin123";

    if (!clientId || !movementId)
      return res.status(400).json({ message: "Invalid client or movement id" });
    if (!password || password !== adminPass)
      return res.status(401).json({ message: "Contraseña incorrecta" });

    const dbPool = getPool();
    const clientConn = await dbPool.connect();

    try {
      await clientConn.query("BEGIN");

      const movRes = await clientConn.query(
        "SELECT id, client_id, amount, concept, points FROM movements WHERE id = $1 AND client_id = $2",
        [movementId, clientId],
      );
      if (!movRes.rows.length) {
        await clientConn.query("ROLLBACK");
        return res.status(404).json({ message: "Movimiento no encontrado" });
      }
      const movement = movRes.rows[0];

      const itemsRes = await clientConn.query(
        "SELECT sweet_id, quantity FROM movement_items WHERE movement_id = $1",
        [movementId],
      );
      for (const item of itemsRes.rows) {
        await clientConn.query(
          "UPDATE sweets SET stock = stock + $1, sold_count = sold_count - $1 WHERE id = $2",
          [Number(item.quantity), Number(item.sweet_id)],
        );
      }

      await clientConn.query(
        "DELETE FROM movement_items WHERE movement_id = $1",
        [movementId],
      );
      await clientConn.query("DELETE FROM movements WHERE id = $1", [
        movementId,
      ]);

      const pointsToDeduct = Number(movement.points || 0);
      await clientConn.query(
        "UPDATE clients SET total_debt = total_debt - $1, points = GREATEST(0, points - $2) WHERE id = $3",
        [Number(movement.amount), pointsToDeduct, clientId],
      );

      await clientConn.query("COMMIT");
      return res.json({ message: "Movimiento eliminado" });
    } catch (error) {
      await clientConn.query("ROLLBACK");
      return res.status(500).json({ message: error.message });
    } finally {
      clientConn.release();
    }
  },
);

app.post("/api/clients/:id/purchase", authGuard, async (req, res) => {
  const clientId = Number(req.params.id);
  const { amount, concept, items, payImmediately } = req.body || {};
  const pointsUsed = Number(req.body.pointsUsed) || 0;

  if (pointsUsed < 0)
    return res
      .status(400)
      .json({ message: "Puntos a usar no pueden ser negativos" });

  const dbPool = getPool();
  const clientConn = await dbPool.connect();

  try {
    await clientConn.query("BEGIN");

    let totalAmount = 0;
    let normalizedItems = [];
    const settings = await getSettings();

    if (Array.isArray(items) && items.length > 0) {
      normalizedItems = items
        .map((item) => ({
          sweetId: Number(item.sweetId),
          quantity: Number(item.quantity),
        }))
        .filter(
          (item) =>
            Number.isFinite(item.sweetId) &&
            Number.isFinite(item.quantity) &&
            item.quantity > 0,
        );

      if (normalizedItems.length === 0) {
        await clientConn.query("ROLLBACK");
        return res.status(400).json({ message: "Missing items" });
      }

      for (const item of normalizedItems) {
        const sweetRes = await clientConn.query(
          "SELECT id, name, sale_price, stock FROM sweets WHERE id = $1",
          [item.sweetId],
        );
        if (!sweetRes.rows.length) throw new Error("Sweet not found");
        totalAmount += Number(sweetRes.rows[0].sale_price) * item.quantity;
      }
    } else {
      if (!amount) {
        await clientConn.query("ROLLBACK");
        return res.status(400).json({ message: "Missing amount" });
      }
      totalAmount = Number(amount);
      if (!Number.isFinite(totalAmount) || totalAmount <= 0)
        throw new Error("Monto de compra no válido");
    }

    if (pointsUsed > totalAmount) {
      await clientConn.query("ROLLBACK");
      return res.status(400).json({
        message: "No se pueden usar más puntos que el total de la compra",
      });
    }

    if (pointsUsed > 0) {
      const clientRes = await clientConn.query(
        "SELECT points FROM clients WHERE id = $1",
        [clientId],
      );
      if (!clientRes.rows.length) throw new Error("Client not found");
      const clientPoints = Number(clientRes.rows[0].points || 0);
      if (clientPoints < pointsUsed) {
        throw new Error(
          `Puntos insuficientes. El cliente tiene ${clientPoints.toFixed(1)} pts.`,
        );
      }
    }

    const movRes = await clientConn.query(
      "INSERT INTO movements (client_id, concept, amount, points) VALUES ($1, $2, $3, $4) RETURNING id",
      [clientId, concept || "Compra", totalAmount, 0],
    );
    const movementId = movRes.rows[0].id;

    let ticketItems = [];
    if (normalizedItems.length > 0) {
      for (const item of normalizedItems) {
        const sweetRes = await clientConn.query(
          "SELECT name, sale_price FROM sweets WHERE id = $1",
          [item.sweetId],
        );
        const sweet = sweetRes.rows[0];
        ticketItems.push({
          name: sweet.name,
          quantity: item.quantity,
          unitPrice: Number(sweet.sale_price),
        });

        await clientConn.query(
          "INSERT INTO movement_items (movement_id, sweet_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
          [movementId, item.sweetId, item.quantity, Number(sweet.sale_price)],
        );
        await clientConn.query(
          "UPDATE sweets SET stock = stock - $1, sold_count = sold_count + $1 WHERE id = $2",
          [item.quantity, item.sweetId],
        );
      }
    }

    if (pointsUsed > 0) {
      await clientConn.query(
        "UPDATE clients SET points = GREATEST(0, points - $1) WHERE id = $2",
        [pointsUsed, clientId],
      );
      await clientConn.query(
        "INSERT INTO movements (client_id, concept, amount, points) VALUES ($1, $2, $3, $4)",
        [clientId, "Pago con puntos", -pointsUsed, -pointsUsed],
      );
    }

    const remainingAmount = Number((totalAmount - pointsUsed).toFixed(2));
    const shouldPay = !!payImmediately;
    const rewardFactor = parseFloat(settings.reward_factor || "0.10");
    const pointsEarned =
      settings.rewards_enabled === "true" || settings.rewards_enabled === true
        ? Number((remainingAmount * rewardFactor).toFixed(2))
        : 0;

    if (shouldPay) {
      await clientConn.query(
        "INSERT INTO movements (client_id, concept, amount, points) VALUES ($1, $2, $3, $4)",
        [
          clientId,
          "Pago de compra al instante",
          -remainingAmount,
          pointsEarned,
        ],
      );
      await clientConn.query(
        "UPDATE clients SET points = points + $1 WHERE id = $2",
        [pointsEarned, clientId],
      );
    } else {
      await clientConn.query(
        "UPDATE clients SET total_debt = total_debt + $1 WHERE id = $2",
        [remainingAmount, clientId],
      );
    }

    await clientConn.query("COMMIT");

    const clientFinal = await query(
      "SELECT id, name, total_debt, points, phone FROM clients WHERE id = $1",
      [clientId],
    );
    if (clientFinal.rows.length) {
      sendWhatsAppTicketAutomatically(
        clientFinal.rows[0],
        concept || "Compra",
        totalAmount,
        pointsUsed,
        ticketItems,
      );
    }

    return res.json({ message: "Purchase added", amount: totalAmount });
  } catch (error) {
    await clientConn.query("ROLLBACK");
    return res.status(400).json({ message: error.message });
  } finally {
    clientConn.release();
  }
});

app.post("/api/clients/:id/pay", authGuard, async (req, res) => {
  try {
    const clientId = Number(req.params.id);
    const { amount, concept } = req.body || {};
    const parsedAmount = Number(amount);

    if (
      !Number.isInteger(clientId) ||
      clientId <= 0 ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return res.status(400).json({ message: "Invalid client or amount" });
    }

    const clientRes = await query(
      "SELECT id, name, total_debt, points, phone FROM clients WHERE id = $1",
      [clientId],
    );
    if (!clientRes.rows.length)
      return res.status(404).json({ message: "Client not found" });

    const settings = await getSettings();
    const rewardFactor = parseFloat(settings.reward_factor || "0.10");
    const normalized = Math.abs(parsedAmount) * -1;
    const pointsEarned =
      settings.rewards_enabled === "true" || settings.rewards_enabled === true
        ? Number((Math.abs(parsedAmount) * rewardFactor).toFixed(2))
        : 0;

    await query(
      "INSERT INTO movements (client_id, concept, amount, points) VALUES ($1, $2, $3, $4)",
      [clientId, concept || "Pago", normalized, pointsEarned],
    );

    await query(
      "UPDATE clients SET total_debt = total_debt - $1, points = points + $2 WHERE id = $3",
      [Math.abs(parsedAmount), pointsEarned, clientId],
    );

    const updatedClientRes = await query(
      "SELECT id, name, total_debt, points, phone FROM clients WHERE id = $1",
      [clientId],
    );
    if (updatedClientRes.rows.length) {
      sendWhatsAppTicketAutomatically(
        updatedClientRes.rows[0],
        concept || "Pago",
        -Math.abs(parsedAmount),
      );
    }

    return res.json({ message: "Payment registered" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.post("/api/sales", authGuard, async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ message: "Missing items" });

  const normalizedItems = items
    .map((item) => ({
      sweetId: Number(item.sweetId),
      quantity: Number(item.quantity),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.sweetId) &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0,
    );

  if (normalizedItems.length === 0)
    return res.status(400).json({ message: "Missing items" });

  const dbPool = getPool();
  const clientConn = await dbPool.connect();

  try {
    await clientConn.query("BEGIN");

    let totalAmount = 0;
    for (const item of normalizedItems) {
      const sweetRes = await clientConn.query(
        "SELECT sale_price FROM sweets WHERE id = $1",
        [item.sweetId],
      );
      if (!sweetRes.rows.length) throw new Error("Sweet not found");
      totalAmount += Number(sweetRes.rows[0].sale_price) * item.quantity;
    }

    const saleRes = await clientConn.query(
      "INSERT INTO sales (total_amount) VALUES ($1) RETURNING id",
      [totalAmount],
    );
    const saleId = saleRes.rows[0].id;

    for (const item of normalizedItems) {
      const sweetRes = await clientConn.query(
        "SELECT sale_price FROM sweets WHERE id = $1",
        [item.sweetId],
      );
      const uPrice = Number(sweetRes.rows[0].sale_price);

      await clientConn.query(
        "INSERT INTO sale_items (sale_id, sweet_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
        [saleId, item.sweetId, item.quantity, uPrice],
      );
      await clientConn.query(
        "UPDATE sweets SET stock = stock - $1, sold_count = sold_count + $1 WHERE id = $2",
        [item.quantity, item.sweetId],
      );
    }

    await clientConn.query("COMMIT");
    return res.json({ message: "Sale added", amount: totalAmount });
  } catch (error) {
    await clientConn.query("ROLLBACK");
    return res.status(400).json({ message: error.message });
  } finally {
    clientConn.release();
  }
});

// Purchase Places & Package Purchases
app.get("/api/purchase-places", authGuard, async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, created_at FROM purchase_places ORDER BY name ASC",
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/purchase-places", authGuard, async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: "Place name is required" });
  try {
    const inserted = await query(
      `INSERT INTO purchase_places (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
      [String(name).trim()],
    );
    return res.json(inserted.rows[0]);
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
  const normalizedName = String(productName || "").trim();
  if (!placeId || !packageCost || (!sweetId && !normalizedName)) {
    return res.status(400).json({ message: "Missing fields" });
  }
  try {
    const result = await query(
      "INSERT INTO package_purchases (sweet_id, product_name, place_id, package_cost) VALUES ($1, $2, $3, $4) RETURNING *",
      [
        sweetId ? Number(sweetId) : null,
        normalizedName,
        Number(placeId),
        Number(packageCost),
      ],
    );
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Rewards (Premios) & Redemptions (Canjes)
app.get("/api/rewards", authGuard, async (req, res) => {
  try {
    const result = await query(`
      SELECT r.id, r.name, r.points_cost, COALESCE(s.stock, r.stock) AS stock, r.sweet_id
      FROM rewards r
      LEFT JOIN sweets s ON r.sweet_id = s.id
      ORDER BY r.name ASC
    `);
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
      [name, pointsCost, Number(stock) || 0, sweetId ? Number(sweetId) : null],
    );
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/api/rewards/:id", authGuard, async (req, res) => {
  const { id } = req.params;
  const { name, pointsCost, stock, sweetId } = req.body || {};
  try {
    const result = await query(
      "UPDATE rewards SET name = $1, points_cost = $2, stock = $3, sweet_id = $4 WHERE id = $5 RETURNING *",
      [
        name,
        pointsCost,
        Number(stock) || 0,
        sweetId ? Number(sweetId) : null,
        id,
      ],
    );
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.delete("/api/rewards/:id", authGuard, async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM rewards WHERE id = $1", [id]);
    return res.json({ message: "Reward deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/clients/:id/redeem", authGuard, async (req, res) => {
  const clientId = Number(req.params.id);
  const { sweetId } = req.body || {};
  if (!clientId || !sweetId)
    return res.status(400).json({ message: "Missing client or sweet ID" });

  const dbPool = getPool();
  const clientConn = await dbPool.connect();

  try {
    await clientConn.query("BEGIN");

    const clientRes = await clientConn.query(
      "SELECT id, name, points FROM clients WHERE id = $1",
      [clientId],
    );
    if (!clientRes.rows.length) {
      await clientConn.query("ROLLBACK");
      return res.status(404).json({ message: "Client not found" });
    }
    const client = clientRes.rows[0];
    const clientPoints = Number(client.points || 0);

    const sweetRes = await clientConn.query(
      "SELECT id, name, sale_price, stock FROM sweets WHERE id = $1",
      [sweetId],
    );
    if (!sweetRes.rows.length) {
      await clientConn.query("ROLLBACK");
      return res.status(404).json({ message: "Sweet not found" });
    }
    const sweet = sweetRes.rows[0];
    const pointsCost = Number(sweet.sale_price);
    const sweetStock = Number(sweet.stock || 0);

    if (clientPoints < pointsCost) {
      await clientConn.query("ROLLBACK");
      return res.status(400).json({
        message: `Puntos insuficientes. Tiene ${clientPoints.toFixed(1)} pts.`,
      });
    }
    if (sweetStock <= 0) {
      await clientConn.query("ROLLBACK");
      return res.status(400).json({ message: "Dulce agotado (sin stock)." });
    }

    await clientConn.query(
      "UPDATE clients SET points = GREATEST(0, points - $1) WHERE id = $2",
      [pointsCost, clientId],
    );
    await clientConn.query(
      "UPDATE sweets SET stock = stock - 1, sold_count = sold_count + 1 WHERE id = $1",
      [sweetId],
    );
    await clientConn.query(
      "INSERT INTO redemptions (client_id, sweet_id, points_spent) VALUES ($1, $2, $3)",
      [clientId, sweetId, pointsCost],
    );
    await clientConn.query(
      "INSERT INTO movements (client_id, concept, amount, points) VALUES ($1, $2, $3, $4)",
      [clientId, `Canje de dulce: ${sweet.name}`, 0, -pointsCost],
    );

    await clientConn.query("COMMIT");
    return res.json({ message: "Sweet redeemed successfully" });
  } catch (error) {
    await clientConn.query("ROLLBACK");
    return res.status(500).json({ message: error.message });
  } finally {
    clientConn.release();
  }
});

app.get("/api/clients/:id/redemptions", authGuard, async (req, res) => {
  try {
    const clientId = Number(req.params.id);
    const result = await query(
      `SELECT r.id, r.points_spent, r.created_at, s.name AS reward_name
       FROM redemptions r
       JOIN sweets s ON r.sweet_id = s.id
       WHERE r.client_id = $1
       ORDER BY r.created_at DESC`,
      [clientId],
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
    try {
      await query("ALTER TABLE settings ALTER COLUMN value TYPE TEXT;");
    } catch (e) {
      // Ignorar si ya es de tipo TEXT
    }

    for (const [key, value] of Object.entries(payload)) {
      await query(
        "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [key, String(value)],
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
  const provider =
    settings.whatsapp_provider ||
    (process.env.META_WHATSAPP_TOKEN ? "meta" : "openwa");

  if (provider === "meta" || process.env.META_WHATSAPP_TOKEN) {
    const token =
      settings.meta_whatsapp_token || process.env.META_WHATSAPP_TOKEN;
    const phoneNumberId =
      settings.meta_phone_number_id || process.env.META_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      throw new Error(
        "Meta WhatsApp API Token or Phone Number ID missing in settings/env.",
      );
    }

    const cleanPhone = formatWhatsAppNumber(
      phone,
      settings.whatsapp_default_country,
    );
    const metaUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const resp = await fetch(metaUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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
    const cleanPhone = formatWhatsAppNumber(
      phone,
      settings.whatsapp_default_country,
    );

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["api_key"] = apiKey;

    const resp = await fetch(
      `${gatewayUrl}/api/sessions/${sessionName}/messages/send-text`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ chatId: `${cleanPhone}@c.us`, text }),
      },
    );

    if (!resp.ok) {
      throw new Error(`OpenWA Gateway Error (${resp.status})`);
    }
    return await resp.json();
  }
}

async function sendWhatsAppTicketAutomatically(
  client,
  concept,
  amount,
  pointsUsed = 0,
  items = [],
) {
  try {
    const settings = await getSettings();
    if (
      settings.whatsapp_enabled !== "true" &&
      settings.whatsapp_enabled !== true
    ) {
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
    lines.push(
      `Hola *${client.name}*, te comparto el movimiento registrado en tu cuenta:`,
    );
    lines.push(``);
    lines.push(`*Detalle:* ${concept}`);
    lines.push(`*Monto:* $${Number(Math.abs(amount)).toFixed(2)}`);
    if (pointsUsed > 0)
      lines.push(`*Puntos Usados:* -${Number(pointsUsed).toFixed(2)} pts`);
    lines.push(``);

    if (Array.isArray(items) && items.length > 0) {
      lines.push(`*Detalle de compra:*`);
      items.forEach((item) => {
        lines.push(
          `• ${item.quantity}x ${item.name} ($${Number(item.unitPrice).toFixed(2)} c/u)`,
        );
      });
      lines.push(``);
    }
    lines.push(`───────────────────`);

    let debtValue = Number(client.total_debt);
    let debtLabel =
      debtValue < 0 ? "*Saldo a favor:*" : "*Saldo Total Actual:*";
    lines.push(`💰 ${debtLabel} *$${Math.abs(debtValue).toFixed(2)}*`);
    lines.push(
      `⭐ *Puntos Disponibles:* ${Number(client.points || 0).toFixed(1)} pts`,
    );
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
    if (provider === "meta") {
      const token =
        settings.meta_whatsapp_token || process.env.META_WHATSAPP_TOKEN;
      const phoneId =
        settings.meta_phone_number_id || process.env.META_PHONE_NUMBER_ID;
      if (token && phoneId) {
        return res.json({ status: "CONNECTED", provider: "meta" });
      } else {
        return res.json({ status: "DISCONNECTED", provider: "meta" });
      }
    } else {
      const gatewayUrl = settings.whatsapp_gateway_url || "";
      if (
        !gatewayUrl ||
        gatewayUrl.includes("openwa:2785") ||
        gatewayUrl.includes("localhost")
      ) {
        return res.json({ status: "DISCONNECTED", provider: "openwa" });
      }
      const sessionName = settings.whatsapp_session_id || "tiendita";
      try {
        const resp = await fetch(`${gatewayUrl}/api/sessions/${sessionName}`);
        if (resp.ok) {
          const data = await resp.json();
          return res.json({
            status: data.status || "CONNECTED",
            provider: "openwa",
          });
        }
      } catch (e) {
        return res.json({ status: "DISCONNECTED", provider: "openwa" });
      }
      return res.json({ status: "DISCONNECTED", provider: "openwa" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/clients/:id/whatsapp-statement", authGuard, async (req, res) => {
  try {
    const clientId = Number(req.params.id);
    const clientRes = await query(
      "SELECT id, name, total_debt, points, phone FROM clients WHERE id = $1",
      [clientId],
    );
    if (!clientRes.rows.length)
      return res.status(404).json({ message: "Client not found" });

    const client = clientRes.rows[0];
    if (!client.phone)
      return res
        .status(400)
        .json({ message: "Client has no registered phone number" });

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
