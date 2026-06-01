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
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );
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
