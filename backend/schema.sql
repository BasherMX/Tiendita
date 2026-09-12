-- Esquema de Base de Datos para Tiendita (PostgreSQL / Vercel Postgres)

CREATE TABLE IF NOT EXISTS sweets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  sold_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  total_debt DECIMAL(10,2) NOT NULL DEFAULT 0,
  points DECIMAL(10,2) NOT NULL DEFAULT 0,
  phone VARCHAR(20) NULL,
  credit_limit DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movements (
  id SERIAL PRIMARY KEY,
  client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  concept VARCHAR(200) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  points DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movement_items (
  id SERIAL PRIMARY KEY,
  movement_id INT NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
  sweet_id INT NOT NULL REFERENCES sweets(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  sweet_id INT NOT NULL REFERENCES sweets(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_places (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS package_purchases (
  id SERIAL PRIMARY KEY,
  sweet_id INT NULL REFERENCES sweets(id),
  product_name VARCHAR(120) NOT NULL,
  place_id INT NOT NULL REFERENCES purchase_places(id),
  package_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  points_cost DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  sweet_id INT NULL REFERENCES sweets(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS redemptions (
  id SERIAL PRIMARY KEY,
  client_id INT NOT NULL REFERENCES clients(id),
  reward_id INT NULL,
  sweet_id INT NULL REFERENCES sweets(id),
  points_spent DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL
);

-- Migraciones automáticas idempotentes para bases de datos existentes
ALTER TABLE settings ALTER COLUMN value TYPE TEXT;
ALTER TABLE sweets ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE movements ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'cash';
ALTER TABLE movements ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'cash';

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_movements_client ON movements(client_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON movements(created_at);
CREATE INDEX IF NOT EXISTS idx_movement_items_mov ON movement_items(movement_id);
CREATE INDEX IF NOT EXISTS idx_movement_items_sweet ON movement_items(sweet_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sweet ON sale_items(sweet_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sweets_stock ON sweets(stock);
CREATE INDEX IF NOT EXISTS idx_sweets_active_stock ON sweets(is_active, stock);
CREATE INDEX IF NOT EXISTS idx_package_purchases_place ON package_purchases(place_id);

-- Valores por defecto en Settings
INSERT INTO settings (key, value) VALUES ('reward_factor', '0.10') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('rewards_enabled', 'true') ON CONFLICT (key) DO NOTHING;
CREATE TABLE IF NOT EXISTS whatsapp_queue (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'FAILED'
  message_id VARCHAR(120),
  error_message TEXT,
  unique_tag VARCHAR(100) UNIQUE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status ON whatsapp_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_unique_tag ON whatsapp_queue(unique_tag);

