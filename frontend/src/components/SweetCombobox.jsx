import { useState } from "react";

export default function SweetCombobox({ value, onChange, sweets = [] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const sortedSweets = [...sweets].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" }),
  );
  const selected = sortedSweets.find((s) => String(s.id) === String(value));
  const filtered = query.trim()
    ? sortedSweets.filter((s) =>
        (s.name || "").toLowerCase().includes(query.trim().toLowerCase()),
      )
    : sortedSweets;

  function commitSelection(sweet) {
    if (!sweet) return;
    onChange(String(sweet.id));
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-2xl border border-amber-100/70 px-3 py-2 text-sm outline-none dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100"
        placeholder="Buscar dulce..."
        value={
          open
            ? query
            : selected
              ? `${selected.name} ($${Number(selected.sale_price).toFixed(2)})`
              : ""
        }
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setActiveIndex(0);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            setOpen(true);
            return;
          }
          if (!filtered.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
          } else if (e.key === "Enter") {
            if (open) {
              e.preventDefault();
              commitSelection(filtered[activeIndex]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-2xl border border-amber-100/70 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {filtered.map((sweet, idx) => (
            <button
              key={sweet.id}
              type="button"
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-amber-50 dark:hover:bg-slate-800 ${
                idx === activeIndex ? "bg-amber-100/70 dark:bg-slate-800" : ""
              }`}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseDown={() => commitSelection(sweet)}
            >
              <span>{sweet.name}</span>
              <span className="ml-2 shrink-0 text-xs text-slate-500">
                ${Number(sweet.sale_price).toFixed(2)}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-2 text-sm text-slate-500">
              Sin resultados
            </div>
          )}
        </div>
      )}
    </div>
  );
}
