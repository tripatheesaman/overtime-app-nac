import type { ReactNode } from "react";

export function AdminField({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div>
        <span className="block text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          {label}
        </span>
        {hint ? (
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {hint}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
