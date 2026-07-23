IF DB_ID('tiendita') IS NULL
BEGIN
  CREATE DATABASE tiendita;
END;
GO

USE tiendita;
GO

IF OBJECT_ID('dbo.sweets', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.sweets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(120) NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    sold_count INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
END;
GO

IF COL_LENGTH('dbo.sweets', 'stock') IS NULL
BEGIN
  ALTER TABLE dbo.sweets ADD stock INT NOT NULL DEFAULT 0;
END;
GO

IF COL_LENGTH('dbo.sweets', 'sold_count') IS NULL
BEGIN
  ALTER TABLE dbo.sweets ADD sold_count INT NOT NULL DEFAULT 0;
END;
GO

IF OBJECT_ID('dbo.clients', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.clients (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(120) NOT NULL,
    total_debt DECIMAL(10,2) NOT NULL DEFAULT 0,
    points DECIMAL(10,2) NOT NULL DEFAULT 0,
    phone NVARCHAR(20) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
END;
GO

IF COL_LENGTH('dbo.clients', 'points') IS NULL
BEGIN
  ALTER TABLE dbo.clients ADD points DECIMAL(10,2) NOT NULL DEFAULT 0;
END;
GO

IF COL_LENGTH('dbo.clients', 'phone') IS NULL
BEGIN
  ALTER TABLE dbo.clients ADD phone NVARCHAR(20) NULL;
END;
GO


IF OBJECT_ID('dbo.movements', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.movements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    client_id INT NOT NULL,
    concept NVARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_movements_client FOREIGN KEY (client_id) REFERENCES dbo.clients(id)
  );
END;
GO

IF OBJECT_ID('dbo.movement_items', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.movement_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    movement_id INT NOT NULL,
    sweet_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_movement_items_movement FOREIGN KEY (movement_id) REFERENCES dbo.movements(id),
    CONSTRAINT fk_movement_items_sweet FOREIGN KEY (sweet_id) REFERENCES dbo.sweets(id)
  );
END;
GO

IF OBJECT_ID('dbo.sales', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.sales (
    id INT IDENTITY(1,1) PRIMARY KEY,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
END;
GO

IF OBJECT_ID('dbo.sale_items', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.sale_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sale_id INT NOT NULL,
    sweet_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES dbo.sales(id),
    CONSTRAINT fk_sale_items_sweet FOREIGN KEY (sweet_id) REFERENCES dbo.sweets(id)
  );
END;
GO

IF OBJECT_ID('dbo.purchase_places', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.purchase_places (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(120) NOT NULL UNIQUE,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
END;
GO

IF OBJECT_ID('dbo.package_purchases', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.package_purchases (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sweet_id INT NULL,
    product_name NVARCHAR(120) NOT NULL,
    place_id INT NOT NULL,
    package_cost DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_package_purchases_sweet FOREIGN KEY (sweet_id) REFERENCES dbo.sweets(id),
    CONSTRAINT fk_package_purchases_place FOREIGN KEY (place_id) REFERENCES dbo.purchase_places(id)
  );
END;
GO

IF OBJECT_ID('dbo.rewards', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.rewards (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(120) NOT NULL,
    points_cost DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    sweet_id INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_rewards_sweet FOREIGN KEY (sweet_id) REFERENCES dbo.sweets(id)
  );
END;
GO

IF OBJECT_ID('dbo.rewards', 'U') IS NOT NULL AND COL_LENGTH('dbo.rewards', 'sweet_id') IS NULL
BEGIN
  ALTER TABLE dbo.rewards ADD sweet_id INT NULL;
  ALTER TABLE dbo.rewards ADD CONSTRAINT fk_rewards_sweet FOREIGN KEY (sweet_id) REFERENCES dbo.sweets(id);
END;
GO

IF OBJECT_ID('dbo.redemptions', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.redemptions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    client_id INT NOT NULL,
    reward_id INT NULL,
    sweet_id INT NULL,
    points_spent DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_redemptions_client FOREIGN KEY (client_id) REFERENCES dbo.clients(id),
    CONSTRAINT fk_redemptions_sweet FOREIGN KEY (sweet_id) REFERENCES dbo.sweets(id)
  );
END;
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_redemptions_reward')
BEGIN
  ALTER TABLE dbo.redemptions DROP CONSTRAINT fk_redemptions_reward;
END;
GO

IF COL_LENGTH('dbo.redemptions', 'sweet_id') IS NULL AND OBJECT_ID('dbo.redemptions', 'U') IS NOT NULL
BEGIN
  ALTER TABLE dbo.redemptions ADD sweet_id INT NULL;
  ALTER TABLE dbo.redemptions ADD CONSTRAINT fk_redemptions_sweet FOREIGN KEY (sweet_id) REFERENCES dbo.sweets(id);
  ALTER TABLE dbo.redemptions ALTER COLUMN reward_id INT NULL;
END;
GO

IF COL_LENGTH('dbo.movements', 'points') IS NULL AND OBJECT_ID('dbo.movements', 'U') IS NOT NULL
BEGIN
  ALTER TABLE dbo.movements ADD points DECIMAL(10,2) NOT NULL DEFAULT 0;
END;
GO

IF OBJECT_ID('dbo.settings', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.settings (
    [key] NVARCHAR(50) PRIMARY KEY,
    [value] NVARCHAR(200) NOT NULL
  );
  INSERT INTO dbo.settings ([key], [value]) VALUES ('reward_factor', '0.10');
  INSERT INTO dbo.settings ([key], [value]) VALUES ('rewards_enabled', 'true');
END;
GO

-- Configuracion de WhatsApp
IF OBJECT_ID('dbo.settings', 'U') IS NOT NULL
BEGIN
  IF NOT EXISTS (SELECT 1 FROM dbo.settings WHERE [key] = 'whatsapp_enabled')
    INSERT INTO dbo.settings ([key], [value]) VALUES ('whatsapp_enabled', 'false');

  IF NOT EXISTS (SELECT 1 FROM dbo.settings WHERE [key] = 'whatsapp_gateway_url')
    INSERT INTO dbo.settings ([key], [value]) VALUES ('whatsapp_gateway_url', 'http://openwa:2785');

  IF NOT EXISTS (SELECT 1 FROM dbo.settings WHERE [key] = 'whatsapp_api_key')
    INSERT INTO dbo.settings ([key], [value]) VALUES ('whatsapp_api_key', '');

  IF NOT EXISTS (SELECT 1 FROM dbo.settings WHERE [key] = 'whatsapp_session_id')
    INSERT INTO dbo.settings ([key], [value]) VALUES ('whatsapp_session_id', 'tiendita');

  IF NOT EXISTS (SELECT 1 FROM dbo.settings WHERE [key] = 'whatsapp_default_country')
    INSERT INTO dbo.settings ([key], [value]) VALUES ('whatsapp_default_country', '52');
END;
GO



