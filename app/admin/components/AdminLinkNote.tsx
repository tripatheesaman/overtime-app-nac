import Link from "next/link";

export function AdminLinkNote({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/80 p-4 dark:border-blue-900/50 dark:from-blue-950/30 dark:to-indigo-950/20">
      <p className="text-sm text-slate-700 dark:text-slate-300">
        <span className="font-semibold text-[#003594] dark:text-blue-300">
          Tip:{" "}
        </span>
        <Link
          href={href}
          className="font-medium text-[#003594] underline decoration-2 underline-offset-2 hover:text-[#002a75] dark:text-blue-400"
        >
          {children}
        </Link>
      </p>
    </div>
  );
}
