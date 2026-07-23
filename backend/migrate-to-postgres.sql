-- Script de migración de datos a PostgreSQL / Vercel Postgres

-- 1. Ejecutar estructura de tablas
\i schema.sql;

-- 2. Asegurar configuración inicial en la tabla settings
INSERT INTO settings (key, value) VALUES
  ('reward_factor', '0.10'),
  ('rewards_enabled', 'true'),
  ('whatsapp_enabled', 'false'),
  ('whatsapp_provider', 'meta'),
  ('whatsapp_gateway_url', 'http://openwa:2785'),
  ('whatsapp_api_key', ''),
  ('whatsapp_session_id', 'tiendita'),
  ('whatsapp_default_country', '52'),
  ('meta_whatsapp_token', ''),
  ('meta_phone_number_id', '')
ON CONFLICT (key) DO NOTHING;
