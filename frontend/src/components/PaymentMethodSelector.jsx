import Icon from "@mdi/react";
import { mdiCash, mdiBankTransfer, mdiCreditCardOutline } from "@mdi/js";

export default function PaymentMethodSelector({
  value = "cash",
  onChange,
  className = "",
}) {
  const methods = [
    {
      id: "cash",
      label: "Efectivo",
      icon: mdiCash,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "transfer",
      label: "Transferencia",
      icon: mdiBankTransfer,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "card",
      label: "Tarjeta",
      icon: mdiCreditCardOutline,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {methods.map((method) => {
        const selected = value === method.id;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onChange(method.id)}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-2.5 text-xs font-semibold transition-all ${
              selected
                ? "border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-2 ring-amber-500/20 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200"
                : "border-slate-200 bg-white/70 text-slate-600 hover:border-amber-200 hover:bg-amber-50/50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:bg-slate-800/60"
            }`}
          >
            <Icon
              path={method.icon}
              size={0.85}
              className={
                selected ? "text-amber-600 dark:text-amber-400" : method.color
              }
            />
            <span>{method.label}</span>
          </button>
        );
      })}
    </div>
  );
}
