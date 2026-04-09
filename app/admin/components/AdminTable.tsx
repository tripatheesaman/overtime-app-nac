import type { ReactNode } from "react";

export function AdminTable({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50 ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function AdminThead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-100 to-slate-50 text-left dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/80">
        {children}
      </tr>
    </thead>
  );
}

export function AdminTh({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ${className}`}
    >
      {children}
    </th>
  );
}

export function AdminTbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>;
}

export function AdminTr({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={`transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${className}`}
    >
      {children}
    </tr>
  );
}

export function AdminTd({
  children,
  className = "",
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`px-4 py-3 text-slate-700 dark:text-slate-200 ${className}`}
    >
      {children}
    </td>
  );
}
