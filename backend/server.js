import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const dbUser = process.env.DB_USER || "sa";
const dbPassword = process.env.DB_PASSWORD || "StrongPassw0rd!123";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = Number(process.env.DB_PORT || 1433);
const dbName = process.env.DB_NAME || "tiendita";
const dbInstance = process.env.DB_INSTANCE || "";

app.use(cors());
app.use(express.json());

const baseOptions = {
  encrypt: false,
  trustServerCertificate: true,
};

const masterConfig = {
  user: dbUser,
  password: dbPassword,
  server: dbHost,
  database: "master",
  options: {
    ...baseOptions,
    ...(dbInstance ? { instanceName: dbInstance } : {}),
  },
  ...(dbInstance ? {} : { port: dbPort }),
};

const dbConfig = {
  user: dbUser,
  password: dbPassword,
  server: dbHost,
  database: dbName,
  options: {
    ...baseOptions,
    ...(dbInstance ? { instanceName: dbInstance } : {}),
  },
  ...(dbInstance ? {} : { port: dbPort }),
};

let pool;

async function connectWithRetry() {
  let attempts = 0;
  const maxRetries = Number(process.env.DB_CONNECT_MAX_RETRIES || 60);
  const retryDelayMs = Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 2000);
  let masterPool = new sql.ConnectionPool(masterConfig);

  console.log("Connecting to SQL Server master database...");

  while (attempts < maxRetries) {
    try {
      await masterPool.connect();
      console.log("Connected to master database");
      break;
    } catch (error) {
      attempts += 1;
      const reason = error?.message ? ` Reason: ${error.message}` : "";
      console.log(
        `Connection attempt ${attempts}/${maxRetries} failed, retrying...${reason}`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  if (!masterPool.connected) {
    throw new Error(
      `Database connection failed after ${maxRetries} attempts. Check DB_HOST/DB_PORT credentials and SQL container status.`,
    );
  }

  console.log("Creating tiendita database if not exists...");
  await masterPool.request().query(`
    IF DB_ID('${dbName}') IS NULL
    BEGIN
      CREATE DATABASE ${dbName};
    END;
  `);
  console.log("Database tiendita ready");

  await masterPool.close();

  console.log("Connecting to tiendita database...");
  pool = new sql.ConnectionPool(dbConfig);
  await pool.connect();
  console.log("Connected to tiendita database");
}

async function runSchema() {
  const schemaPath = path.join(process.cwd(), "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  const batches = schema.split(/^\s*GO\s*$/im);

  console.log(`Found ${batches.length} batches in schema`);

  for (let i = 0; i < batches.length; i++) {
    const trimmed = batches[i].trim();
    if (trimmed.length > 0 && !trimmed.includes("CREATE DATABASE")) {
      console.log(`Executing batch ${i + 1}/${batches.length}`);
      try {
        await pool.request().batch(trimmed);
      } catch (error) {
        console.error(`Error executing batch ${i + 1}:`, error.message);
        throw error;
      }
    }
  }
  console.log("Schema execution completed");
}

async function runSeed() {
  const demoSeedEnabled =
    (process.env.ENABLE_DEMO_SEED || "false").toLowerCase() === "true";
  if (!demoSeedEnabled) {
    console.log("Demo seed disabled. Skipping seed data initialization.");
    return;
  }

  const seedPath = path.join(process.cwd(), "seed-complete.sql");
  if (!fs.existsSync(seedPath)) {
    console.log("Seed file not found, skipping seed execution");
    return;
  }

  const seed = fs.readFileSync(seedPath, "utf-8");
  const batches = seed.split(/^\s*GO\s*$/im);

  console.log("Running seed data initialization...");
  for (let i = 0; i < batches.length; i++) {
    const trimmed = batches[i].trim();
    if (trimmed.length > 0) {
      try {
        await pool.request().batch(trimmed);
      } catch (error) {
        console.error(`Error executing seed batch ${i + 1}:`, error.message);
      }
    }
  }
  console.log("Seed data initialization completed");
}

function authGuard(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USER || "admin";
  const adminPass = process.env.ADMIN_PASS || "admin123";

  if (username !== adminUser || password !== adminPass) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, {
    expiresIn: "365d",
  });
  return res.json({ token });
});

app.get("/api/prices", async (req, res) => {
  const result = await pool
    .request()
    .query("SELECT name, sale_price AS price FROM dbo.sweets ORDER BY name");
  return res.json(result.recordset);
});

app.get("/api/sweets", authGuard, async (req, res) => {
  const result = await pool
    .request()
    .query(
      "SELECT id, name, purchase_price, sale_price, stock, sold_count FROM dbo.sweets ORDER BY created_at DESC",
    );
  return res.json(result.recordset);
});

app.post("/api/sweets", authGuard, async (req, res) => {
  const { name, purchasePrice, salePrice, stock } = req.body || {};
  if (!name || purchasePrice == null || salePrice == null) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const normalizedStock = Number.isFinite(Number(stock)) ? Number(stock) : 0;

  await pool
    .request()
    .input("name", sql.NVarChar, name)
    .input("purchase", sql.Decimal(10, 2), Number(purchasePrice))
    .input("sale", sql.Decimal(10, 2), Number(salePrice))
    .input("stock", sql.Int, normalizedStock)
    .query(
      "INSERT INTO dbo.sweets (name, purchase_price, sale_price, stock) VALUES (@name, @purchase, @sale, @stock)",
    );

  return res.json({ message: "Sweet added" });
});

app.put("/api/sweets/:id", authGuard, async (req, res) => {
  const id = Number(req.params.id);
  const { name, purchasePrice, salePrice, stock } = req.body || {};
  if (!name || purchasePrice == null || salePrice == null) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const normalizedStock = Number.isFinite(Number(stock)) ? Number(stock) : 0;

  await pool
    .request()
    .input("id", sql.Int, id)
    .input("name", sql.NVarChar, name)
    .input("purchase", sql.Decimal(10, 2), Number(purchasePrice))
    .input("sale", sql.Decimal(10, 2), Number(salePrice))
    .input("stock", sql.Int, normalizedStock)
    .query(
      "UPDATE dbo.sweets SET name = @name, purchase_price = @purchase, sale_price = @sale, stock = @stock WHERE id = @id",
    );

  return res.json({ message: "Sweet updated" });
});

app.get("/api/sweets/stats", authGuard, async (req, res) => {
  const totals = await pool
    .request()
    .query(
      "SELECT COUNT(*) AS total_products, SUM(stock) AS total_stock, SUM(sold_count) AS total_sold FROM dbo.sweets",
    );

  const topSeller = await pool
    .request()
    .query(
      "SELECT TOP 1 name, sold_count FROM dbo.sweets ORDER BY sold_count DESC, name ASC",
    );

  const lowSeller = await pool
    .request()
    .query(
      "SELECT TOP 1 name, sold_count FROM dbo.sweets ORDER BY sold_count ASC, name ASC",
    );

  const lowStock = await pool
    .request()
    .query(
      "SELECT TOP 1 name, stock FROM dbo.sweets ORDER BY stock ASC, name ASC",
    );

  return res.json({
    totals: totals.recordset[0] || {
      total_products: 0,
      total_stock: 0,
      total_sold: 0,
    },
    topSeller: topSeller.recordset[0] || null,
    lowSeller: lowSeller.recordset[0] || null,
    lowStock: lowStock.recordset[0] || null,
  });
});

app.get("/api/stats", authGuard, async (req, res) => {
  const lowStockThreshold = 10;
  const criticalStockThreshold = 3;

  const dailyTotals = await pool.request().query(`
    SELECT day, SUM(total) AS total, SUM(profit) AS profit
    FROM (
      SELECT CONVERT(date, m.created_at) AS day,
             SUM(mi.quantity * mi.unit_price) AS total,
             SUM(mi.quantity * (mi.unit_price - s.purchase_price)) AS profit
      FROM dbo.movements m
      JOIN dbo.movement_items mi ON mi.movement_id = m.id
      JOIN dbo.sweets s ON s.id = mi.sweet_id
      WHERE m.amount > 0 AND m.concept LIKE 'Compra%'
      GROUP BY CONVERT(date, m.created_at)
      UNION ALL
      SELECT CONVERT(date, si.created_at) AS day,
             SUM(si.quantity * si.unit_price) AS total,
             SUM(si.quantity * (si.unit_price - s.purchase_price)) AS profit
      FROM dbo.sale_items si
      JOIN dbo.sweets s ON s.id = si.sweet_id
      GROUP BY CONVERT(date, si.created_at)
    ) AS combined
    GROUP BY day
    ORDER BY day DESC;
  `);

  const topSeller = await pool
    .request()
    .query(
      "SELECT TOP 1 name, sold_count FROM dbo.sweets ORDER BY sold_count DESC, name ASC",
    );

  const lowSeller = await pool
    .request()
    .query(
      "SELECT TOP 1 name, sold_count FROM dbo.sweets ORDER BY sold_count ASC, name ASC",
    );

  const lowStock = await pool
    .request()
    .input("threshold", sql.Int, lowStockThreshold)
    .query(
      "SELECT id, name, stock FROM dbo.sweets WHERE stock <= @threshold ORDER BY stock ASC, name ASC",
    );

  return res.json({
    dailyTotals: dailyTotals.recordset || [],
    topSeller: topSeller.recordset[0] || null,
    lowSeller: lowSeller.recordset[0] || null,
    lowStock: lowStock.recordset || [],
    thresholds: {
      low: lowStockThreshold,
      critical: criticalStockThreshold,
    },
  });
});

app.get("/api/stats/weekly", authGuard, async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ message: "from and to dates required" });
  }

  const result = await pool
    .request()
    .input("from", sql.Date, from)
    .input("to", sql.Date, to).query(`
      SELECT day, SUM(total) AS total, SUM(profit) AS profit
      FROM (
        SELECT CONVERT(date, m.created_at) AS day,
               SUM(mi.quantity * mi.unit_price) AS total,
               SUM(mi.quantity * (mi.unit_price - s.purchase_price)) AS profit
        FROM dbo.movements m
        JOIN dbo.movement_items mi ON mi.movement_id = m.id
        JOIN dbo.sweets s ON s.id = mi.sweet_id
        WHERE m.amount > 0 AND m.concept LIKE 'Compra%'
          AND CONVERT(date, m.created_at) BETWEEN @from AND @to
        GROUP BY CONVERT(date, m.created_at)
        UNION ALL
        SELECT CONVERT(date, si.created_at) AS day,
               SUM(si.quantity * si.unit_price) AS total,
               SUM(si.quantity * (si.unit_price - s.purchase_price)) AS profit
        FROM dbo.sale_items si
        JOIN dbo.sweets s ON s.id = si.sweet_id
        WHERE CONVERT(date, si.created_at) BETWEEN @from AND @to
        GROUP BY CONVERT(date, si.created_at)
      ) AS combined
      GROUP BY day
      ORDER BY day ASC;
    `);

  const days = result.recordset || [];
  const total = days.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const profit = days.reduce((sum, row) => sum + Number(row.profit || 0), 0);
  return res.json({ total, profit, days });
});

app.get("/api/stats/day/:day", authGuard, async (req, res) => {
  const day = req.params.day;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return res.status(400).json({ message: "Invalid day format" });
  }

  const movementPurchases = await pool.request().input("day", sql.Date, day)
    .query(`
      SELECT m.id,
             m.created_at,
             c.name AS buyer,
             STRING_AGG(CONCAT(s.name, ' x', mi.quantity), ', ') AS items,
             SUM(mi.quantity * mi.unit_price) AS total
      FROM dbo.movements m
      JOIN dbo.clients c ON c.id = m.client_id
      JOIN dbo.movement_items mi ON mi.movement_id = m.id
      JOIN dbo.sweets s ON s.id = mi.sweet_id
      WHERE m.amount > 0
        AND m.concept LIKE 'Compra%'
        AND CONVERT(date, m.created_at) = @day
      GROUP BY m.id, m.created_at, c.name
    `);

  const cashSales = await pool.request().input("day", sql.Date, day).query(`
      SELECT sa.id,
             sa.created_at,
             'Mostrador' AS buyer,
             STRING_AGG(CONCAT(s.name, ' x', si.quantity), ', ') AS items,
             SUM(si.quantity * si.unit_price) AS total
      FROM dbo.sales sa
      JOIN dbo.sale_items si ON si.sale_id = sa.id
      JOIN dbo.sweets s ON s.id = si.sweet_id
      WHERE CONVERT(date, sa.created_at) = @day
      GROUP BY sa.id, sa.created_at
    `);

  const rows = [...movementPurchases.recordset, ...cashSales.recordset].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return res.json(rows);
});

app.delete("/api/sweets/:id", authGuard, async (req, res) => {
  const id = Number(req.params.id);

  await pool
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM dbo.sweets WHERE id = @id");

  return res.json({ message: "Sweet deleted" });
});

app.get("/api/clients", authGuard, async (req, res) => {
  const result = await pool
    .request()
    .query(
      "SELECT id, name, total_debt, points, phone FROM dbo.clients ORDER BY total_debt DESC",
    );
  return res.json(result.recordset);
});

app.post("/api/clients", authGuard, async (req, res) => {
  const { name, phone } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: "Missing name" });
  }

  await pool
    .request()
    .input("name", sql.NVarChar, name)
    .input("phone", sql.NVarChar, phone || null)
    .query("INSERT INTO dbo.clients (name, phone) VALUES (@name, @phone)");

  return res.json({ message: "Client created" });
});

app.put("/api/clients/:id", authGuard, async (req, res) => {
  const id = Number(req.params.id);
  const { name, totalDebt, points, phone } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: "Missing name" });
  }

  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const currentClient = await new sql.Request(tx)
      .input("id", sql.Int, id)
      .query(
        "SELECT TOP 1 id, name, total_debt, points, phone FROM dbo.clients WHERE id = @id",
      );

    if (!currentClient.recordset.length) {
      await tx.rollback();
      return res.status(404).json({ message: "Client not found" });
    }

    const previousDebt = Number(currentClient.recordset[0].total_debt || 0);
    const normalizedDebt = Number.isFinite(Number(totalDebt))
      ? Number(totalDebt)
      : 0;
    const normalizedPoints = Number.isFinite(Number(points))
      ? Math.max(0, Number(points))
      : 0;

    await new sql.Request(tx)
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, name)
      .input("debt", sql.Decimal(10, 2), normalizedDebt)
      .input("points", sql.Decimal(10, 2), normalizedPoints)
      .input("phone", sql.NVarChar, phone || null)
      .query(
        "UPDATE dbo.clients SET name = @name, total_debt = @debt, points = @points, phone = @phone WHERE id = @id",
      );

    const delta = Number((normalizedDebt - previousDebt).toFixed(2));
    if (Math.abs(delta) > 0) {
      const concept = `Ajuste por edicion de saldo (${name})`;
      await new sql.Request(tx)
        .input("clientId", sql.Int, id)
        .input("concept", sql.NVarChar, concept)
        .input("amount", sql.Decimal(10, 2), delta)
        .query(
          "INSERT INTO dbo.movements (client_id, concept, amount) VALUES (@clientId, @concept, @amount)",
        );
    }

    await tx.commit();
    return res.json({ message: "Client updated" });
  } catch (error) {
    await tx.rollback();
    return res.status(500).json({ message: "Client update failed" });
  }
});

app.delete("/api/clients/:id", authGuard, async (req, res) => {
  const id = Number(req.params.id);

  await pool
    .request()
    .input("id", sql.Int, id)
    .query(
      "DELETE FROM dbo.movements WHERE client_id = @id; DELETE FROM dbo.clients WHERE id = @id",
    );

  return res.json({ message: "Client deleted" });
});

app.get("/api/clients/:id/debt-breakdown", authGuard, async (req, res) => {
  const clientId = Number(req.params.id);
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return res.status(400).json({ message: "Invalid client id" });
  }

  try {
    const clientResult = await pool
      .request()
      .input("clientId", sql.Int, clientId)
      .query("SELECT id, name, total_debt, points, phone FROM dbo.clients WHERE id = @clientId");

    if (clientResult.recordset.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }
    const client = clientResult.recordset[0];

    const movementsResult = await pool
      .request()
      .input("clientId", sql.Int, clientId)
      .query(`
        SELECT m.id AS movement_id, m.concept, m.amount, m.created_at,
               mi.quantity, mi.unit_price, s.name AS sweet_name
        FROM dbo.movements m
        LEFT JOIN dbo.movement_items mi ON mi.movement_id = m.id
        LEFT JOIN dbo.sweets s ON s.id = mi.sweet_id
        WHERE m.client_id = @clientId AND m.concept LIKE 'Compra%' AND m.amount > 0
        ORDER BY m.created_at DESC
      `);

    const movementsMap = {};
    for (const row of movementsResult.recordset) {
      if (!movementsMap[row.movement_id]) {
        movementsMap[row.movement_id] = {
          id: row.movement_id,
          concept: row.concept,
          amount: Number(row.amount),
          created_at: row.created_at,
          items: []
        };
      }
      if (row.sweet_name) {
        movementsMap[row.movement_id].items.push({
          name: row.sweet_name,
          quantity: row.quantity,
          unit_price: Number(row.unit_price)
        });
      }
    }

    const sortedMovements = Object.values(movementsMap).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    let remainingDebt = Number(client.total_debt || 0);
    const movements = [];

    for (const mov of sortedMovements) {
      if (remainingDebt <= 0) {
        break;
      }
      const movAmt = Number(mov.amount);
      if (movAmt >= remainingDebt) {
        movements.push({
          ...mov,
          owed_amount: Number(remainingDebt.toFixed(2))
        });
        remainingDebt = 0;
      } else {
        movements.push({
          ...mov,
          owed_amount: movAmt
        });
        remainingDebt = Number((remainingDebt - movAmt).toFixed(2));
      }
    }

    return res.json({ client, movements });
  } catch (error) {
    console.error("Error fetching debt breakdown:", error);
    return res.status(500).json({ message: "Error fetching debt breakdown" });
  }
});

app.get("/api/clients/:id/movements", authGuard, async (req, res) => {
  const clientId = Number(req.params.id);
  const result = await pool
    .request()
    .input("clientId", sql.Int, clientId)
    .query(
      "SELECT id, concept, amount, points, created_at FROM dbo.movements WHERE client_id = @clientId ORDER BY created_at DESC",
    );
  return res.json(result.recordset);
});

app.get("/api/movements/:id/items", authGuard, async (req, res) => {
  const movementId = Number(req.params.id);
  if (!movementId) {
    return res.status(400).json({ message: "Invalid movement id" });
  }

  const result = await pool
    .request()
    .input("movementId", sql.Int, movementId)
    .query(
      "SELECT mi.id, mi.quantity, mi.unit_price, s.name FROM dbo.movement_items mi JOIN dbo.sweets s ON mi.sweet_id = s.id WHERE mi.movement_id = @movementId ORDER BY mi.id",
    );

  return res.json(result.recordset);
});

app.delete(
  "/api/clients/:clientId/movements/:movementId",
  authGuard,
  async (req, res) => {
    const clientId = Number(req.params.clientId);
    const movementId = Number(req.params.movementId);
    const { password } = req.body || {};
    const adminPass = process.env.ADMIN_PASS || "admin123";

    if (!clientId || !movementId) {
      return res.status(400).json({ message: "Invalid client or movement id" });
    }

    if (!password || password !== adminPass) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const movementResult = await new sql.Request(tx)
        .input("movementId", sql.Int, movementId)
        .input("clientId", sql.Int, clientId).query(`
          SELECT TOP 1 id, client_id, amount, concept, points
          FROM dbo.movements
          WHERE id = @movementId AND client_id = @clientId
        `);

      if (movementResult.recordset.length === 0) {
        await tx.rollback();
        return res.status(404).json({ message: "Movimiento no encontrado" });
      }

      const movement = movementResult.recordset[0];

      const movementItemsResult = await new sql.Request(tx)
        .input("movementId", sql.Int, movementId)
        .query(
          "SELECT sweet_id, quantity FROM dbo.movement_items WHERE movement_id = @movementId",
        );

      for (const item of movementItemsResult.recordset) {
        await new sql.Request(tx)
          .input("sweetId", sql.Int, Number(item.sweet_id))
          .input("quantity", sql.Int, Number(item.quantity))
          .query(
            "UPDATE dbo.sweets SET stock = stock + @quantity, sold_count = sold_count - @quantity WHERE id = @sweetId",
          );
      }

      await new sql.Request(tx)
        .input("movementId", sql.Int, movementId)
        .query(
          "DELETE FROM dbo.movement_items WHERE movement_id = @movementId",
        );

      await new sql.Request(tx)
        .input("movementId", sql.Int, movementId)
        .query("DELETE FROM dbo.movements WHERE id = @movementId");

      const pointsToDeduct = Number(movement.points || 0);

      await new sql.Request(tx)
        .input("clientId", sql.Int, clientId)
        .input("amount", sql.Decimal(10, 2), Number(movement.amount))
        .input("points", sql.Decimal(10, 2), pointsToDeduct)
        .query(
          "UPDATE dbo.clients SET total_debt = total_debt - @amount, points = CASE WHEN points - @points < 0 THEN 0 ELSE points - @points END WHERE id = @clientId",
        );

      await tx.commit();
      return res.json({ message: "Movimiento eliminado" });
    } catch (error) {
      await tx.rollback();
      return res
        .status(500)
        .json({ message: "No se pudo eliminar el movimiento" });
    }
  },
);

app.post("/api/clients/:id/purchase", authGuard, async (req, res) => {
  const clientId = Number(req.params.id);
  const { amount, concept, items } = req.body || {};
  const pointsUsed = Number(req.body.pointsUsed) || 0;

  if (pointsUsed < 0) {
    return res.status(400).json({ message: "Puntos a usar no pueden ser negativos" });
  }

  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    let totalAmount = 0;
    let normalizedItems = [];

    const settings = await getSettings();

    // 1. Process items if present
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
        await tx.rollback();
        return res.status(400).json({ message: "Missing items" });
      }

      const ids = Array.from(
        new Set(normalizedItems.map((item) => item.sweetId)),
      );

      const idsParams = ids.map((_, idx) => `@id${idx}`).join(", ");
      const sweetRequest = new sql.Request(tx);
      ids.forEach((id, idx) => sweetRequest.input(`id${idx}`, sql.Int, id));

      const sweetsResult = await sweetRequest.query(
        `SELECT id, name, sale_price, stock FROM dbo.sweets WHERE id IN (${idsParams})`,
      );

      const sweetMap = new Map(
        sweetsResult.recordset.map((sweet) => [sweet.id, sweet]),
      );

      for (const item of normalizedItems) {
        const sweet = sweetMap.get(item.sweetId);
        if (!sweet) {
          throw new Error("Sweet not found");
        }
        totalAmount += Number(sweet.sale_price) * item.quantity;
      }

      if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
        throw new Error("Invalid amount");
      }
    } else {
      // Manual amount purchase
      if (!amount) {
        await tx.rollback();
        return res.status(400).json({ message: "Missing amount" });
      }
      totalAmount = Number(amount);
      if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
        throw new Error("Monto de compra no válido");
      }
    }

    if (pointsUsed > totalAmount) {
      throw new Error("No se pueden usar más puntos que el total de la compra");
    }

    // 2. Validate client and points balance if pointsUsed > 0
    if (pointsUsed > 0) {
      const clientRes = await new sql.Request(tx)
        .input("clientId", sql.Int, clientId)
        .query("SELECT points FROM dbo.clients WHERE id = @clientId");
      if (!clientRes.recordset.length) {
        throw new Error("Client not found");
      }
      const clientPoints = Number(clientRes.recordset[0].points || 0);
      if (clientPoints < pointsUsed) {
        throw new Error(`Puntos insuficientes. El cliente tiene ${clientPoints.toFixed(1)} pts y se intentó usar ${pointsUsed.toFixed(1)} pts.`);
      }
    }

    // 3. Create primary Purchase movement
    const movementRequest = new sql.Request(tx);
    const movementResult = await movementRequest
      .input("clientId", sql.Int, clientId)
      .input("concept", sql.NVarChar, concept || "Compra")
      .input("amount", sql.Decimal(10, 2), totalAmount)
      .input("points", sql.Decimal(10, 2), 0)
      .query(
        "INSERT INTO dbo.movements (client_id, concept, amount, points) VALUES (@clientId, @concept, @amount, @points); SELECT SCOPE_IDENTITY() AS id;",
      );

    const movementId = Number(movementResult.recordset[0].id);

    let ticketItems = [];
    // 4. Save items & update sweets stock (only for items path)
    if (normalizedItems.length > 0) {
      // First construct map to reuse sweetsResult
      const ids = Array.from(new Set(normalizedItems.map((item) => item.sweetId)));
      const idsParams = ids.map((_, idx) => `@id${idx}`).join(", ");
      const sweetRequest = new sql.Request(tx);
      ids.forEach((id, idx) => sweetRequest.input(`id${idx}`, sql.Int, id));
      const sweetsResult = await sweetRequest.query(
        `SELECT id, name, sale_price, stock FROM dbo.sweets WHERE id IN (${idsParams})`,
      );
      const sweetMap = new Map(
        sweetsResult.recordset.map((sweet) => [sweet.id, sweet]),
      );

      for (const item of normalizedItems) {
        const sweet = sweetMap.get(item.sweetId);
        if (sweet) {
          ticketItems.push({
            name: sweet.name,
            quantity: item.quantity,
            unitPrice: Number(sweet.sale_price)
          });
        }
        const itemRequest = new sql.Request(tx);
        await itemRequest
          .input("movementId", sql.Int, movementId)
          .input("sweetId", sql.Int, item.sweetId)
          .input("quantity", sql.Int, item.quantity)
          .input("unitPrice", sql.Decimal(10, 2), Number(sweet.sale_price))
          .query(
            "INSERT INTO dbo.movement_items (movement_id, sweet_id, quantity, unit_price) VALUES (@movementId, @sweetId, @quantity, @unitPrice)",
          );

        const stockRequest = new sql.Request(tx);
        await stockRequest
          .input("sweetId", sql.Int, item.sweetId)
          .input("quantity", sql.Int, item.quantity)
          .query(
            "UPDATE dbo.sweets SET stock = stock - @quantity, sold_count = sold_count + @quantity WHERE id = @sweetId",
          );
      }
    }

    // 5. Apply points used if any
    if (pointsUsed > 0) {
      await new sql.Request(tx)
        .input("clientId", sql.Int, clientId)
        .input("pointsUsed", sql.Decimal(10, 2), pointsUsed)
        .query(
          "UPDATE dbo.clients SET points = CASE WHEN points - @pointsUsed < 0 THEN 0 ELSE points - @pointsUsed END WHERE id = @clientId"
        );

      await new sql.Request(tx)
        .input("clientId", sql.Int, clientId)
        .input("concept", sql.NVarChar, "Pago con puntos")
        .input("amount", sql.Decimal(10, 2), -pointsUsed)
        .input("points", sql.Decimal(10, 2), -pointsUsed)
        .query(
          "INSERT INTO dbo.movements (client_id, concept, amount, points) VALUES (@clientId, @concept, @amount, @points)"
        );
    }

    const remainingAmount = Number((totalAmount - pointsUsed).toFixed(2));
    const shouldPay = !!req.body.payImmediately;
    const pointsEarned = settings.rewards_enabled
      ? Number((remainingAmount * settings.reward_factor).toFixed(2))
      : 0;

    // 6. Handle payment or debt adjustment
    if (shouldPay) {
      await new sql.Request(tx)
        .input("clientId", sql.Int, clientId)
        .input("concept", sql.NVarChar, "Pago de compra al instante")
        .input("amount", sql.Decimal(10, 2), -remainingAmount)
        .input("points", sql.Decimal(10, 2), pointsEarned)
        .query(
          "INSERT INTO dbo.movements (client_id, concept, amount, points) VALUES (@clientId, @concept, @amount, @points)"
        );

      await new sql.Request(tx)
        .input("clientId", sql.Int, clientId)
        .input("points", sql.Decimal(10, 2), pointsEarned)
        .query(
          "UPDATE dbo.clients SET points = points + @points WHERE id = @clientId"
        );
    } else {
      await new sql.Request(tx)
        .input("clientId", sql.Int, clientId)
        .input("amount", sql.Decimal(10, 2), remainingAmount)
        .query(
          "UPDATE dbo.clients SET total_debt = total_debt + @amount WHERE id = @clientId"
        );
    }

    await tx.commit();

    try {
      const clientRes = await pool
        .request()
        .input("clientId", sql.Int, clientId)
        .query("SELECT id, name, total_debt, points, phone FROM dbo.clients WHERE id = @clientId");
      if (clientRes.recordset.length > 0) {
        const client = clientRes.recordset[0];
        sendWhatsAppTicketAutomatically(client, concept || "Compra", totalAmount, pointsUsed, ticketItems);
      }
    } catch (e) {
      console.error("Error sending automatic purchase ticket:", e.message);
    }

    return res.json({ message: "Purchase added", amount: totalAmount });
  } catch (error) {
    await tx.rollback();
    return res.status(400).json({ message: error.message });
  }
});

app.post("/api/sales", authGuard, async (req, res) => {
  const { items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Missing items" });
  }

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

  if (normalizedItems.length === 0) {
    return res.status(400).json({ message: "Missing items" });
  }

  const ids = Array.from(new Set(normalizedItems.map((item) => item.sweetId)));

  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const idsParams = ids.map((_, idx) => `@id${idx}`).join(", ");
    const sweetRequest = new sql.Request(tx);
    ids.forEach((id, idx) => sweetRequest.input(`id${idx}`, sql.Int, id));

    const sweetsResult = await sweetRequest.query(
      `SELECT id, name, sale_price, stock FROM dbo.sweets WHERE id IN (${idsParams})`,
    );

    const sweetMap = new Map(
      sweetsResult.recordset.map((sweet) => [sweet.id, sweet]),
    );

    let totalAmount = 0;
    for (const item of normalizedItems) {
      const sweet = sweetMap.get(item.sweetId);
      if (!sweet) {
        throw new Error("Sweet not found");
      }
      totalAmount += Number(sweet.sale_price) * item.quantity;
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      throw new Error("Invalid amount");
    }

    const saleRequest = new sql.Request(tx);
    const saleResult = await saleRequest
      .input("amount", sql.Decimal(10, 2), totalAmount)
      .query(
        "INSERT INTO dbo.sales (total_amount) VALUES (@amount); SELECT SCOPE_IDENTITY() AS id;",
      );

    const saleId = Number(saleResult.recordset[0].id);

    for (const item of normalizedItems) {
      const sweet = sweetMap.get(item.sweetId);
      const itemRequest = new sql.Request(tx);
      await itemRequest
        .input("saleId", sql.Int, saleId)
        .input("sweetId", sql.Int, item.sweetId)
        .input("quantity", sql.Int, item.quantity)
        .input("unitPrice", sql.Decimal(10, 2), Number(sweet.sale_price))
        .query(
          "INSERT INTO dbo.sale_items (sale_id, sweet_id, quantity, unit_price) VALUES (@saleId, @sweetId, @quantity, @unitPrice)",
        );

      const stockRequest = new sql.Request(tx);
      await stockRequest
        .input("sweetId", sql.Int, item.sweetId)
        .input("quantity", sql.Int, item.quantity)
        .query(
          "UPDATE dbo.sweets SET stock = stock - @quantity, sold_count = sold_count + @quantity WHERE id = @sweetId",
        );
    }

    await tx.commit();
    return res.json({ message: "Sale added", amount: totalAmount });
  } catch (error) {
    await tx.rollback();
    return res.status(400).json({ message: error.message });
  }
});

app.post("/api/clients/:id/pay", authGuard, async (req, res) => {
  try {
    const clientId = Number(req.params.id);
    const { amount, concept } = req.body || {};
    const parsedAmount = Number(amount);

    if (!Number.isInteger(clientId) || clientId <= 0) {
      return res.status(400).json({ message: "Invalid client id" });
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "Missing amount" });
    }

    const clientResult = await pool
      .request()
      .input("clientId", sql.Int, clientId)
      .query("SELECT id FROM dbo.clients WHERE id = @clientId");

    if (!clientResult.recordset[0]) {
      return res.status(404).json({ message: "Client not found" });
    }

    const settings = await getSettings();
    const normalized = Math.abs(parsedAmount) * -1;
    const pointsEarned = settings.rewards_enabled
      ? Number((Math.abs(parsedAmount) * settings.reward_factor).toFixed(2))
      : 0;

    await pool
      .request()
      .input("clientId", sql.Int, clientId)
      .input("concept", sql.NVarChar, concept || "Pago")
      .input("amount", sql.Decimal(10, 2), normalized)
      .input("points", sql.Decimal(10, 2), pointsEarned)
      .query(
        "INSERT INTO dbo.movements (client_id, concept, amount, points) VALUES (@clientId, @concept, @amount, @points)",
      );

    await pool
      .request()
      .input("clientId", sql.Int, clientId)
      .input("amount", sql.Decimal(10, 2), Math.abs(parsedAmount))
      .input("points", sql.Decimal(10, 2), pointsEarned)
      .query(
        "UPDATE dbo.clients SET total_debt = total_debt - @amount, points = points + @points WHERE id = @clientId",
      );

    try {
      const clientRes = await pool
        .request()
        .input("clientId", sql.Int, clientId)
        .query("SELECT id, name, total_debt, points, phone FROM dbo.clients WHERE id = @clientId");
      if (clientRes.recordset.length > 0) {
        const client = clientRes.recordset[0];
        sendWhatsAppTicketAutomatically(client, concept || "Pago", -Math.abs(parsedAmount));
      }
    } catch (e) {
      console.error("Error sending automatic payment ticket:", e.message);
    }

    return res.json({ message: "Payment registered" });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Payment failed" });
  }
});

app.get("/api/purchase-places", authGuard, async (req, res) => {
  const result = await pool
    .request()
    .query("SELECT id, name FROM dbo.purchase_places ORDER BY name ASC");
  return res.json(result.recordset);
});

app.post("/api/purchase-places", authGuard, async (req, res) => {
  const { name } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: "Missing place name" });
  }

  const inserted = await pool
    .request()
    .input("name", sql.NVarChar, String(name).trim()).query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.purchase_places WHERE name = @name)
        INSERT INTO dbo.purchase_places (name) VALUES (@name);
      SELECT TOP 1 id, name FROM dbo.purchase_places WHERE name = @name;
    `);

  return res.json(inserted.recordset[0]);
});

app.get("/api/package-purchases", authGuard, async (req, res) => {
  const result = await pool.request().query(`
    SELECT p.id,
           p.created_at,
           p.product_name,
           p.package_cost,
           p.sweet_id,
           pl.name AS place_name
    FROM dbo.package_purchases p
    JOIN dbo.purchase_places pl ON pl.id = p.place_id
    ORDER BY p.created_at DESC;
  `);
  return res.json(result.recordset);
});

app.post("/api/package-purchases", authGuard, async (req, res) => {
  const { sweetId, productName, placeId, packageCost } = req.body || {};
  const normalizedName = String(productName || "").trim();
  if (!placeId || !packageCost || (!sweetId && !normalizedName)) {
    return res.status(400).json({ message: "Missing fields" });
  }

  await pool
    .request()
    .input("sweetId", sql.Int, sweetId ? Number(sweetId) : null)
    .input("productName", sql.NVarChar, normalizedName)
    .input("placeId", sql.Int, Number(placeId))
    .input("packageCost", sql.Decimal(10, 2), Number(packageCost)).query(`
      INSERT INTO dbo.package_purchases (sweet_id, product_name, place_id, package_cost)
      VALUES (@sweetId, @productName, @placeId, @packageCost)
    `);

  return res.json({ message: "Package purchase added" });
});

app.get("/api/rewards", authGuard, async (req, res) => {
  try {
    const result = await pool
      .request()
      .query(`
        SELECT r.id, r.name, r.points_cost, COALESCE(s.stock, r.stock) AS stock, r.sweet_id
        FROM dbo.rewards r
        LEFT JOIN dbo.sweets s ON r.sweet_id = s.id
        ORDER BY r.name ASC
      `);
    return res.json(result.recordset);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/rewards", authGuard, async (req, res) => {
  try {
    const { name, pointsCost, stock, sweetId } = req.body || {};
    if (!name || pointsCost == null) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const normalizedStock = Number.isFinite(Number(stock)) ? Number(stock) : 0;
    const parsedSweetId = sweetId ? Number(sweetId) : null;
    await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("cost", sql.Decimal(10, 2), Number(pointsCost))
      .input("stock", sql.Int, normalizedStock)
      .input("sweetId", sql.Int, parsedSweetId)
      .query(
        "INSERT INTO dbo.rewards (name, points_cost, stock, sweet_id) VALUES (@name, @cost, @stock, @sweetId)"
      );
    return res.json({ message: "Reward added" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.put("/api/rewards/:id", authGuard, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, pointsCost, stock, sweetId } = req.body || {};
    if (!name || pointsCost == null) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const normalizedStock = Number.isFinite(Number(stock)) ? Number(stock) : 0;
    const parsedSweetId = sweetId ? Number(sweetId) : null;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, name)
      .input("cost", sql.Decimal(10, 2), Number(pointsCost))
      .input("stock", sql.Int, normalizedStock)
      .input("sweetId", sql.Int, parsedSweetId)
      .query(
        "UPDATE dbo.rewards SET name = @name, points_cost = @cost, stock = @stock, sweet_id = @sweetId WHERE id = @id"
      );
    return res.json({ message: "Reward updated" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.delete("/api/rewards/:id", authGuard, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM dbo.rewards WHERE id = @id");
    return res.json({ message: "Reward deleted" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.post("/api/clients/:id/redeem", authGuard, async (req, res) => {
  const clientId = Number(req.params.id);
  const { sweetId } = req.body || {};

  if (!clientId || !sweetId) {
    return res.status(400).json({ message: "Missing client or sweet ID" });
  }

  const settings = await getSettings();
  if (!settings.rewards_enabled) {
    return res.status(400).json({ message: "El sistema de recompensas está desactivado por la administración." });
  }

  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const clientResult = await new sql.Request(tx)
      .input("clientId", sql.Int, clientId)
      .query("SELECT id, name, points FROM dbo.clients WHERE id = @clientId");

    if (clientResult.recordset.length === 0) {
      await tx.rollback();
      return res.status(404).json({ message: "Client not found" });
    }
    const client = clientResult.recordset[0];
    const clientPoints = Number(client.points || 0);

    const sweetResult = await new sql.Request(tx)
      .input("sweetId", sql.Int, sweetId)
      .query("SELECT id, name, sale_price, stock FROM dbo.sweets WHERE id = @sweetId");

    if (sweetResult.recordset.length === 0) {
      await tx.rollback();
      return res.status(404).json({ message: "Sweet not found" });
    }
    const sweet = sweetResult.recordset[0];
    const pointsCost = Number(sweet.sale_price); // 1 point = 1 peso
    const sweetStock = Number(sweet.stock || 0);

    if (clientPoints < pointsCost) {
      await tx.rollback();
      return res.status(400).json({
        message: `Puntos insuficientes. El cliente tiene ${clientPoints.toFixed(1)} pts y el dulce cuesta ${pointsCost.toFixed(1)} pts.`,
      });
    }
    if (sweetStock <= 0) {
      await tx.rollback();
      return res.status(400).json({ message: "Dulce agotado (sin stock)." });
    }

    await new sql.Request(tx)
      .input("clientId", sql.Int, clientId)
      .input("cost", sql.Decimal(10, 2), pointsCost)
      .query("UPDATE dbo.clients SET points = CASE WHEN points - @cost < 0 THEN 0 ELSE points - @cost END WHERE id = @clientId");

    await new sql.Request(tx)
      .input("sweetId", sql.Int, sweetId)
      .query("UPDATE dbo.sweets SET stock = stock - 1, sold_count = sold_count + 1 WHERE id = @sweetId");

    await new sql.Request(tx)
      .input("clientId", sql.Int, clientId)
      .input("sweetId", sql.Int, sweetId)
      .input("cost", sql.Decimal(10, 2), pointsCost)
      .query("INSERT INTO dbo.redemptions (client_id, sweet_id, points_spent) VALUES (@clientId, @sweetId, @cost)");

    const concept = `Canje de dulce: ${sweet.name}`;
    await new sql.Request(tx)
      .input("clientId", sql.Int, clientId)
      .input("concept", concept)
      .input("amount", sql.Decimal(10, 2), 0)
      .input("points", sql.Decimal(10, 2), -pointsCost)
      .query("INSERT INTO dbo.movements (client_id, concept, amount, points) VALUES (@clientId, @concept, @amount, @points)");

    await tx.commit();
    return res.json({ message: "Sweet redeemed successfully" });
  } catch (error) {
    await tx.rollback();
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/clients/:id/redemptions", authGuard, async (req, res) => {
  try {
    const clientId = Number(req.params.id);
    const result = await pool
      .request()
      .input("clientId", sql.Int, clientId)
      .query(`
        SELECT r.id, r.points_spent, r.created_at, s.name AS reward_name
        FROM dbo.redemptions r
        JOIN dbo.sweets s ON r.sweet_id = s.id
        WHERE r.client_id = @clientId
        ORDER BY r.created_at DESC
      `);
    return res.json(result.recordset);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

async function getSettings() {
  try {
    const result = await pool.request().query("SELECT [key], [value] FROM dbo.settings");
    const settingsMap = {
      reward_factor: 0.10,
      rewards_enabled: true,
      whatsapp_enabled: false,
      whatsapp_gateway_url: "http://openwa:2785",
      whatsapp_api_key: "",
      whatsapp_session_id: "tiendita",
      whatsapp_default_country: "52",
    };
    result.recordset.forEach((row) => {
      if (row.key === "reward_factor") {
        settingsMap.reward_factor = parseFloat(row.value) || 0;
      } else if (row.key === "rewards_enabled") {
        settingsMap.rewards_enabled = row.value === "true";
      } else if (row.key === "whatsapp_enabled") {
        settingsMap.whatsapp_enabled = row.value === "true";
      } else if (row.key === "whatsapp_gateway_url") {
        settingsMap.whatsapp_gateway_url = row.value;
      } else if (row.key === "whatsapp_api_key") {
        settingsMap.whatsapp_api_key = row.value;
      } else if (row.key === "whatsapp_session_id") {
        settingsMap.whatsapp_session_id = row.value;
      } else if (row.key === "whatsapp_default_country") {
        settingsMap.whatsapp_default_country = row.value;
      }
    });
    return settingsMap;
  } catch (e) {
    console.error("Failed to load settings from DB, using defaults", e.message);
    return {
      reward_factor: 0.10,
      rewards_enabled: true,
      whatsapp_enabled: false,
      whatsapp_gateway_url: "http://openwa:2785",
      whatsapp_api_key: "",
      whatsapp_session_id: "tiendita",
      whatsapp_default_country: "52",
    };
  }
}

app.get("/api/settings", authGuard, async (req, res) => {
  try {
    const result = await pool.request().query("SELECT [key], [value] FROM dbo.settings");
    const settingsMap = {};
    result.recordset.forEach((row) => {
      settingsMap[row.key] = row.value;
    });
    if (settingsMap.reward_factor == null) settingsMap.reward_factor = "0.10";
    if (settingsMap.rewards_enabled == null) settingsMap.rewards_enabled = "true";
    if (settingsMap.whatsapp_enabled == null) settingsMap.whatsapp_enabled = "false";
    if (settingsMap.whatsapp_gateway_url == null) settingsMap.whatsapp_gateway_url = "http://openwa:2785";
    if (settingsMap.whatsapp_api_key == null) settingsMap.whatsapp_api_key = "";
    if (settingsMap.whatsapp_session_id == null) settingsMap.whatsapp_session_id = "tiendita";
    if (settingsMap.whatsapp_default_country == null) settingsMap.whatsapp_default_country = "52";
    return res.json(settingsMap);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/api/settings", authGuard, async (req, res) => {
  try {
    const body = req.body || {};
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      for (const [key, value] of Object.entries(body)) {
        await new sql.Request(tx)
          .input("key", sql.NVarChar, key)
          .input("val", sql.NVarChar, String(value))
          .query(`
            IF EXISTS (SELECT 1 FROM dbo.settings WHERE [key] = @key)
              UPDATE dbo.settings SET [value] = @val WHERE [key] = @key
            ELSE
              INSERT INTO dbo.settings ([key], [value]) VALUES (@key, @val)
          `);
      }
      await tx.commit();
      return res.json({ message: "Settings updated" });
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get("/api/redemptions/stats", authGuard, async (req, res) => {
  try {
    const listResult = await pool.request().query(`
      SELECT r.id, r.points_spent, r.created_at, 
             c.name AS client_name, s.name AS sweet_name
      FROM dbo.redemptions r
      JOIN dbo.clients c ON r.client_id = c.id
      JOIN dbo.sweets s ON r.sweet_id = s.id
      ORDER BY r.created_at DESC
    `);
    
    const summaryResult = await pool.request().query(`
      SELECT COUNT(*) AS total_count, COALESCE(SUM(points_spent), 0) AS total_points
      FROM dbo.redemptions
    `);

    const popularResult = await pool.request().query(`
      SELECT s.name AS sweet_name, COUNT(*) AS count, COALESCE(SUM(r.points_spent), 0) AS total_points
      FROM dbo.redemptions r
      JOIN dbo.sweets s ON r.sweet_id = s.id
      GROUP BY s.name
      ORDER BY count DESC
    `);

    return res.json({
      redemptions: listResult.recordset,
      totals: summaryResult.recordset[0] || { total_count: 0, total_points: 0 },
      bySweet: popularResult.recordset
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Helper to communicate with OpenWA
async function callOpenWA(path, method = "GET", body = null) {
  const settings = await getSettings();
  const gatewayUrl = settings.whatsapp_gateway_url || "http://openwa:2785";
  const apiKey = settings.whatsapp_api_key || "tiendita_master_key_2026";

  const url = `${gatewayUrl}${path}`;
  const headers = {
    "X-API-Key": apiKey,
    "Content-Type": "application/json"
  };

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenWA responded with ${res.status}: ${errText}`);
  }
  return await res.json();
}

// Helper to get or create a session by name, returning its database UUID
async function resolveSessionId(name) {
  try {
    const sessions = await callOpenWA("/api/sessions", "GET");
    const found = sessions.find(s => s.name === name);
    let sessionId;
    if (found) {
      sessionId = found.id;
    } else {
      const newSession = await callOpenWA("/api/sessions", "POST", { name });
      sessionId = newSession.id;
    }

    return sessionId;
  } catch (error) {
    console.error(`Failed to resolve session ID for name ${name}:`, error.message);
    throw error;
  }
}

// Format phone number to WhatsApp international standard
function formatWhatsAppNumber(phone, defaultPrefix = "52") {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return null;
  if (cleaned.length === 10) {
    cleaned = `${defaultPrefix}${cleaned}`;
  }
  // If it's a Mexican number (starts with 52) and is 12 digits, format as 521 + 10 digits mobile number
  if (cleaned.startsWith("52") && cleaned.length === 12) {
    cleaned = "521" + cleaned.substring(2);
  }
  return cleaned;
}

// Send automated ticket text
async function sendWhatsAppTicketAutomatically(client, concept, amount, pointsUsed = 0, items = []) {
  try {
    const settings = await getSettings();
    if (!settings.whatsapp_enabled) {
      console.log("Automatic WhatsApp ticket disabled by settings.");
      return;
    }
    if (!client.phone) {
      console.log(`Client ${client.name} has no phone registered. Skipping ticket.`);
      return;
    }

    const cleanPhone = formatWhatsAppNumber(client.phone, settings.whatsapp_default_country);
    if (!cleanPhone) {
      console.log(`Failed to format phone for client ${client.name}.`);
      return;
    }

    const dateStr = new Date().toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    const displayAmount = Math.abs(amount);

    let lines = [];
    lines.push(`*Ticket de movimiento - Tiendita*`);
    lines.push(`📅 _Fecha: ${dateStr}_`);
    lines.push(``);
    lines.push(`Hola *${client.name}*, te comparto el movimiento registrado en tu cuenta:`);
    lines.push(``);
    lines.push(`*Detalle:* ${concept}`);
    lines.push(`*Monto:* $${Number(displayAmount).toFixed(2)}`);
    if (pointsUsed > 0) {
      lines.push(`*Puntos Usados:* -${Number(pointsUsed).toFixed(2)} pts`);
    }
    lines.push(``);

    if (Array.isArray(items) && items.length > 0) {
      lines.push(`*Detalle de compra:*`);
      items.forEach(item => {
        lines.push(`• ${item.quantity}x ${item.name} ($${Number(item.unitPrice).toFixed(2)} c/u)`);
      });
      lines.push(``);
    }

    lines.push(`───────────────────`);

    let debtLabel = "*Saldo Total Actual:*";
    let debtValue = Number(client.total_debt);
    if (debtValue < 0) {
      debtLabel = "*Saldo a favor:*";
      debtValue = Math.abs(debtValue);
    }

    lines.push(`💰 ${debtLabel} *$${debtValue.toFixed(2)}*`);
    lines.push(`⭐ *Puntos Disponibles:* ${Number(client.points || 0).toFixed(1)} pts`);
    lines.push(``);
    lines.push(`¡Gracias por tu preferencia! 🙌`);

    const message = lines.join("\n");

    const sessionName = settings.whatsapp_session_id || "tiendita";
    const sessionId = await resolveSessionId(sessionName);
    
    await callOpenWA(`/api/sessions/${sessionId}/messages/send-text`, "POST", {
      chatId: `${cleanPhone}@c.us`,
      text: message
    });
    console.log(`WhatsApp ticket successfully sent automatically to ${cleanPhone}@c.us`);
  } catch (error) {
    console.error("Error running sendWhatsAppTicketAutomatically:", error.message);
  }
}

// WhatsApp endpoints
app.get("/api/whatsapp/status", authGuard, async (req, res) => {
  try {
    const settings = await getSettings();
    const sessionName = settings.whatsapp_session_id || "tiendita";
    try {
      const sessionId = await resolveSessionId(sessionName);
      const data = await callOpenWA(`/api/sessions/${sessionId}`);
      return res.json({ status: data.status || "UNKNOWN", data });
    } catch (err) {
      return res.json({ status: "DISCONNECTED", message: err.message });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/whatsapp/session/start", authGuard, async (req, res) => {
  try {
    const settings = await getSettings();
    const sessionName = settings.whatsapp_session_id || "tiendita";
    
    const sessionId = await resolveSessionId(sessionName);
    const result = await callOpenWA(`/api/sessions/${sessionId}/start`, "POST");
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/whatsapp/session/qr", authGuard, async (req, res) => {
  try {
    const settings = await getSettings();
    const sessionName = settings.whatsapp_session_id || "tiendita";
    try {
      const sessionId = await resolveSessionId(sessionName);
      const data = await callOpenWA(`/api/sessions/${sessionId}/qr`);
      return res.json(data);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/whatsapp/session/logout", authGuard, async (req, res) => {
  try {
    const settings = await getSettings();
    const sessionName = settings.whatsapp_session_id || "tiendita";
    try {
      const sessionId = await resolveSessionId(sessionName);
      const result = await callOpenWA(`/api/sessions/${sessionId}/stop`, "POST");
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/clients/:id/whatsapp-statement", authGuard, async (req, res) => {
  try {
    const clientId = Number(req.params.id);
    const clientRes = await pool
      .request()
      .input("clientId", sql.Int, clientId)
      .query("SELECT id, name, total_debt, points, phone FROM dbo.clients WHERE id = @clientId");

    if (!clientRes.recordset.length) {
      return res.status(404).json({ message: "Client not found" });
    }

    const client = clientRes.recordset[0];
    if (!client.phone) {
      return res.status(400).json({ message: "Client has no registered phone number" });
    }

    const cleanPhone = formatWhatsAppNumber(client.phone);
    if (!cleanPhone) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    const message = await generateStatementMessage(client);

    const settings = await getSettings();
    const sessionName = settings.whatsapp_session_id || "tiendita";
    const sessionId = await resolveSessionId(sessionName);
    
    await callOpenWA(`/api/sessions/${sessionId}/messages/send-text`, "POST", {
      chatId: `${cleanPhone}@c.us`,
      text: message
    });

    return res.json({ message: "WhatsApp statement sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/whatsapp/send-all-statements", authGuard, async (req, res) => {
  try {
    const clientsRes = await pool.request().query(`
      SELECT id, name, total_debt, points, phone
      FROM dbo.clients
      WHERE total_debt > 0 AND phone IS NOT NULL AND phone != ''
    `);
    
    const clients = clientsRes.recordset;
    if (clients.length === 0) {
      return res.json({ message: "No hay clientes con saldo deudor y teléfono registrado.", count: 0 });
    }
    
    sendStatementsInBackground(clients);
    
    return res.json({ message: `Proceso iniciado para enviar ${clients.length} cuentas.`, count: clients.length });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

async function sendStatementsInBackground(clients) {
  console.log(`Starting bulk statement send in background for ${clients.length} clients...`);
  try {
    const settings = await getSettings();
    const sessionName = settings.whatsapp_session_id || "tiendita";
    
    let sessionId;
    try {
      sessionId = await resolveSessionId(sessionName);
    } catch (e) {
      console.error("Failed to resolve sessionId for bulk send:", e.message);
      return;
    }

    for (const client of clients) {
      try {
        const cleanPhone = formatWhatsAppNumber(client.phone, settings.whatsapp_default_country);
        if (!cleanPhone) continue;

        const message = await generateStatementMessage(client);

        await callOpenWA(`/api/sessions/${sessionId}/messages/send-text`, "POST", {
          chatId: `${cleanPhone}@c.us`,
          text: message
        });
        console.log(`Bulk sent WhatsApp ticket successfully to ${cleanPhone}@c.us (${client.name})`);

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`Failed to bulk send statement to client ${client.name}:`, err.message);
      }
    }
    console.log("Bulk statement send in background completed.");
  } catch (error) {
    console.error("Error in sendStatementsInBackground worker:", error.message);
  }
}

app.post("/api/whatsapp/webhook", (req, res) => {
  // WhatsApp interactive bot disabled per user request
  return res.sendStatus(200);
});

async function findClientByWhatsAppPhone(waPhone) {
  let searchPhone = waPhone;
  if (waPhone.startsWith("521") && waPhone.length === 13) {
    searchPhone = waPhone.substring(3);
  } else if (waPhone.startsWith("52") && waPhone.length === 12) {
    searchPhone = waPhone.substring(2);
  } else if (waPhone.length > 10) {
    searchPhone = waPhone.substring(waPhone.length - 10);
  }

  const result = await pool.request()
    .input("searchPhone", sql.NVarChar, `%${searchPhone}`)
    .query(`
      SELECT id, name, total_debt, points, phone
      FROM dbo.clients
      WHERE phone LIKE @searchPhone OR REPLACE(REPLACE(phone, ' ', ''), '-', '') LIKE @searchPhone
    `);
  return result.recordset[0];
}

async function generateStatementMessage(client) {
  const movementsResult = await pool.request()
    .input("clientId", sql.Int, client.id)
    .query(`
      SELECT m.id, m.concept, m.amount, m.points, m.created_at
      FROM dbo.movements m
      WHERE m.client_id = @clientId
      ORDER BY m.created_at DESC
    `);

  const movements = movementsResult.recordset;
  
  const itemsResult = await pool.request()
    .input("clientId", sql.Int, client.id)
    .query(`
      SELECT mi.movement_id, mi.quantity, mi.unit_price, s.name
      FROM dbo.movement_items mi
      JOIN dbo.sweets s ON mi.sweet_id = s.id
      JOIN dbo.movements m ON mi.movement_id = m.id
      WHERE m.client_id = @clientId
    `);

  const itemsMap = new Map();
  itemsResult.recordset.forEach((row) => {
    if (!itemsMap.has(row.movement_id)) {
      itemsMap.set(row.movement_id, []);
    }
    itemsMap.get(row.movement_id).push(row);
  });

  let totalDebt = Number(client.total_debt);
  const pendingPurchases = [];

  if (totalDebt > 0) {
    let accumulated = 0;
    for (const m of movements) {
      const val = Number(m.amount);
      if (val > 0) {
        const mItems = itemsMap.get(m.id) || [];
        const matchedItems = mItems.map(item => ({
          quantity: item.quantity,
          name: item.name,
          unit_price: Number(item.unit_price)
        }));

        if (accumulated + val <= totalDebt) {
          pendingPurchases.push({ ...m, owed_amount: val, items: matchedItems });
          accumulated += val;
        } else {
          const partial = Number((totalDebt - accumulated).toFixed(2));
          if (partial > 0) {
            pendingPurchases.push({ ...m, owed_amount: partial, items: matchedItems });
            accumulated += partial;
          }
        }
        if (accumulated >= totalDebt) {
          break;
        }
      }
    }
  }

  const dateStr = new Date().toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  let lines = [];
  lines.push(`*Resumen de cuenta - Tiendita*`);
  lines.push(`📅 _Fecha: ${dateStr}_`);
  lines.push(``);
  lines.push(`Hola *${client.name}*, te comparto el estado actual de tu cuenta:`);
  lines.push(``);

  if (pendingPurchases.length > 0) {
    lines.push(`*Detalle de compras pendientes:*`);
    
    const purchasesByDate = {};
    pendingPurchases.forEach(m => {
      const mDate = new Date(m.created_at).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit"
      });
      if (!purchasesByDate[mDate]) {
        purchasesByDate[mDate] = [];
      }
      purchasesByDate[mDate].push(m);
    });

    const dateKeys = Object.keys(purchasesByDate);
    dateKeys.forEach((mDate, idx) => {
      if (idx > 0) {
        lines.push(``); // Add an empty line between dates
      }

      const list = purchasesByDate[mDate];
      let totalAmount = 0;
      let totalOwedAmount = 0;
      const mergedItemsMap = {};

      list.forEach(m => {
        totalAmount += Number(m.amount);
        totalOwedAmount += Number(m.owed_amount !== undefined ? m.owed_amount : m.amount);
        
        if (m.items && m.items.length > 0) {
          m.items.forEach(item => {
            if (!mergedItemsMap[item.name]) {
              mergedItemsMap[item.name] = {
                quantity: 0,
                unit_price: Number(item.unit_price),
                name: item.name
              };
            }
            mergedItemsMap[item.name].quantity += item.quantity;
          });
        }
      });

      const mergedItems = Object.values(mergedItemsMap);
      const partialStr = (totalOwedAmount < totalAmount)
        ? ` (pendiente: $${totalOwedAmount.toFixed(2)})`
        : "";
      
      const concept = list.length === 1 ? list[0].concept : "Compra";

      lines.push(`• *${mDate}*:`);
      lines.push(`  - ${concept} - $${totalAmount.toFixed(2)}${partialStr}:`);
      
      if (mergedItems.length > 0) {
        mergedItems.forEach(item => {
          const lineTotal = item.quantity * item.unit_price;
          lines.push(`    • ${item.quantity}x ${item.name} ($${item.unit_price.toFixed(2)} c/u) - $${lineTotal.toFixed(2)}`);
        });
      }
    });
  } else {
    lines.push(`No tienes compras pendientes. ¡Tu saldo está al día!`);
  }

  lines.push(``);
  lines.push(`───────────────────`);

  let debtLabel = "*Saldo Total:*";
  let debtValue = Number(client.total_debt);
  if (debtValue < 0) {
    debtLabel = "*Saldo a favor:*";
    debtValue = Math.abs(debtValue);
  }

  lines.push(`💰 ${debtLabel} *$${debtValue.toFixed(2)}*`);
  lines.push(`⭐ *Puntos Disponibles:* ${Number(client.points || 0).toFixed(1)} pts`);
  lines.push(``);
  lines.push(`¡Gracias por tu preferencia! 🙌`);

  return lines.join("\n");
}

app.get("/health", (req, res) => {
  return res.json({ status: "ok" });
});

connectWithRetry()
  .then(runSchema)
  .then(runSeed)
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Tiendita backend running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start backend", error);
    process.exit(1);
  });
