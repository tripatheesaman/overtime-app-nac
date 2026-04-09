import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "muted" | "danger" | "accent";

const variants: Record<
  Variant,
  string
> = {
  primary:
    "bg-[#003594] text-white shadow-md hover:bg-[#002a75] focus-visible:ring-[#003594]",
  secondary:
    "bg-[#D4483B] text-white shadow-md hover:bg-[#b83a2f] focus-visible:ring-[#D4483B]",
  muted:
    "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-700",
  danger:
    "bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800",
  accent:
    "bg-[#003594]/10 text-[#003594] shadow-none ring-1 ring-[#003594]/25 hover:bg-[#003594]/15 dark:text-blue-300 dark:ring-blue-800/50",
};

export function AdminButton({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-slate-900 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
