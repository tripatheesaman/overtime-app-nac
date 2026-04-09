"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/admin/settings",
    label: "System settings",
    desc: "Winter, rounding, odd shifts",
  },
  {
    href: "/admin/day-details",
    label: "Calendar months",
    desc: "Holidays & placeholders",
  },
  {
    href: "/admin/department",
    label: "Departments",
    desc: "Templates & codes",
  },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#003594] text-white shadow-xl lg:flex">
        <div className="border-b border-white/15 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200/90">
            NAC Admin
          </p>
          <h1 className="mt-1 text-lg font-bold leading-tight">
            Overtime control panel
          </h1>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ href, label, desc }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-xl px-4 py-3 text-left transition ${
                  active
                    ? "bg-white text-[#003594] shadow-md"
                    : "text-blue-100 hover:bg-white/10"
                }`}
              >
                <span className="block text-sm font-semibold">{label}</span>
                <span
                  className={`mt-0.5 block text-xs ${
                    active ? "text-slate-500" : "text-blue-200/80"
                  }`}
                >
                  {desc}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/15 p-4">
          <button
            type="button"
            className="w-full rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            onClick={async () => {
              await fetch("/api/admin/login", { method: "DELETE" });
              window.location.href = "/admin/login";
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#003594]">
                Admin
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Overtime NAC
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold dark:border-slate-600"
              onClick={async () => {
                await fetch("/api/admin/login", { method: "DELETE" });
                window.location.href = "/admin/login";
              }}
            >
              Out
            </button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  pathname === href
                    ? "bg-[#003594] text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-5xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
