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
            className={`flex flex-col items-center justify-center gap-1 sm:gap-1.5 rounded-xl border p-2 sm:p-2.5 text-[11px] sm:text-xs font-semibold transition-all min-w-0 ${
              selected
                ? "border-[#D97706] bg-[#FEF3C7]/40 text-[#92400E] shadow-sm ring-1 ring-[#D97706] dark:border-[#D97706] dark:bg-[#78350F]/20 dark:text-[#FDE68A]"
                : "border-[#E5E2DA] bg-white text-[#57534E] hover:border-[#D97706]/50 hover:bg-[#FAF7F0] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#9CA3AF] dark:hover:bg-[#202428]"
            }`}
          >
            <Icon
              path={method.icon}
              size={0.8}
              className={
                selected ? "text-[#D97706] dark:text-[#F59E0B]" : method.color
              }
            />
            <span className="truncate w-full text-center">{method.label}</span>
          </button>
        );
      })}
    </div>
  );
}
