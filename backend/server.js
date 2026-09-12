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
        options: "-c timezone=America/Mexico_City",
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
        options: "-c timezone=America/Mexico_City",
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

// Inicialización de Esquema y Migraciones Idempotentes
let schemaEnsured = false;
async function ensureMigrations() {
  if (schemaEnsured) return;
  try {
    await query(`
      ALTER TABLE settings ALTER COLUMN value TYPE TEXT;
      ALTER TABLE sweets ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) NOT NULL DEFAULT 0;
      ALTER TABLE movements ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'cash';
      ALTER TABLE movements ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0;
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'cash';
      CREATE INDEX IF NOT EXISTS idx_movements_client ON movements(client_id);
      CREATE INDEX IF NOT EXISTS idx_movements_created ON movements(created_at);
      CREATE INDEX IF NOT EXISTS idx_movement_items_mov ON movement_items(movement_id);
      CREATE INDEX IF NOT EXISTS idx_movement_items_sweet ON movement_items(sweet_id);
      CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
      CREATE INDEX IF NOT EXISTS idx_sale_items_sweet ON sale_items(sweet_id);
      CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
      CREATE INDEX IF NOT EXISTS idx_sweets_stock ON sweets(stock);
      CREATE INDEX IF NOT EXISTS idx_sweets_active_stock ON sweets(is_active, stock);
    `);
    schemaEnsured = true;
  } catch (error) {
    console.error("Error executing migrations:", error.message);
  }
}

app.use(async (req, res, next) => {
  await ensureMigrations();
  next();
});

async function runSchema() {
  try {
    const localSchema = path.join(process.cwd(), "schema.sql");
    const backendSchema = path.join(process.cwd(), "backend", "schema.sql");
    const schemaPath = fs.existsSync(localSchema)
      ? localSchema
      : fs.existsSync(backendSchema)
        ? backendSchema
        : null;

    if (schemaPath) {
      const schema = fs.readFileSync(schemaPath, "utf-8");
      await query(schema);
    }
    await ensureMigrations();
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
      default_credit_limit: 50.0,
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
      if (row.key === "default_credit_limit")
        settings.default_credit_limit = parseFloat(row.value) || 50.0;
      else if (row.key === "reward_factor")
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
      default_credit_limit: 50.0,
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

// Helper para calcular días de adeudo ininterrumpido (FIFO)
async function getClientDebtDays(clientId, totalDebt) {
  const debt = Number(totalDebt || 0);
  if (debt <= 0) return 0;
  try {
    const res = await query(
      `SELECT amount, created_at FROM movements 
       WHERE client_id = $1 AND concept LIKE 'Compra%' AND amount > 0 
       ORDER BY created_at DESC`,
      [clientId],
    );
    let remaining = debt;
    let oldestDate = null;
    for (const row of res.rows) {
      if (remaining <= 0) break;
      oldestDate = row.created_at;
      remaining -= Number(row.amount);
    }
    if (!oldestDate) return 0;
    const diffMs = Math.max(0, Date.now() - new Date(oldestDate).getTime());
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch (err) {
    console.error("Error calculating debt days:", err.message);
    return 0;
  }
}

// Helper para obtener contraseña administrativa dinámica desde BD o ENV
async function getEffectiveAdminPass() {
  try {
    const res = await query(
      "SELECT value FROM settings WHERE key = 'admin_password'",
    );
    if (res.rows.length && res.rows[0].value) {
      return res.rows[0].value;
    }
  } catch (e) {
    // fallback si la tabla no está lista
  }
  return process.env.ADMIN_PASS || "Tiendita321";
}

// Authentication
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USER || "admin";
  const adminPass = await getEffectiveAdminPass();

  if (username !== adminUser || password !== adminPass) {
    return res.status(401).json({ message: "Credenciales incorrectas" });
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

// Cambiar Contraseña (requiere login)
app.post("/api/auth/change-password", authGuard, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Debes ingresar la contraseña actual y la nueva contraseña",
    });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({
      message: "La nueva contraseña debe tener al menos 4 caracteres",
    });
  }

  try {
    const effectivePass = await getEffectiveAdminPass();
    if (currentPassword !== effectivePass) {
      return res
        .status(401)
        .json({ message: "La contraseña actual es incorrecta" });
    }

    await query(
      "INSERT INTO settings (key, value) VALUES ('admin_password', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [String(newPassword)],
    );

    return res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Verificar Contraseña Admin (requiere login)
app.post("/api/auth/verify-password", authGuard, async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res
      .status(400)
      .json({ message: "Contraseña requerida", valid: false });
  }
  try {
    const effectivePass = await getEffectiveAdminPass();
    if (password === effectivePass) {
      return res.json({ valid: true, message: "Contraseña verificada" });
    }
    return res
      .status(401)
      .json({ valid: false, message: "Contraseña incorrecta" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Precios Públicos
app.get("/api/prices", async (req, res) => {
  try {
    const result = await query(
      "SELECT name, sale_price AS price FROM sweets WHERE is_active IS NOT FALSE ORDER BY name ASC",
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
      "SELECT id, name, purchase_price, sale_price, stock, sold_count, is_active FROM sweets WHERE is_active IS NOT FALSE ORDER BY name ASC",
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
      "INSERT INTO sweets (name, purchase_price, sale_price, stock, is_active) VALUES ($1, $2, $3, $4, true) RETURNING *",
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
    await query("UPDATE sweets SET is_active = false WHERE id = $1", [id]);
    return res.json({ message: "Sweet disabled successfully (baja lógica)" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/sweets/stats", authGuard, async (req, res) => {
  try {
    const totals = await query(
      "SELECT COUNT(*) AS total_products, COALESCE(SUM(stock), 0) AS total_stock, COALESCE(SUM(sold_count), 0) AS total_sold FROM sweets",
    );
    const topSellers = await query(
      "SELECT id, name, sold_count FROM sweets WHERE sold_count > 0 ORDER BY sold_count DESC, name ASC LIMIT 3",
    );
    const lowSellers = await query(
      "SELECT id, name, sold_count FROM sweets WHERE created_at <= CURRENT_TIMESTAMP - INTERVAL '30 days' ORDER BY sold_count ASC, name ASC LIMIT 3",
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
      topSellers: topSellers.rows || [],
      lowSellers: lowSellers.rows || [],
      topSeller: topSellers.rows[0] || null,
      lowSeller: lowSellers.rows[0] || null,
      lowStock: lowStock.rows[0] || null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Estadísticas Generales e Inteligencia de Negocio
app.get("/api/stats", authGuard, async (req, res) => {
  try {
    const lowStockThreshold = 10;
    const criticalStockThreshold = 3;

    // Ejecución paralela de consultas analíticas
    const [
      dailyTotalsRes,
      topSellersRes,
      lowSellersRes,
      lowStockRes,
      stagnantStockRes,
      productProfitabilityRes,
      cashFlowRes,
      hourlySalesRes,
      dowSalesRes,
      paymentMethodsRes,
      productAffinityRes,
      clientsDebtRes,
      recoveryRes,
      totalsRes,
    ] = await Promise.all([
      // 1. Totales diarios históricos (convertidos a horario local America/Mexico_City)
      query(`
        SELECT day, SUM(total) AS total, SUM(profit) AS profit
        FROM (
          SELECT (m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date AS day,
                 SUM(mi.quantity * mi.unit_price) AS total,
                 SUM(mi.quantity * (mi.unit_price - s.purchase_price)) AS profit
          FROM movements m
          JOIN movement_items mi ON mi.movement_id = m.id
          JOIN sweets s ON s.id = mi.sweet_id
          WHERE ((m.amount > 0) OR (m.amount = 0 AND (m.concept ILIKE '%contado%' OR mi.sweet_id IS NOT NULL)))
            AND m.concept NOT ILIKE '%pago%'
            AND m.concept NOT ILIKE '%abono%'
          GROUP BY (m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date
          UNION ALL
          SELECT (m2.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date AS day,
                 COALESCE(m2.paid_amount, 0) AS total,
                 0 AS profit
          FROM movements m2
          LEFT JOIN movement_items mi2 ON mi2.movement_id = m2.id
          WHERE mi2.id IS NULL AND COALESCE(m2.paid_amount, 0) > 0
            AND m2.concept NOT ILIKE '%pago%' AND m2.concept NOT ILIKE '%abono%'
          GROUP BY (m2.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date
          UNION ALL
          SELECT (si.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date AS day,
                 SUM(si.quantity * si.unit_price) AS total,
                 SUM(si.quantity * (si.unit_price - s.purchase_price)) AS profit
          FROM sale_items si
          JOIN sweets s ON s.id = si.sweet_id
          GROUP BY (si.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date
        ) AS combined
        GROUP BY day
        ORDER BY day DESC
      `),

      // 2. Top vendedores
      query(
        "SELECT id, name, sold_count, sale_price FROM sweets WHERE sold_count > 0 ORDER BY sold_count DESC, name ASC LIMIT 5",
      ),

      // 3. Menos vendidos
      query(
        "SELECT id, name, sold_count FROM sweets WHERE created_at <= CURRENT_TIMESTAMP - INTERVAL '30 days' ORDER BY sold_count ASC, name ASC LIMIT 5",
      ),

      // 4. Stock bajo y crítico
      query(
        "SELECT id, name, stock, sale_price, purchase_price FROM sweets WHERE stock <= $1 ORDER BY stock ASC, name ASC",
        [lowStockThreshold],
      ),

      // 5. Stock estancado (existencias con bajas ventas y capital detenido, con margen de gracia > 15 días)
      query(`
        SELECT id, name, stock, purchase_price, sale_price, sold_count,
               (stock * purchase_price) AS frozen_capital
        FROM sweets
        WHERE stock > 0 AND sold_count <= 2 AND is_active = true
          AND created_at <= CURRENT_TIMESTAMP - INTERVAL '15 days'
        ORDER BY frozen_capital DESC, stock DESC
        LIMIT 8
      `),

      // 6. Rentabilidad y margen por producto
      query(`
        SELECT id, name, purchase_price, sale_price, sold_count,
               (sale_price - purchase_price) AS unit_margin,
               CASE WHEN sale_price > 0 THEN ROUND(((sale_price - purchase_price) / sale_price) * 100, 1) ELSE 0 END AS margin_percent,
               ((sale_price - purchase_price) * sold_count) AS total_profit,
               (sale_price * sold_count) AS total_revenue
        FROM sweets
        WHERE sold_count > 0
        ORDER BY total_profit DESC
        LIMIT 8
      `),

      // 7. Flujo de caja diario histórico (Contado vs Fiado vs Abonos en hora local)
      query(`
        SELECT day,
               COALESCE(SUM(contado), 0) AS contado,
               COALESCE(SUM(fiado), 0) AS fiado,
               COALESCE(SUM(abonos), 0) AS abonos
        FROM (
          SELECT (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date AS day, total_amount AS contado, 0 AS fiado, 0 AS abonos
          FROM sales
          UNION ALL
          SELECT (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date AS day,
                 COALESCE(NULLIF(amount, 0), (SELECT SUM(quantity * unit_price) FROM movement_items WHERE movement_id = movements.id), 0) AS contado,
                 COALESCE(NULLIF(amount, 0), NULLIF(paid_amount, 0), (SELECT SUM(quantity * unit_price) FROM movement_items WHERE movement_id = movements.id), 0) AS contado,
                 0 AS fiado, 0 AS abonos
          FROM movements
          WHERE ((amount > 0) OR (amount = 0 AND concept LIKE '%al contado%')) AND concept LIKE 'Compra%' AND payment_method != 'credit'
          WHERE ((amount > 0) OR (COALESCE(paid_amount, 0) > 0) OR (amount = 0 AND (concept ILIKE '%contado%' OR EXISTS(SELECT 1 FROM movement_items WHERE movement_id = movements.id))))
            AND concept NOT ILIKE '%pago%' AND concept NOT ILIKE '%abono%' AND payment_method != 'credit'
          UNION ALL
          SELECT (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date AS day, 0 AS contado, amount AS fiado, 0 AS abonos
          FROM movements
          WHERE amount > 0 AND concept LIKE 'Compra%' AND payment_method = 'credit'
          WHERE amount > 0 AND concept NOT ILIKE '%pago%' AND concept NOT ILIKE '%abono%' AND payment_method = 'credit'
          UNION ALL
          SELECT (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date AS day, 0 AS contado, 0 AS fiado, ABS(amount) AS abonos
          FROM movements
          WHERE amount < 0 AND (concept LIKE 'Pago%' OR concept LIKE 'Abono%')
          WHERE amount < 0 AND (concept ILIKE '%pago%' OR concept ILIKE '%abono%')
        ) AS flow
        GROUP BY day
        ORDER BY day ASC
      `),

      // 8. Ventas por hora del día (convertido a horario local de la tiendita America/Mexico_City)
      query(`
        SELECT hour, SUM(total) AS total, COUNT(*) AS tickets
        FROM (
          SELECT EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City'))::int AS hour, total_amount AS total
          FROM sales
          UNION ALL
          SELECT EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City'))::int AS hour,
                 COALESCE(NULLIF(amount, 0), (SELECT SUM(quantity * unit_price) FROM movement_items WHERE movement_id = movements.id), 0) AS total
                 COALESCE(NULLIF(amount, 0), NULLIF(paid_amount, 0), (SELECT SUM(quantity * unit_price) FROM movement_items WHERE movement_id = movements.id), 0) AS total
          FROM movements
          WHERE ((amount > 0) OR (amount = 0 AND concept LIKE '%al contado%')) AND concept LIKE 'Compra%'
          WHERE ((amount > 0) OR (COALESCE(paid_amount, 0) > 0) OR (amount = 0 AND (concept ILIKE '%contado%' OR EXISTS(SELECT 1 FROM movement_items WHERE movement_id = movements.id))))
            AND concept NOT ILIKE '%pago%' AND concept NOT ILIKE '%abono%'
        ) AS hourly
        GROUP BY hour
        ORDER BY hour ASC
      `),

      // 9. Ventas por día de la semana (Lunes a Viernes en hora local)
      query(`
        SELECT dow, SUM(total) AS total, COUNT(*) AS tickets
        FROM (
          SELECT EXTRACT(DOW FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City'))::int AS dow, total_amount AS total
          FROM sales
          UNION ALL
          SELECT EXTRACT(DOW FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City'))::int AS dow,
                 COALESCE(NULLIF(amount, 0), (SELECT SUM(quantity * unit_price) FROM movement_items WHERE movement_id = movements.id), 0) AS total
                 COALESCE(NULLIF(amount, 0), NULLIF(paid_amount, 0), (SELECT SUM(quantity * unit_price) FROM movement_items WHERE movement_id = movements.id), 0) AS total
          FROM movements
          WHERE ((amount > 0) OR (amount = 0 AND concept LIKE '%al contado%')) AND concept LIKE 'Compra%'
          WHERE ((amount > 0) OR (COALESCE(paid_amount, 0) > 0) OR (amount = 0 AND (concept ILIKE '%contado%' OR EXISTS(SELECT 1 FROM movement_items WHERE movement_id = movements.id))))
            AND concept NOT ILIKE '%pago%' AND concept NOT ILIKE '%abono%'
        ) AS dow_data
        GROUP BY dow
        ORDER BY dow ASC
      `),

      // 10. Métodos de pago
      query(`
        SELECT payment_method, SUM(total) AS total, COUNT(*) AS count
        FROM (
          SELECT COALESCE(payment_method, 'cash') AS payment_method, total_amount AS total
          FROM sales
          UNION ALL
          SELECT 
            CASE 
              WHEN payment_method = 'credit' THEN 'credit'
              ELSE COALESCE(payment_method, 'cash')
            END AS payment_method,
            COALESCE(NULLIF(amount, 0), (SELECT SUM(quantity * unit_price) FROM movement_items WHERE movement_id = movements.id), 0) AS total
          FROM movements
          WHERE ((amount > 0) OR (amount = 0 AND concept LIKE '%al contado%')) AND concept LIKE 'Compra%'
        ) AS pm
        GROUP BY payment_method
        ORDER BY total DESC
      `),

      // 11. Afinidad de productos / Cross-selling
      query(`
        WITH items AS (
          SELECT movement_id AS basket_id, sweet_id
          FROM movement_items
          UNION ALL
          SELECT sale_id AS basket_id, sweet_id
          FROM sale_items
        )
        SELECT 
          s1.name AS product_a,
          s2.name AS product_b,
          COUNT(*) AS pair_count
        FROM items i1
        JOIN items i2 ON i1.basket_id = i2.basket_id AND i1.sweet_id < i2.sweet_id
        JOIN sweets s1 ON s1.id = i1.sweet_id
        JOIN sweets s2 ON s2.id = i2.sweet_id
        GROUP BY s1.name, s2.name
        ORDER BY pair_count DESC
        LIMIT 6
      `),

      // 12. Deuda activa de clientes para cálculo FIFO de antigüedad
      query("SELECT id, name, total_debt FROM clients WHERE total_debt > 0"),

      // 13. Tasa de cobranza (últimos 30 días)
      query(`
        SELECT 
          COALESCE(SUM(CASE WHEN amount > 0 AND payment_method = 'credit' THEN amount ELSE 0 END), 0) AS credit_granted,
          COALESCE(SUM(CASE WHEN amount < 0 AND (concept LIKE 'Pago%' OR concept LIKE 'Abono%') THEN ABS(amount) ELSE 0 END), 0) AS payments_received
        FROM movements
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      `),

      // 14. Totales globales de tickets e ingresos
      query(`
        SELECT 
          (SELECT COUNT(*) FROM sales) + (SELECT COUNT(*) FROM movements WHERE ((amount > 0) OR (amount = 0 AND concept LIKE '%al contado%')) AND concept LIKE 'Compra%') AS total_tickets,
          COALESCE((SELECT SUM(total_amount) FROM sales), 0) + COALESCE((SELECT SUM(COALESCE(NULLIF(m.amount, 0), (SELECT SUM(quantity * unit_price) FROM movement_items WHERE movement_id = m.id), 0)) FROM movements m WHERE ((m.amount > 0) OR (m.amount = 0 AND m.concept LIKE '%al contado%')) AND m.concept LIKE 'Compra%'), 0) AS total_revenue
      `),
    ]);

    // Procesar distribución de antigüedad de deuda
    const debtAging = [
      { range: "1 - 7 días", amount: 0, count: 0 },
      { range: "8 - 15 días", amount: 0, count: 0 },
      { range: "16 - 30 días", amount: 0, count: 0 },
      { range: "+30 días", amount: 0, count: 0 },
    ];

    for (const c of clientsDebtRes.rows) {
      const debt = Number(c.total_debt || 0);
      if (debt <= 0) continue;
      const days = await getClientDebtDays(c.id, debt);
      if (days <= 7) {
        debtAging[0].amount = Number((debtAging[0].amount + debt).toFixed(2));
        debtAging[0].count += 1;
      } else if (days <= 15) {
        debtAging[1].amount = Number((debtAging[1].amount + debt).toFixed(2));
        debtAging[1].count += 1;
      } else if (days <= 30) {
        debtAging[2].amount = Number((debtAging[2].amount + debt).toFixed(2));
        debtAging[2].count += 1;
      } else {
        debtAging[3].amount = Number((debtAging[3].amount + debt).toFixed(2));
        debtAging[3].count += 1;
      }
    }

    // Normalizar horas del día según jornada real de la tiendita (08:00 a 17:00 en horario local)
    const hourlyMap = new Map();
    (hourlySalesRes.rows || []).forEach((r) => {
      hourlyMap.set(Number(r.hour), {
        total: Number(r.total || 0),
        tickets: Number(r.tickets || 0),
      });
    });
    const hourlySales = [];
    for (let h = 8; h <= 17; h++) {
      const label = `${h.toString().padStart(2, "0")}:00`;
      const data = hourlyMap.get(h) || { total: 0, tickets: 0 };
      hourlySales.push({
        hour: label,
        total: Number(data.total.toFixed(2)),
        tickets: data.tickets,
      });
    }

    // Normalizar días de la semana: SOLO Lunes a Viernes (cerrado fines de semana)
    const dowNames = [
      { dow: 1, name: "Lun" },
      { dow: 2, name: "Mar" },
      { dow: 3, name: "Mié" },
      { dow: 4, name: "Jue" },
      { dow: 5, name: "Vie" },
    ];
    const dowMap = new Map();
    (dowSalesRes.rows || []).forEach((r) => {
      dowMap.set(Number(r.dow), {
        total: Number(r.total || 0),
        tickets: Number(r.tickets || 0),
      });
    });
    const dayOfWeekSales = dowNames.map((d) => {
      const data = dowMap.get(d.dow) || { total: 0, tickets: 0 };
      return {
        dayName: d.name,
        total: Number(data.total.toFixed(2)),
        tickets: data.tickets,
      };
    });

    // Métodos de pago normalizados con etiquetas legibles
    const paymentMethodLabels = {
      cash: "Efectivo",
      credit: "Fiado (Crédito)",
      transfer: "Transferencia SPEI",
      card: "Tarjeta",
      points: "Puntos",
    };
    const paymentMethods = (paymentMethodsRes.rows || []).map((pm) => ({
      key: pm.payment_method,
      name: paymentMethodLabels[pm.payment_method] || pm.payment_method,
      total: Number(Number(pm.total || 0).toFixed(2)),
      count: Number(pm.count || 0),
    }));

    // KPIs calculados
    const totalTickets = Number(totalsRes.rows[0]?.total_tickets || 0);
    const totalRevenue = Number(totalsRes.rows[0]?.total_revenue || 0);
    const averageTicket =
      totalTickets > 0 ? Number((totalRevenue / totalTickets).toFixed(2)) : 0;

    const creditGranted = Number(recoveryRes.rows[0]?.credit_granted || 0);
    const paymentsReceived = Number(
      recoveryRes.rows[0]?.payments_received || 0,
    );
    const recoveryRate =
      creditGranted > 0
        ? Math.min(100, Math.round((paymentsReceived / creditGranted) * 100))
        : 100;

    const stagnantCapital = (stagnantStockRes.rows || []).reduce(
      (sum, item) => sum + Number(item.frozen_capital || 0),
      0,
    );

    return res.json({
      // Compatibilidad con campos existentes
      dailyTotals: dailyTotalsRes.rows || [],
      topSellers: topSellersRes.rows || [],
      lowSellers: lowSellersRes.rows || [],
      topSeller: topSellersRes.rows[0] || null,
      lowSeller: lowSellersRes.rows[0] || null,
      lowStock: lowStockRes.rows || [],
      thresholds: {
        low: lowStockThreshold,
        critical: criticalStockThreshold,
      },
      // 10 Módulos de Inteligencia de Negocio
      kpis: {
        averageTicket,
        totalTickets,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        recoveryRate,
        creditGranted: Number(creditGranted.toFixed(2)),
        paymentsReceived: Number(paymentsReceived.toFixed(2)),
        stagnantCapital: Number(stagnantCapital.toFixed(2)),
      },
      cashFlowDaily: (cashFlowRes.rows || []).map((row) => ({
        day: row.day,
        contado: Number(Number(row.contado || 0).toFixed(2)),
        fiado: Number(Number(row.fiado || 0).toFixed(2)),
        abonos: Number(Number(row.abonos || 0).toFixed(2)),
      })),
      hourlySales,
      dayOfWeekSales,
      paymentMethods,
      productProfitability: (productProfitabilityRes.rows || []).map((p) => ({
        id: p.id,
        name: p.name,
        sale_price: Number(p.sale_price),
        purchase_price: Number(p.purchase_price),
        sold_count: Number(p.sold_count),
        unit_margin: Number(Number(p.unit_margin || 0).toFixed(2)),
        margin_percent: Number(p.margin_percent || 0),
        total_profit: Number(Number(p.total_profit || 0).toFixed(2)),
        total_revenue: Number(Number(p.total_revenue || 0).toFixed(2)),
      })),
      productAffinity: productAffinityRes.rows || [],
      debtAging,
      stagnantStock: (stagnantStockRes.rows || []).map((s) => ({
        id: s.id,
        name: s.name,
        stock: Number(s.stock),
        purchase_price: Number(s.purchase_price),
        sale_price: Number(s.sale_price),
        sold_count: Number(s.sold_count),
        frozen_capital: Number(Number(s.frozen_capital || 0).toFixed(2)),
      })),
    });
  } catch (error) {
    console.error("Error generating stats:", error);
    return res.status(500).json({ message: error.message });
  }
});

function getPeriodDateRange(period) {
  if (!period || period === "historico") return null;
  const now = new Date();
  const localStr = now.toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  });
  const [yearStr, monthStr, dayStr] = localStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (period === "mes") {
    const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return {
      start: `${startStr} 00:00:00`,
      end: `${endStr} 23:59:59`,
    };
  } else if (period === "quincena") {
    const mStr = String(month).padStart(2, "0");
    if (day <= 15) {
      return {
        start: `${year}-${mStr}-01 00:00:00`,
        end: `${year}-${mStr}-15 23:59:59`,
      };
    } else {
      const lastDay = new Date(year, month, 0).getDate();
      return {
        start: `${year}-${mStr}-16 00:00:00`,
        end: `${year}-${mStr}-${String(lastDay).padStart(2, "0")} 23:59:59`,
      };
    }
  } else if (period === "semana") {
    const localDate = new Date(`${localStr}T12:00:00`);
    const dayOfWeek = localDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mon = new Date(localDate);
    mon.setDate(localDate.getDate() - diffToMonday);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const monStr = mon.toLocaleDateString("en-CA");
    const sunStr = sun.toLocaleDateString("en-CA");
    return {
      start: `${monStr} 00:00:00`,
      end: `${sunStr} 23:59:59`,
    };
  }
  return null;
}

app.get("/api/stats/clients", authGuard, async (req, res) => {
  const { period = "historico" } = req.query;
  try {
    const range = getPeriodDateRange(period);
    const dateParams = range ? [range.start, range.end] : [];

    // 1. Clientes registrados
    const clientsRes = await query(
      "SELECT id, name, phone, points, total_debt FROM clients ORDER BY name ASC",
    );

    // 2. Compras de clientes con items
    const movSql = `
      SELECT 
        m.id AS movement_id,
        m.client_id,
        m.amount,
        COALESCE(m.paid_amount, 0) AS paid_amount,
        m.concept,
        m.payment_method,
        m.created_at,
        EXTRACT(DOW FROM (m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City'))::int AS dow,
        mi.sweet_id,
        mi.quantity,
        mi.unit_price,
        s.name AS sweet_name
      FROM movements m
      LEFT JOIN movement_items mi ON mi.movement_id = m.id
      LEFT JOIN sweets s ON s.id = mi.sweet_id
      WHERE (
        (m.amount > 0) 
        OR (COALESCE(m.paid_amount, 0) > 0)
        OR (m.amount = 0 AND (m.concept ILIKE '%contado%' OR mi.sweet_id IS NOT NULL))
      )
      AND m.concept NOT ILIKE '%pago%'
      AND m.concept NOT ILIKE '%abono%'
      ${range ? "AND (m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') BETWEEN $1 AND $2" : ""}
      ORDER BY m.created_at DESC
    `;
    const movRes = await query(movSql, dateParams);

    // 3. Ventas al mostrador (Público General)
    const salesSql = `
      SELECT 
        s.id AS sale_id,
        s.total_amount,
        s.payment_method,
        s.created_at,
        EXTRACT(DOW FROM (s.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City'))::int AS dow,
        si.sweet_id,
        si.quantity,
        si.unit_price,
        sw.name AS sweet_name
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN sweets sw ON sw.id = si.sweet_id
      ${range ? "WHERE (s.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') BETWEEN $1 AND $2" : ""}
      ORDER BY s.created_at DESC
    `;
    const salesRes = await query(salesSql, dateParams);

    const DOW_NAMES = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];

    function processTickets(rows, isSale = false) {
      const ticketsMap = new Map();
      rows.forEach((r) => {
        const ticketId = isSale ? r.sale_id : r.movement_id;
        if (!ticketsMap.has(ticketId)) {
          ticketsMap.set(ticketId, {
            id: ticketId,
            amount: isSale
              ? Number(r.total_amount || 0)
              : Number(r.amount || 0),
            paid_amount: isSale ? 0 : Number(r.paid_amount || 0),
            created_at: r.created_at,
            payment_method: r.payment_method || "cash",
            dow: r.dow,
            items: [],
          });
        }
        if (r.sweet_id && r.sweet_name) {
          ticketsMap.get(ticketId).items.push({
            sweet_id: r.sweet_id,
            sweet_name: r.sweet_name,
            quantity: Number(r.quantity || 0),
            unit_price: Number(r.unit_price || 0),
          });
        }
      });

      const tickets = Array.from(ticketsMap.values());
      const totalTickets = tickets.length;
      if (totalTickets === 0) {
        return {
          total_tickets: 0,
          total_spent: 0,
          total_units: 0,
          average_ticket: 0,
          cross_selling_count: 0,
          cross_selling_percent: 0,
          top_cross_selling_pair: null,
          cross_selling_pairs: [],
          favorite_product: null,
          top_products: [],
          top_day_name: "—",
          avg_days_between_purchases: null,
          last_purchase: null,
          payment_methods: {},
          recent_purchases: [],
        };
      }

      let totalSpent = 0;
      let totalUnits = 0;
      let crossSellingCount = 0;
      const productMap = new Map();
      const pairMap = new Map();
      const dowCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const pmCounts = {};

      tickets.forEach((t) => {
        let ticketTotal = t.amount;
        if (!isSale && ticketTotal === 0 && t.items.length > 0) {
          ticketTotal = t.items.reduce(
            (sum, it) => sum + it.quantity * it.unit_price,
            0,
          );
        } else if (!isSale && ticketTotal === 0 && t.paid_amount > 0) {
          ticketTotal = t.paid_amount;
        }
        totalSpent += ticketTotal;

        // Sumar unidades
        t.items.forEach((it) => {
          totalUnits += Number(it.quantity || 0);
        });

        // Cross-selling: qué productos específicos compra juntos en tickets con 2 o más artículos
        if (t.items.length >= 2) {
          crossSellingCount++;
          const uniqueItems = Array.from(
            new Set(
              t.items.map((it) => (it.sweet_name || "").trim()).filter(Boolean),
            ),
          ).sort();

          for (let i = 0; i < uniqueItems.length; i++) {
            for (let j = i + 1; j < uniqueItems.length; j++) {
              const pairKey = `${uniqueItems[i]} + ${uniqueItems[j]}`;
              const prev = pairMap.get(pairKey) || {
                pair: pairKey,
                item_a: uniqueItems[i],
                item_b: uniqueItems[j],
                count: 0,
              };
              prev.count += 1;
              pairMap.set(pairKey, prev);
            }
          }
        }

        t.items.forEach((it) => {
          const prev = productMap.get(it.sweet_name) || {
            name: it.sweet_name,
            quantity: 0,
            total_spent: 0,
          };
          prev.quantity += it.quantity;
          prev.total_spent += Number((it.quantity * it.unit_price).toFixed(2));
          productMap.set(it.sweet_name, prev);
        });

        if (t.dow >= 1 && t.dow <= 5) {
          dowCounts[t.dow] = (dowCounts[t.dow] || 0) + 1;
        }

        const pm = t.payment_method || "cash";
        pmCounts[pm] = (pmCounts[pm] || 0) + 1;
      });

      const sortedPairs = Array.from(pairMap.values()).sort(
        (a, b) => b.count - a.count,
      );
      const topCrossSellingPair = sortedPairs[0]?.pair || null;

      const sortedProducts = Array.from(productMap.values()).sort(
        (a, b) => b.quantity - a.quantity || b.total_spent - a.total_spent,
      );
      const favoriteProduct = sortedProducts[0] || null;
      const topProducts = sortedProducts.slice(0, 5);

      let bestDow = null;
      let maxDowCount = 0;
      Object.entries(dowCounts).forEach(([dow, count]) => {
        if (count > maxDowCount) {
          maxDowCount = count;
          bestDow = Number(dow);
        }
      });
      const topDayName = bestDow ? DOW_NAMES[bestDow] : "—";

      const sortedDates = tickets
        .map((t) => new Date(t.created_at).getTime())
        .sort((a, b) => a - b);
      let avgDaysBetween = null;
      if (sortedDates.length > 1) {
        const spanDays = Math.max(
          0,
          (sortedDates[sortedDates.length - 1] - sortedDates[0]) /
            (1000 * 60 * 60 * 24),
        );
        avgDaysBetween = Number(
          (spanDays / (sortedDates.length - 1)).toFixed(1),
        );
      }

      const lastPurchase = tickets[0]?.created_at || null;

      return {
        total_tickets: totalTickets,
        total_spent: Number(totalSpent.toFixed(2)),
        total_units: totalUnits,
        average_ticket: Number((totalSpent / totalTickets).toFixed(2)),
        cross_selling_count: crossSellingCount,
        cross_selling_percent: Math.round(
          (crossSellingCount / totalTickets) * 100,
        ),
        top_cross_selling_pair: topCrossSellingPair,
        cross_selling_pairs: sortedPairs.slice(0, 6),
        favorite_product: favoriteProduct,
        top_products: topProducts,
        top_day_name: topDayName,
        avg_days_between_purchases: avgDaysBetween,
        last_purchase: lastPurchase,
        payment_methods: pmCounts,
        recent_purchases: tickets.slice(0, 8).map((t) => ({
          id: t.id,
          date: t.created_at,
          amount:
            t.amount === 0 && t.items.length > 0
              ? t.items.reduce((s, it) => s + it.quantity * it.unit_price, 0)
              : t.amount,
          items_count: t.items.length,
          payment_method: t.payment_method,
          items_preview: t.items
            .map((it) => `${it.quantity}x ${it.sweet_name}`)
            .slice(0, 3)
            .join(", "),
        })),
      };
    }

    // Agrupar compras por cliente
    const clientMovementsMap = new Map();
    movRes.rows.forEach((r) => {
      if (!clientMovementsMap.has(r.client_id)) {
        clientMovementsMap.set(r.client_id, []);
      }
      clientMovementsMap.get(r.client_id).push(r);
    });

    const clientsList = clientsRes.rows.map((c) => {
      const rows = clientMovementsMap.get(c.id) || [];
      const stats = processTickets(rows, false);
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        points: Number(c.points || 0),
        total_debt: Number(c.total_debt || 0),
        is_public: false,
        ...stats,
      };
    });

    // Añadir Público General (Ventas Mostrador)
    const publicStats = processTickets(salesRes.rows, true);
    const publicGeneralEntity = {
      id: 0,
      name: "Público General (Mostrador)",
      phone: null,
      points: 0,
      total_debt: 0,
      is_public: true,
      ...publicStats,
    };

    const combinedList = [...clientsList, publicGeneralEntity];

    // Ordenar por total_spent DESC (Monto total comprado) y secundariamente total_tickets DESC
    combinedList.sort((a, b) => {
      if (b.total_spent !== a.total_spent) {
        return b.total_spent - a.total_spent;
      }
      return b.total_tickets - a.total_tickets;
    });

    // Asignar rangos y medallas
    combinedList.forEach((item, index) => {
      item.rank = index + 1;
      if (item.total_tickets > 0) {
        if (index === 0) {
          item.medal = "gold";
          item.medal_badge = "🥇 1°";
        } else if (index === 1) {
          item.medal = "silver";
          item.medal_badge = "🥈 2°";
        } else if (index === 2) {
          item.medal = "bronze";
          item.medal_badge = "🥉 3°";
        } else {
          item.medal = null;
          item.medal_badge = `#${index + 1}`;
        }
      } else {
        item.medal = null;
        item.medal_badge = `#${index + 1}`;
      }
    });

    const podium = combinedList.filter((c) => c.total_tickets > 0).slice(0, 3);

    return res.json({
      period,
      range,
      podium,
      clients: combinedList,
      total_active_buyers: combinedList.filter((c) => c.total_tickets > 0)
        .length,
    });
  } catch (error) {
    console.error("Error generating client stats:", error);
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/stats/sales", authGuard, async (req, res) => {
  const { from, to } = req.query;
  const hasRange = from || to;
  if (
    hasRange &&
    (!from ||
      !to ||
      !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(to))
  ) {
    return res
      .status(400)
      .json({ message: "Valid from and to dates required" });
  }

  const rangeParams = hasRange ? [from, to] : [];
  const rangeMovement = hasRange
    ? "AND m.created_at::date BETWEEN $1::date AND $2::date"
    : "";
  const rangeSale = hasRange
    ? "AND si.created_at::date BETWEEN $1::date AND $2::date"
    : "";

  try {
    const dailyTotals = await query(
      `SELECT day, SUM(total) AS total
       FROM (
         SELECT m.created_at::date AS day, SUM(mi.quantity * mi.unit_price) AS total
         FROM movements m
         JOIN movement_items mi ON mi.movement_id = m.id
         WHERE m.amount > 0 AND m.concept LIKE 'Compra%' ${rangeMovement}
         GROUP BY m.created_at::date
         UNION ALL
         SELECT si.created_at::date AS day, SUM(si.quantity * si.unit_price) AS total
         FROM sale_items si
         WHERE 1 = 1 ${rangeSale}
         GROUP BY si.created_at::date
       ) AS combined
       GROUP BY day
       ORDER BY day ASC`,
      rangeParams,
    );

    const topClients = await query(
      `SELECT c.id, c.name, SUM(mi.quantity * mi.unit_price) AS total, SUM(mi.quantity) AS units
       FROM movements m
       JOIN clients c ON c.id = m.client_id
       JOIN movement_items mi ON mi.movement_id = m.id
       WHERE m.amount > 0 AND m.concept LIKE 'Compra%' ${rangeMovement}
       GROUP BY c.id, c.name
       ORDER BY total DESC, c.name ASC
       LIMIT 5`,
      rangeParams,
    );

    return res.json({
      dailyTotals: dailyTotals.rows || [],
      topClients: topClients.rows || [],
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
              COALESCE(STRING_AGG(CONCAT(s.name, ' x', mi.quantity), ', '), 'Compra manual') AS items,
              CASE
                WHEN m.amount > 0 THEN m.amount
                WHEN COALESCE(m.paid_amount, 0) > 0 THEN m.paid_amount
                ELSE COALESCE(SUM(mi.quantity * mi.unit_price), 0)
              END AS total
       FROM movements m
       JOIN clients c ON c.id = m.client_id
       LEFT JOIN movement_items mi ON mi.movement_id = m.id
       LEFT JOIN sweets s ON s.id = mi.sweet_id
       WHERE (
         m.amount > 0
         OR (COALESCE(m.paid_amount, 0) > 0)
         OR (m.amount = 0 AND (m.concept ILIKE '%contado%' OR mi.sweet_id IS NOT NULL))
       )
         AND m.concept NOT ILIKE '%pago%'
         AND m.concept NOT ILIKE '%abono%'
         AND (m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date = $1::date
       GROUP BY m.id, m.created_at, c.name, m.amount, m.paid_amount`,
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
       WHERE (sa.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::date = $1::date
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
    const settings = await getSettings();
    const defaultCreditLimit =
      parseFloat(settings.default_credit_limit) || 50.0;
    const result = await query(
      "SELECT id, name, total_debt, points, phone, COALESCE(credit_limit, 0) AS credit_limit FROM clients ORDER BY total_debt DESC",
    );
    const rows = await Promise.all(
      result.rows.map(async (c) => {
        const debt = Number(c.total_debt || 0);
        const limit = Number(c.credit_limit || 0);
        const effectiveLimit = limit > 0 ? limit : defaultCreditLimit;
        const daysWithDebt = debt > 0 ? await getClientDebtDays(c.id, debt) : 0;
        return {
          ...c,
          credit_limit: limit,
          effective_credit_limit: effectiveLimit,
          days_with_debt: daysWithDebt,
          is_over_credit_limit: debt > effectiveLimit,
          public_code: encodeClientId(c.id),
        };
      }),
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/clients", authGuard, async (req, res) => {
  const { name, phone } = req.body || {};
  const creditLimit =
    Number(
      req.body.credit_limit !== undefined
        ? req.body.credit_limit
        : req.body.creditLimit,
    ) || 0;
  if (!name) return res.status(400).json({ message: "Name is required" });
  try {
    const result = await query(
      "INSERT INTO clients (name, phone, credit_limit) VALUES ($1, $2, $3) RETURNING *",
      [name, phone || null, creditLimit],
    );
    const newClient = result.rows[0];
    return res.json({
      ...newClient,
      credit_limit: Number(newClient.credit_limit || 0),
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
    const settings = await getSettings();
    const defaultCreditLimit =
      parseFloat(settings.default_credit_limit) || 50.0;
    const clientRes = await query(
      "SELECT name, total_debt, points, COALESCE(credit_limit, 0) AS credit_limit FROM clients WHERE id = $1",
      [clientId],
    );
    if (!clientRes.rows.length) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    const client = clientRes.rows[0];
    const debt = Number(client.total_debt || 0);
    const limit = Number(client.credit_limit || 0);
    const effectiveLimit = limit > 0 ? limit : defaultCreditLimit;
    const daysWithDebt = debt > 0 ? await getClientDebtDays(clientId, debt) : 0;
    const monthlyRankingRes = await query(
      `WITH purchase_totals AS (
         SELECT
           m.id,
           m.client_id,
           CASE
             WHEN m.amount > 0 THEN m.amount
             WHEN COALESCE(m.paid_amount, 0) > 0 THEN m.paid_amount
             ELSE COALESCE(SUM(mi.quantity * mi.unit_price), 0)
           END AS total
         FROM movements m
         LEFT JOIN movement_items mi ON mi.movement_id = m.id
         WHERE (
           m.amount > 0
           OR (COALESCE(m.paid_amount, 0) > 0)
           OR (m.amount = 0 AND (m.concept ILIKE '%contado%' OR mi.sweet_id IS NOT NULL))
         )
           AND m.concept NOT ILIKE '%pago%'
           AND m.concept NOT ILIKE '%abono%'
           AND (m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')
             BETWEEN date_trunc('month', NOW() AT TIME ZONE 'America/Mexico_City')
             AND (date_trunc('month', NOW() AT TIME ZONE 'America/Mexico_City') + INTERVAL '1 month - 1 second')
         GROUP BY m.id, m.client_id, m.amount, m.paid_amount
       )
       SELECT c.id, c.name, COALESCE(SUM(pt.total), 0) AS total_spent
       FROM clients c
       LEFT JOIN purchase_totals pt ON pt.client_id = c.id
       GROUP BY c.id, c.name
       HAVING COALESCE(SUM(pt.total), 0) > 0
       ORDER BY total_spent DESC, c.name ASC`,
    );
    const monthlyRank = monthlyRankingRes.rows.findIndex(
      (row) => Number(row.id) === Number(clientId),
    );
    const monthlyRanking =
      monthlyRank >= 0 && monthlyRank < 3
        ? {
            rank: monthlyRank + 1,
            total_spent: Number(
              monthlyRankingRes.rows[monthlyRank].total_spent || 0,
            ),
            month_label: new Intl.DateTimeFormat("es-MX", {
              month: "long",
              year: "numeric",
              timeZone: "America/Mexico_City",
            }).format(new Date()),
          }
        : null;
    return res.json({
      ...client,
      credit_limit: limit,
      effective_credit_limit: effectiveLimit,
      days_with_debt: daysWithDebt,
      is_over_credit_limit: debt > effectiveLimit,
      public_code: code,
      monthly_ranking: monthlyRanking,
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
      `SELECT m.id AS movement_id, m.concept, m.amount, COALESCE(m.paid_amount, 0) AS paid_amount, m.points, m.payment_method, m.created_at,
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
          paid_amount: Number(row.paid_amount || 0),
          points: Number(row.points || 0),
          payment_method: row.payment_method || "cash",
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
  const creditLimit =
    Number(
      req.body.credit_limit !== undefined
        ? req.body.credit_limit
        : req.body.creditLimit,
    ) || 0;
  if (!name) return res.status(400).json({ message: "Missing name" });

  const dbPool = getPool();
  const clientConn = await dbPool.connect();

  try {
    await clientConn.query("BEGIN");

    const currentClient = await clientConn.query(
      "SELECT id, name, total_debt, points, phone, credit_limit FROM clients WHERE id = $1",
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
      "UPDATE clients SET name = $1, total_debt = $2, points = $3, phone = $4, credit_limit = $5 WHERE id = $6",
      [name, normalizedDebt, normalizedPoints, phone || null, creditLimit, id],
    );

    const delta = Number((normalizedDebt - previousDebt).toFixed(2));
    if (Math.abs(delta) > 0) {
      const concept = `Ajuste por edicion de saldo (${name})`;
      await clientConn.query(
        "INSERT INTO movements (client_id, concept, amount, payment_method) VALUES ($1, $2, $3, $4)",
        [id, concept, delta, "adjust"],
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

async function getClientDebtBreakdown(clientId, totalDebt) {
  const debt = Number(totalDebt || 0);
  if (debt <= 0) return [];
  try {
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

    let remainingDebt = debt;
    const breakdown = [];

    for (const mov of sortedMovements) {
      if (remainingDebt <= 0) break;
      const movAmt = Number(mov.amount);
      if (movAmt >= remainingDebt) {
        breakdown.push({
          ...mov,
          owed_amount: Number(remainingDebt.toFixed(2)),
        });
        remainingDebt = 0;
      } else {
        breakdown.push({ ...mov, owed_amount: movAmt });
        remainingDebt = Number((remainingDebt - movAmt).toFixed(2));
      }
    }

    return breakdown;
  } catch (err) {
    console.error("Error calculating debt breakdown:", err.message);
    return [];
  }
}

function formatDebtBreakdownText(breakdown) {
  if (!breakdown || breakdown.length === 0) return "";
  const lines = ["📋 *Desglose de compras pendientes:*"];
  breakdown.forEach((item) => {
    const d = new Date(item.created_at);
    const dateStr = d.toLocaleDateString("es-MX", {
      timeZone: "America/Mexico_City",
      day: "2-digit",
      month: "short",
    });
    const itemsSummary =
      item.items && item.items.length > 0
        ? ` (${item.items.map((it) => `${it.quantity}x ${it.name}`).join(", ")})`
        : "";
    lines.push(
      `• ${dateStr}: $${Number(item.owed_amount).toFixed(2)}${itemsSummary}`,
    );
  });
  return lines.join("\n");
}

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
    const movements = await getClientDebtBreakdown(clientId, client.total_debt);
    return res.json({ client, movements });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/clients/:id/movements", authGuard, async (req, res) => {
  const clientId = Number(req.params.id);
  try {
    const result = await query(
      `SELECT m.id, m.concept, m.amount, m.points, m.payment_method, m.created_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', mi.id,
                    'sweet_id', mi.sweet_id,
                    'name', s.name,
                    'quantity', mi.quantity,
                    'unit_price', mi.unit_price
                  ) ORDER BY mi.id
                ) FILTER (WHERE mi.id IS NOT NULL),
                '[]'
              ) AS items
       FROM movements m
       LEFT JOIN movement_items mi ON mi.movement_id = m.id
       LEFT JOIN sweets s ON s.id = mi.sweet_id
       WHERE m.client_id = $1
       GROUP BY m.id
       ORDER BY m.created_at DESC`,
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
    const adminPass = await getEffectiveAdminPass();

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
  const { amount, concept, items, payImmediately, paymentMethod } =
    req.body || {};
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

    // Check client details & credit limit
    const clientRes = await clientConn.query(
      "SELECT id, name, total_debt, points, phone, COALESCE(credit_limit, 0) AS credit_limit FROM clients WHERE id = $1",
      [clientId],
    );
    if (!clientRes.rows.length) {
      await clientConn.query("ROLLBACK");
      return res.status(404).json({ message: "Client not found" });
    }
    const clientData = clientRes.rows[0];
    const currentDebt = Number(clientData.total_debt || 0);
    const creditLimit = Number(clientData.credit_limit || 0);

    let ticketItems = [];

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
        const sweet = sweetRes.rows[0];
        const unitPrice = Number(sweet.sale_price);
        totalAmount += unitPrice * item.quantity;
        ticketItems.push({
          sweetId: item.sweetId,
          name: sweet.name,
          quantity: item.quantity,
          unitPrice,
        });
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
      const clientPoints = Number(clientData.points || 0);
      if (clientPoints < pointsUsed) {
        throw new Error(
          `Puntos insuficientes. El cliente tiene ${clientPoints.toFixed(1)} pts.`,
        );
      }
    }

    const remainingAmount = Number((totalAmount - pointsUsed).toFixed(2));
    const shouldPay = !!payImmediately;

    // Credit limit calculation (si se sobrepasa aún se permite fiar, pero se alerta en la respuesta)
    const defaultCreditLimit =
      parseFloat(settings.default_credit_limit) || 50.0;
    const effectiveCreditLimit =
      creditLimit > 0 ? creditLimit : defaultCreditLimit;
    const resultingDebt = !shouldPay
      ? Number((currentDebt + remainingAmount).toFixed(2))
      : currentDebt;
    const isOverCreditLimit =
      !shouldPay && resultingDebt > effectiveCreditLimit;

    const rewardFactor = parseFloat(settings.reward_factor || "0.10");
    const pointsEarned =
      settings.rewards_enabled === "true" || settings.rewards_enabled === true
        ? Number((remainingAmount * rewardFactor).toFixed(2))
        : 0;

    let movementId;

    if (shouldPay) {
      // Compra al instante (al contado): UN SOLO movimiento con impacto neto en deuda $0.00
      // Compra al instante (al contado): UN SOLO movimiento con impacto neto en deuda $0.00 y paid_amount guardado
      const movRes = await clientConn.query(
        "INSERT INTO movements (client_id, concept, amount, points, payment_method) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        "INSERT INTO movements (client_id, concept, amount, points, payment_method, paid_amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [
          clientId,
          concept ? `${concept} (al contado)` : "Compra al contado",
          0,
          pointsEarned,
          paymentMethod || "cash",
          totalAmount,
        ],
      );
      movementId = movRes.rows[0].id;

      if (ticketItems.length > 0) {
        for (const item of ticketItems) {
          await clientConn.query(
            "INSERT INTO movement_items (movement_id, sweet_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
            [movementId, item.sweetId, item.quantity, item.unitPrice],
          );
          await clientConn.query(
            "UPDATE sweets SET stock = stock - $1, sold_count = sold_count + $1 WHERE id = $2",
            [item.quantity, item.sweetId],
          );
        }
      }

      // Descontar puntos usados si los hubo y abonar puntos ganados (la deuda no cambia)
      await clientConn.query(
        "UPDATE clients SET points = GREATEST(0, points - $1) + $2 WHERE id = $3",
        [pointsUsed, pointsEarned, clientId],
      );
    } else {
      // Compra a crédito (fiado): Se registra la deuda y los puntos
      const movRes = await clientConn.query(
        "INSERT INTO movements (client_id, concept, amount, points, payment_method) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [clientId, concept || "Compra", totalAmount, 0, "credit"],
        "INSERT INTO movements (client_id, concept, amount, points, payment_method, paid_amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [clientId, concept || "Compra", totalAmount, 0, "credit", 0],
      );
      movementId = movRes.rows[0].id;

      if (ticketItems.length > 0) {
        for (const item of ticketItems) {
          await clientConn.query(
            "INSERT INTO movement_items (movement_id, sweet_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
            [movementId, item.sweetId, item.quantity, item.unitPrice],
          );
          await clientConn.query(
            "UPDATE sweets SET stock = stock - $1, sold_count = sold_count + $1 WHERE id = $2",
            [item.quantity, item.sweetId],
          );
        }
      }

      // Incrementa deuda
      await clientConn.query(
        "UPDATE clients SET total_debt = total_debt + $1 WHERE id = $2",
        [totalAmount, clientId],
      );

      if (pointsUsed > 0) {
        await clientConn.query(
          "UPDATE clients SET points = GREATEST(0, points - $1), total_debt = total_debt - $1 WHERE id = $2",
          [pointsUsed, clientId],
        );
        await clientConn.query(
          "INSERT INTO movements (client_id, concept, amount, points, payment_method) VALUES ($1, $2, $3, $4, $5)",
          [clientId, "Pago con puntos", -pointsUsed, -pointsUsed, "points"],
        );
      }
    }

    await clientConn.query("COMMIT");

    const clientFinal = await query(
      "SELECT id, name, total_debt, points, phone FROM clients WHERE id = $1",
      [clientId],
    );
    if (clientFinal.rows.length) {
      sendWhatsAppTicketAutomatically(
        clientFinal.rows[0],
        shouldPay
          ? concept
            ? `${concept} (al contado)`
            : "Compra al contado"
          : concept || "Compra",
        totalAmount,
        pointsUsed,
        ticketItems,
      );
    }

    return res.json({
      message: "Purchase added",
      amount: totalAmount,
      overCreditLimit: isOverCreditLimit,
      resultingDebt,
      creditLimit: effectiveCreditLimit,
      clientName: clientData.name,
    });
  } catch (error) {
    await clientConn.query("ROLLBACK");
    return res.status(400).json({ message: error.message });
  } finally {
    clientConn.release();
  }
});

app.post("/api/clients/:id/pay", authGuard, async (req, res) => {
  const clientId = Number(req.params.id);
  const { amount, concept, paymentMethod } = req.body || {};
  const parsedAmount = Number(amount);

  if (
    !Number.isInteger(clientId) ||
    clientId <= 0 ||
    !Number.isFinite(parsedAmount) ||
    parsedAmount <= 0
  ) {
    return res.status(400).json({ message: "Invalid client or amount" });
  }

  const dbPool = getPool();
  const clientConn = await dbPool.connect();

  try {
    await clientConn.query("BEGIN");

    const clientRes = await clientConn.query(
      "SELECT id, name, total_debt, points, phone FROM clients WHERE id = $1",
      [clientId],
    );
    if (!clientRes.rows.length) {
      await clientConn.query("ROLLBACK");
      return res.status(404).json({ message: "Client not found" });
    }

    const settings = await getSettings();
    const rewardFactor = parseFloat(settings.reward_factor || "0.10");
    const normalized = Math.abs(parsedAmount) * -1;
    const pointsEarned =
      settings.rewards_enabled === "true" || settings.rewards_enabled === true
        ? Number((Math.abs(parsedAmount) * rewardFactor).toFixed(2))
        : 0;

    await clientConn.query(
      "INSERT INTO movements (client_id, concept, amount, points, payment_method) VALUES ($1, $2, $3, $4, $5)",
      [
        clientId,
        concept || "Pago",
        normalized,
        pointsEarned,
        paymentMethod || "cash",
      ],
    );

    await clientConn.query(
      "UPDATE clients SET total_debt = total_debt - $1, points = points + $2 WHERE id = $3",
      [Math.abs(parsedAmount), pointsEarned, clientId],
    );

    await clientConn.query("COMMIT");

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

    const updatedClient = updatedClientRes.rows[0];
    const defaultCreditLimit =
      parseFloat(settings.default_credit_limit) || 50.0;
    const clientLimit = Number(updatedClient?.credit_limit || 0);
    const effectiveLimit = clientLimit > 0 ? clientLimit : defaultCreditLimit;
    const resultingDebt = Number(updatedClient?.total_debt || 0);
    const isOverCreditLimit = resultingDebt > effectiveLimit;

    return res.json({
      message: "Payment registered",
      amount: parsedAmount,
      overCreditLimit: isOverCreditLimit,
      resultingDebt,
      creditLimit: effectiveLimit,
      clientName: updatedClient?.name,
    });
  } catch (error) {
    await clientConn.query("ROLLBACK");
    return res.status(400).json({ message: error.message });
  } finally {
    clientConn.release();
  }
});

app.post("/api/sales", authGuard, async (req, res) => {
  const { items, paymentMethod } = req.body || {};
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
    const itemDetails = [];

    for (const item of normalizedItems) {
      const sweetRes = await clientConn.query(
        "SELECT id, name, sale_price, stock FROM sweets WHERE id = $1",
        [item.sweetId],
      );
      if (!sweetRes.rows.length) throw new Error("Sweet not found");
      const sweet = sweetRes.rows[0];
      const uPrice = Number(sweet.sale_price);
      totalAmount += uPrice * item.quantity;
      itemDetails.push({
        sweetId: item.sweetId,
        quantity: item.quantity,
        unitPrice: uPrice,
      });
    }

    const saleRes = await clientConn.query(
      "INSERT INTO sales (total_amount, payment_method) VALUES ($1, $2) RETURNING id",
      [totalAmount, paymentMethod || "cash"],
    );
    const saleId = saleRes.rows[0].id;

    for (const item of itemDetails) {
      await clientConn.query(
        "INSERT INTO sale_items (sale_id, sweet_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
        [saleId, item.sweetId, item.quantity, item.unitPrice],
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

app.post("/api/package-purchases/ticket", authGuard, async (req, res) => {
  const { placeId, items } = req.body || {};
  if (!placeId || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ message: "Ticket requires a place and items" });
  }

  const normalizedItems = items
    .map((item) => ({
      sweetId: item.sweetId ? Number(item.sweetId) : null,
      productName: String(item.productName || "").trim(),
      quantity: Number(item.quantity),
      packageCost: Number(item.packageCost),
    }))
    .filter(
      (item) =>
        item.productName &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0 &&
        Number.isFinite(item.packageCost) &&
        item.packageCost >= 0,
    );

  if (normalizedItems.length === 0) {
    return res.status(400).json({ message: "Ticket has no valid items" });
  }

  const dbPool = getPool();
  const clientConn = await dbPool.connect();
  try {
    await clientConn.query("BEGIN");
    const inserted = [];
    for (const item of normalizedItems) {
      if (item.sweetId) {
        const sweet = await clientConn.query(
          "SELECT id FROM sweets WHERE id = $1 FOR UPDATE",
          [item.sweetId],
        );
        if (!sweet.rows.length) throw new Error("Product not found");
        await clientConn.query(
          "UPDATE sweets SET stock = stock + $1 WHERE id = $2",
          [item.quantity, item.sweetId],
        );
      }

      const result = await clientConn.query(
        "INSERT INTO package_purchases (sweet_id, product_name, place_id, package_cost) VALUES ($1, $2, $3, $4) RETURNING *",
        [item.sweetId, item.productName, Number(placeId), item.packageCost],
      );
      inserted.push(result.rows[0]);
    }
    await clientConn.query("COMMIT");
    return res.json({ message: "Purchase ticket added", items: inserted });
  } catch (error) {
    await clientConn.query("ROLLBACK");
    return res.status(400).json({ message: error.message });
  } finally {
    clientConn.release();
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

    if (debtValue > 0) {
      const breakdown = await getClientDebtBreakdown(client.id, debtValue);
      if (breakdown.length > 0) {
        lines.push(``);
        lines.push(formatDebtBreakdownText(breakdown));
      }
    }

    const ticketCode = encodeClientId(client.id);
    const baseUrl = process.env.APP_URL || "https://tiendita-mx.vercel.app";
    if (ticketCode) {
      lines.push(``);
      lines.push(`🔗 *Consulta tu estado de cuenta completo aquí:*`);
      lines.push(`${baseUrl}/c/${ticketCode}`);
    }
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

// Endpoint público para obtener ajustes no sensibles (CLABE, teléfono del negocio)
app.get("/api/public/settings", async (req, res) => {
  try {
    const settings = await getSettings();
    return res.json({
      bank_clabe: settings.bank_clabe || "646990403801118437",
      business_phone: settings.business_phone || "523346502871",
      business_name: settings.business_name || "Tiendita",
      default_credit_limit: parseFloat(settings.default_credit_limit) || 50.0,
    });
  } catch (error) {
    return res.json({
      bank_clabe: "646990403801118437",
      business_phone: "523346502871",
      business_name: "Tiendita",
      default_credit_limit: 50.0,
    });
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
        .json({ message: "El cliente no tiene teléfono registrado" });

    const baseUrl = process.env.APP_URL || "https://tiendita-mx.vercel.app";
    const stmtCode = encodeClientId(client.id);
    let linkStr = "";
    if (stmtCode) {
      linkStr = `\n\n🔗 *Consulta tu estado de cuenta completo aquí:*\n${baseUrl}/c/${stmtCode}`;
    }

    let breakdownStr = "";
    if (Number(client.total_debt) > 0) {
      const breakdown = await getClientDebtBreakdown(
        client.id,
        client.total_debt,
      );
      if (breakdown.length > 0) {
        breakdownStr = `\n\n${formatDebtBreakdownText(breakdown)}`;
      }
    }

    const message = `Hola ${client.name}, tu saldo total en Tiendita es de $${Number(client.total_debt).toFixed(2)} y cuentas con ${Number(client.points || 0).toFixed(1)} pts.${breakdownStr}${linkStr}\n\n¡Gracias por tu preferencia! 🙌`;

    const cleanPhone = formatWhatsAppNumber(client.phone);
    const manualWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    try {
      await sendWhatsAppMessage(client.phone, message);
      return res.json({
        message: "Estado de cuenta enviado por WhatsApp",
        waUrl: manualWaUrl,
      });
    } catch (sendError) {
      console.warn(
        "Could not send via API, providing fallback URL:",
        sendError.message,
      );
      return res.json({
        message: "No se pudo enviar automáticamente por API de WhatsApp.",
        warning: sendError.message,
        waUrl: manualWaUrl,
      });
    }
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
