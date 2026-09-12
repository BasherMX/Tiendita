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
