export function AdminBadge({
  tone = "neutral",
  children,
}: {
  tone?: "success" | "warning" | "neutral" | "accent";
  children: React.ReactNode;
}) {
  const styles = {
    success:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
    warning:
      "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
    neutral:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    accent:
      "bg-[#003594]/10 text-[#003594] dark:bg-[#003594]/25 dark:text-blue-200",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
