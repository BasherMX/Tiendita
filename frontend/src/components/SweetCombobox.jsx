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
        className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3.5 py-2 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6] outline-none transition"
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
        <div className="absolute z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-[#E5E2DA] bg-white shadow-xl dark:border-[#282C32] dark:bg-[#181B1E] py-1">
          {filtered.map((sweet, idx) => (
            <button
              key={sweet.id}
              type="button"
              className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors ${
                idx === activeIndex
                  ? "bg-[#FAF7F0] text-[#B45309] font-medium dark:bg-[#202428] dark:text-[#F59E0B]"
                  : "text-[#1C1917] hover:bg-[#FAF7F0] dark:text-[#E5E7EB] dark:hover:bg-[#202428]"
              }`}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseDown={() => commitSelection(sweet)}
            >
              <span className="truncate">{sweet.name}</span>
              <span className="ml-2 shrink-0 font-tabular font-semibold text-xs text-[#78716C] dark:text-[#9CA3AF]">
                ${Number(sweet.sale_price).toFixed(2)}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3.5 py-2.5 text-xs text-[#78716C] dark:text-[#9CA3AF]">
              Sin resultados para "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
