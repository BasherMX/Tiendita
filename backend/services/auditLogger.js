import { query } from "../server.js";

// Lista de campos sensibles que deben ser enmascarados en logs
const SENSITIVE_KEYS = new Set([
  "password",
  "admin_password",
  "current_password",
  "new_password",
  "token",
  "meta_whatsapp_token",
  "whatsapp_api_key",
  "authorization",
  "secret",
]);

/**
 * Sanitiza recursivamente objetos y arrays enmascarando contraseñas y tokens.
 */
export function sanitizeData(data, depth = 0) {
  if (depth > 5 || data === null || data === undefined) return data;

  if (typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeData(value, depth + 1);
    } else if (typeof value === "string" && value.length > 2000) {
      sanitized[key] = value.slice(0, 2000) + "... [TRUNCATED]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Obtiene la dirección IP real de la solicitud, soportando proxies y Vercel.
 */
export function getClientIp(req) {
  if (!req) return null;
  const forwarded = req.headers?.["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || null;
}

/**
 * Registra una actividad de forma estructurada en la tabla system_logs.
 * No arroja excepciones para no interrumpir el flujo principal de la aplicación.
 */
export async function logActivity({
  req = null,
  category = "SYSTEM",
  action_type = "GENERAL_ACTION",
  severity = "INFO",
  actor_type = "ADMIN",
  actor_id = null,
  ip_address = null,
  user_agent = null,
  entity_type = null,
  entity_id = null,
  description = "",
  details = null,
  status = "SUCCESS",
  latency_ms = null,
}) {
  try {
    const finalIp = ip_address || getClientIp(req);
    const finalUserAgent = user_agent || (req?.headers ? req.headers["user-agent"] : null);
    
    let finalActorType = actor_type;
    let finalActorId = actor_id;

    if (req) {
      if (req.user) {
        finalActorType = "ADMIN";
        finalActorId = req.user.username || req.user.id || "admin";
      } else if (req.headers?.["x-client-public"] || req.originalUrl?.includes("/api/public/")) {
        finalActorType = "CLIENT_PUBLIC";
      }
    }

    const sanitizedDetails = details ? sanitizeData(details) : null;
    const detailsJson = sanitizedDetails ? JSON.stringify(sanitizedDetails) : null;

    const queryText = `
      INSERT INTO system_logs (
        category,
        action_type,
        severity,
        actor_type,
        actor_id,
        ip_address,
        user_agent,
        entity_type,
        entity_id,
        description,
        details,
        status,
        latency_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13)
      RETURNING id
    `;

    const values = [
      category,
      action_type,
      severity,
      finalActorType,
      finalActorId ? String(finalActorId) : null,
      finalIp,
      finalUserAgent,
      entity_type,
      entity_id ? String(entity_id) : null,
      description,
      detailsJson,
      status,
      latency_ms ? Math.round(latency_ms) : null,
    ];

    const res = await query(queryText, values);
    return res.rows[0]?.id;
  } catch (err) {
    console.error("[AuditLogger] Error registrando log en BD:", err.message);
    return null;
  }
}
