import type { ReactNode } from "react";

export function AdminSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/40">
      <div className="mb-4 border-l-[3px] border-[#003594] pl-3.5">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
