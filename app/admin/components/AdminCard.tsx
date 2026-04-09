import type { ReactNode } from "react";

export function AdminCard({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900/60 ${className}`}
    >
      <div className="h-1.5 bg-gradient-to-r from-[#003594] via-[#0047b3] to-[#D4483B]" />
      <div className="p-5 sm:p-7">
        {title ? (
          <header className="mb-6 border-b border-slate-100 pb-4 dark:border-slate-800">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}
