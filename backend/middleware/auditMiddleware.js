import { logActivity } from "../services/auditLogger.js";

/**
 * Mapea una ruta y método HTTP a una categoría lógica del sistema.
 */
function inferCategory(url) {
  if (url.includes("/api/login") || url.includes("/api/change-password")) return "AUTH";
  if (url.includes("/api/sales")) return "SALES";
  if (url.includes("/api/clients")) return "CLIENTS";
  if (url.includes("/api/sweets")) return "INVENTORY";
  if (url.includes("/api/purchases") || url.includes("/api/purchase-places")) return "PURCHASES";
  if (url.includes("/api/rewards") || url.includes("/api/redemptions")) return "REWARDS";
  if (url.includes("/api/settings")) return "CONFIG";
  if (url.includes("/api/whatsapp")) return "WHATSAPP";
  return "SYSTEM";
}

/**
 * Middleware para registrar automáticamente peticiones HTTP mutantes (POST, PUT, DELETE, PATCH).
 * Omite las rutas de consulta del propio log para evitar recursión.
 */
export function auditMiddleware(req, res, next) {
  // Ignorar consultas al propio módulo de logs
  if (req.originalUrl.startsWith("/api/logs")) {
    return next();
  }

  // Solo auditar por defecto operaciones de cambio de estado o autenticación
  const isMutatingMethod = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
  const isPublicClientView = req.method === "GET" && req.originalUrl.startsWith("/api/public/clients/");

  if (!isMutatingMethod && !isPublicClientView) {
    return next();
  }

  const startTime = Date.now();

  res.on("finish", () => {
    // Si el controlador ya registró un log semántico detallado, omitimos el log genérico
    if (req.skipAuditLog) {
      return;
    }

    const latencyMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const status = statusCode >= 400 ? "FAILED" : "SUCCESS";
    const severity = statusCode >= 500 ? "ERROR" : statusCode >= 400 ? "WARN" : "INFO";
    const category = inferCategory(req.originalUrl);

    let description = `${req.method} ${req.originalUrl} (${statusCode})`;
    if (isPublicClientView) {
      description = `Cliente consultó su estado de cuenta público`;
    }

    logActivity({
      req,
      category,
      action_type: `HTTP_${req.method}`,
      severity,
      description,
      details: {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        body: req.body,
        query: req.query,
      },
      status,
      latency_ms: latencyMs,
    }).catch(() => {});
  });

  next();
}
