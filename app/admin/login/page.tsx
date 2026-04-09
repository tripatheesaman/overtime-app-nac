"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { AdminField } from "@/app/admin/components/AdminField";
import { AdminButton } from "@/app/admin/components/AdminButton";

function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Login failed");
        return;
      }
      const next = params.get("next") || "/admin/settings";
      router.replace(next);
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[42%] flex-col justify-between bg-[#003594] p-10 text-white lg:flex">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200/90">
            Nepal Airlines Corporation
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight">
            Overtime
            <br />
            admin console
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-blue-100/90">
            Configure calendars, departments, rounding rules, and security for
            the public overtime calculator and Excel exports.
          </p>
        </div>
        <div className="text-xs text-blue-200/70">
          Authorized personnel only. Sessions expire after a period of
          inactivity.
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#002a75]/40 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-slate-100 p-6 dark:bg-slate-950 sm:p-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 h-1 rounded-full bg-gradient-to-r from-[#003594] to-[#D4483B]" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Sign in
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Enter your admin username and password to continue.
          </p>

          {error ? (
            <div
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <AdminField
              label="Username"
              hint="Same account created in the database (often superadmin)."
            >
              <input
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </AdminField>
            <AdminField label="Password" hint="Never share this sign-in.">
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </AdminField>
            <AdminButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in to admin"}
            </AdminButton>
          </form>
        </div>
        <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
          Having trouble? Confirm your role is <strong>superadmin</strong> to
          change system settings.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#003594] border-t-transparent" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
