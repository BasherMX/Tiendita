export function toIsoDay(value) {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getWeeklyRange(shift = 0) {
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset - shift * 7);
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return { from: toIsoDay(monday), to: toIsoDay(friday) };
}

export function getCurrentWeekRange() {
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toIsoDay(monday), to: toIsoDay(sunday) };
}

export function getCurrentMonthRange() {
  const now = new Date();
  return {
    from: toIsoDay(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toIsoDay(now),
  };
}

export function getMonthlyRange(shift = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - shift, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - shift + 1, 0);
  return { from: toIsoDay(start), to: toIsoDay(end) };
}

export function formatRangeLabel(from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const sameMonth =
    fromDate.getMonth() === toDate.getMonth() &&
    fromDate.getFullYear() === toDate.getFullYear();
  const monthName = fromDate.toLocaleDateString("es-MX", { month: "long" });
  if (sameMonth) {
    return `${fromDate.getDate()}-${toDate.getDate()} ${monthName}`;
  }
  return `${fromDate.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })} - ${toDate.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}`;
}

const MEXICAN_HOLIDAYS = [
  "1-1", // Año Nuevo
  "5-2", // Constitución (aprox / conmemorativo)
  "21-3", // Natalicio Benito Juárez (aprox)
  "1-5", // Día del Trabajo
  "16-9", // Independencia
  "20-11", // Revolución Mexicana
  "25-12", // Navidad
];

function isMexicanHoliday(date) {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  return MEXICAN_HOLIDAYS.includes(`${d}-${m}`);
}

function isBusinessDay(date) {
  const day = date.getDay(); // 0 = Domingo, 6 = Sábado
  if (day === 0 || day === 6) return false;
  if (isMexicanHoliday(date)) return false;
  return true;
}

export function getEffectiveQuincenaDate(year, month, quincenaType) {
  let targetDate;
  if (quincenaType === 1) {
    targetDate = new Date(year, month - 1, 15, 12, 0, 0);
  } else {
    const lastDay = new Date(year, month, 0).getDate();
    targetDate = new Date(year, month - 1, lastDay, 12, 0, 0);
  }
  while (!isBusinessDay(targetDate)) {
    targetDate.setDate(targetDate.getDate() - 1);
  }
  return targetDate;
}

export function isQuincenaTriggerDay(nowDate = new Date()) {
  const localStr = nowDate.toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  });
  const [yearStr, monthStr, dayStr] = localStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const q1Date = getEffectiveQuincenaDate(year, month, 1);
  const q2Date = getEffectiveQuincenaDate(year, month, 2);

  if (q1Date.getDate() === day) {
    return {
      isTriggerDay: true,
      quincenaTag: `Q1_${year}_${String(month).padStart(2, "0")}`,
      label: `1ra Quincena (${dayStr}/${monthStr}/${yearStr})`,
    };
  }
  if (q2Date.getDate() === day) {
    return {
      isTriggerDay: true,
      quincenaTag: `Q2_${year}_${String(month).padStart(2, "0")}`,
      label: `2da Quincena (${dayStr}/${monthStr}/${yearStr})`,
    };
  }
  return { isTriggerDay: false, quincenaTag: null, label: null };
}

export function parseUtcDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const str = String(value).trim();
  // Si es formato ISO/SQL sin zona horaria (ej. "2026-11-18 14:52:00" o "2026-11-18T14:52:00"), forzar UTC
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(str)) {
    return new Date(str.replace(" ", "T") + "Z");
  }
  return new Date(str);
}

export function formatMxDateTime(value, options = {}) {
  const d = parseUtcDate(value);
  if (!d || isNaN(d.getTime())) return "";
  return d.toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    ...options,
  });
}

export function formatMxShortDateTime(value) {
  return formatMxDateTime(value, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMxFullDateTime(value) {
  return formatMxDateTime(value, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
