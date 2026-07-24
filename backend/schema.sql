-- Esquema de Base de Datos para Tiendita (PostgreSQL / Vercel Postgres)

CREATE TABLE IF NOT EXISTS sweets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  sold_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  total_debt DECIMAL(10,2) NOT NULL DEFAULT 0,
  points DECIMAL(10,2) NOT NULL DEFAULT 0,
  phone VARCHAR(20) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movements (
  id SERIAL PRIMARY KEY,
  client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  concept VARCHAR(200) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  points DECIMAL(10,2) NOT NULL DEFAULT 0,
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

ALTER TABLE settings ALTER COLUMN value TYPE TEXT;

INSERT INTO settings (key, value) VALUES ('reward_factor', '0.10') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('rewards_enabled', 'true') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('whatsapp_enabled', 'true') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('whatsapp_provider', 'meta') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('whatsapp_gateway_url', 'http://openwa:2785') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('whatsapp_api_key', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('whatsapp_session_id', 'tiendita') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('whatsapp_default_country', '52') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('meta_whatsapp_token', 'EAAgKR2bTkxoBSOkaIPTz8ZAiZALqqxWOtfhu6nRuRzf5vw5mZAQNFNjnIBD4SZCa1FLjzh1P47HPURgZCzedgZBNgpVnvZA1hyxVRTrmtqJfhn0qiuZAm1l8K2U4ifFloVJZAjOmx6YQWpkxKjJIEPmwrJsMrUWMptZAM6nGTN9hpwhOFQwBP1rZBVDXv1t3M52QJg15tgRPNpO2HLxTiHWbdyy45x4ZBfLzllHJAPWNvpG706scv5lshaliDHI1YWQ0BI4XNgP91jo8xEy7HrgdSX2koWZC5pcaTnS3LJfgZD') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('meta_phone_number_id', '479295378592460') ON CONFLICT (key) DO NOTHING;
