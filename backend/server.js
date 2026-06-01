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
      "SELECT id, name, total_debt FROM dbo.clients ORDER BY total_debt DESC",
    );
  return res.json(result.recordset);
});

app.post("/api/clients", authGuard, async (req, res) => {
  const { name } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: "Missing name" });
  }

  await pool
    .request()
    .input("name", sql.NVarChar, name)
    .query("INSERT INTO dbo.clients (name) VALUES (@name)");

  return res.json({ message: "Client created" });
});

app.put("/api/clients/:id", authGuard, async (req, res) => {
  const id = Number(req.params.id);
  const { name, totalDebt } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: "Missing name" });
  }

  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const currentClient = await new sql.Request(tx)
      .input("id", sql.Int, id)
      .query(
        "SELECT TOP 1 id, name, total_debt FROM dbo.clients WHERE id = @id",
      );

    if (!currentClient.recordset.length) {
      await tx.rollback();
      return res.status(404).json({ message: "Client not found" });
    }

    const previousDebt = Number(currentClient.recordset[0].total_debt || 0);
    const normalizedDebt = Number.isFinite(Number(totalDebt))
      ? Number(totalDebt)
      : 0;

    await new sql.Request(tx)
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, name)
      .input("debt", sql.Decimal(10, 2), normalizedDebt)
      .query(
        "UPDATE dbo.clients SET name = @name, total_debt = @debt WHERE id = @id",
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

app.get("/api/clients/:id/movements", authGuard, async (req, res) => {
  const clientId = Number(req.params.id);
  const result = await pool
    .request()
    .input("clientId", sql.Int, clientId)
    .query(
      "SELECT id, concept, amount, created_at FROM dbo.movements WHERE client_id = @clientId ORDER BY created_at DESC",
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
          SELECT TOP 1 id, client_id, amount
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

      await new sql.Request(tx)
        .input("clientId", sql.Int, clientId)
        .input("amount", sql.Decimal(10, 2), Number(movement.amount))
        .query(
          "UPDATE dbo.clients SET total_debt = total_debt - @amount WHERE id = @clientId",
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

  if (Array.isArray(items) && items.length > 0) {
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

    const ids = Array.from(
      new Set(normalizedItems.map((item) => item.sweetId)),
    );

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

      const movementRequest = new sql.Request(tx);
      const movementResult = await movementRequest
        .input("clientId", sql.Int, clientId)
        .input("concept", sql.NVarChar, concept || "Compra")
        .input("amount", sql.Decimal(10, 2), totalAmount)
        .query(
          "INSERT INTO dbo.movements (client_id, concept, amount) VALUES (@clientId, @concept, @amount); SELECT SCOPE_IDENTITY() AS id;",
        );

      const movementId = Number(movementResult.recordset[0].id);

      for (const item of normalizedItems) {
        const sweet = sweetMap.get(item.sweetId);
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

      const debtRequest = new sql.Request(tx);
      await debtRequest
        .input("clientId", sql.Int, clientId)
        .input("amount", sql.Decimal(10, 2), totalAmount)
        .query(
          "UPDATE dbo.clients SET total_debt = total_debt + @amount WHERE id = @clientId",
        );

      await tx.commit();
      return res.json({ message: "Purchase added", amount: totalAmount });
    } catch (error) {
      await tx.rollback();
      return res.status(400).json({ message: error.message });
    }
  }

  if (!amount) {
    return res.status(400).json({ message: "Missing amount" });
  }

  await pool
    .request()
    .input("clientId", sql.Int, clientId)
    .input("concept", sql.NVarChar, concept || "Compra")
    .input("amount", sql.Decimal(10, 2), Number(amount))
    .query(
      "INSERT INTO dbo.movements (client_id, concept, amount) VALUES (@clientId, @concept, @amount)",
    );

  await pool
    .request()
    .input("clientId", sql.Int, clientId)
    .input("amount", sql.Decimal(10, 2), Number(amount))
    .query(
      "UPDATE dbo.clients SET total_debt = total_debt + @amount WHERE id = @clientId",
    );

  return res.json({ message: "Purchase added" });
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

    const normalized = Math.abs(parsedAmount) * -1;

    await pool
      .request()
      .input("clientId", sql.Int, clientId)
      .input("concept", sql.NVarChar, concept || "Pago")
      .input("amount", sql.Decimal(10, 2), normalized)
      .query(
        "INSERT INTO dbo.movements (client_id, concept, amount) VALUES (@clientId, @concept, @amount)",
      );

    await pool
      .request()
      .input("clientId", sql.Int, clientId)
      .input("amount", sql.Decimal(10, 2), Math.abs(parsedAmount))
      .query(
        "UPDATE dbo.clients SET total_debt = total_debt - @amount WHERE id = @clientId",
      );

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
