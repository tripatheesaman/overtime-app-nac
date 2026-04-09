"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminCard } from "@/app/admin/components/AdminCard";
import { AdminLinkNote } from "@/app/admin/components/AdminLinkNote";
import { AdminField } from "@/app/admin/components/AdminField";
import { AdminSection } from "@/app/admin/components/AdminSection";
import { AdminButton } from "@/app/admin/components/AdminButton";
import { AdminBadge } from "@/app/admin/components/AdminBadge";
import {
  AdminTable,
  AdminThead,
  AdminTh,
  AdminTbody,
  AdminTr,
  AdminTd,
} from "@/app/admin/components/AdminTable";

type DayDetailsRow = {
  id?: number;
  name: string;
  startingday: number;
  numberofdays: number;
  holidays: number[];
  year: number;
  monthNumber?: number;
  isActiveMonth: boolean;
  isDashainMonth?: boolean;
  dashainDays?: number[] | null;
  isTiharMonth?: boolean;
  tiharDays?: number[] | null;
  regularInPlaceholder?: string | null;
  regularOutPlaceholder?: string | null;
  morningInPlaceholder?: string | null;
  morningOutPlaceholder?: string | null;
  nightInPlaceholder?: string | null;
  nightOutPlaceholder?: string | null;
  winterRegularInPlaceholder?: string | null;
  winterRegularOutPlaceholder?: string | null;
  winterMorningInPlaceholder?: string | null;
  winterMorningOutPlaceholder?: string | null;
  winterNightInPlaceholder?: string | null;
  winterNightOutPlaceholder?: string | null;
};

const WEEKDAYS = [
  { value: 0, label: "Sunday (0)" },
  { value: 1, label: "Monday (1)" },
  { value: 2, label: "Tuesday (2)" },
  { value: 3, label: "Wednesday (3)" },
  { value: 4, label: "Thursday (4)" },
  { value: 5, label: "Friday (5)" },
  { value: 6, label: "Saturday (6)" },
] as const;

const parseCsvNums = (val: string): number[] =>
  val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n > 0);

export default function AdminDayDetailsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<DayDetailsRow[]>([]);

  const emptyForm: DayDetailsRow = useMemo(
    () => ({
      name: "",
      startingday: 0,
      numberofdays: 30,
      holidays: [],
      year: new Date().getFullYear(),
      monthNumber: 1,
      isActiveMonth: false,
      isDashainMonth: false,
      dashainDays: [],
      isTiharMonth: false,
      tiharDays: [],
      regularInPlaceholder: "",
      regularOutPlaceholder: "",
      morningInPlaceholder: "",
      morningOutPlaceholder: "",
      nightInPlaceholder: "",
      nightOutPlaceholder: "",
      winterRegularInPlaceholder: "",
      winterRegularOutPlaceholder: "",
      winterMorningInPlaceholder: "",
      winterMorningOutPlaceholder: "",
      winterNightInPlaceholder: "",
      winterNightOutPlaceholder: "",
    }),
    []
  );

  const [form, setForm] = useState<DayDetailsRow>(emptyForm);
  const [holidaysCsv, setHolidaysCsv] = useState("");
  const [dashainCsv, setDashainCsv] = useState("");
  const [tiharCsv, setTiharCsv] = useState("");

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/day-details");
      const data = await res.json();
      if (data.success) setRows(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const onEdit = (row: DayDetailsRow) => {
    setForm({
      id: row.id,
      name: row.name,
      startingday: row.startingday,
      numberofdays: row.numberofdays,
      holidays: Array.isArray(row.holidays) ? row.holidays : [],
      year: row.year,
      monthNumber: row.monthNumber ?? 1,
      isActiveMonth: row.isActiveMonth,
      isDashainMonth: row.isDashainMonth ?? false,
      dashainDays: row.dashainDays ?? [],
      isTiharMonth: row.isTiharMonth ?? false,
      tiharDays: row.tiharDays ?? [],
      regularInPlaceholder: row.regularInPlaceholder ?? "",
      regularOutPlaceholder: row.regularOutPlaceholder ?? "",
      morningInPlaceholder: row.morningInPlaceholder ?? "",
      morningOutPlaceholder: row.morningOutPlaceholder ?? "",
      nightInPlaceholder: row.nightInPlaceholder ?? "",
      nightOutPlaceholder: row.nightOutPlaceholder ?? "",
      winterRegularInPlaceholder: row.winterRegularInPlaceholder ?? "",
      winterRegularOutPlaceholder: row.winterRegularOutPlaceholder ?? "",
      winterMorningInPlaceholder: row.winterMorningInPlaceholder ?? "",
      winterMorningOutPlaceholder: row.winterMorningOutPlaceholder ?? "",
      winterNightInPlaceholder: row.winterNightInPlaceholder ?? "",
      winterNightOutPlaceholder: row.winterNightOutPlaceholder ?? "",
    });
    setHolidaysCsv((row.holidays || []).join(","));
    setDashainCsv((row.dashainDays || []).join(","));
    setTiharCsv((row.tiharDays || []).join(","));
  };

  const onReset = () => {
    const sortedRows = [...rows].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return (b.id || 0) - (a.id || 0);
    });
    const lastMonth = sortedRows[0];
    const newForm = {
      ...emptyForm,
      regularInPlaceholder: lastMonth?.regularInPlaceholder || "",
      regularOutPlaceholder: lastMonth?.regularOutPlaceholder || "",
      morningInPlaceholder: lastMonth?.morningInPlaceholder || "",
      morningOutPlaceholder: lastMonth?.morningOutPlaceholder || "",
      nightInPlaceholder: lastMonth?.nightInPlaceholder || "",
      nightOutPlaceholder: lastMonth?.nightOutPlaceholder || "",
      winterRegularInPlaceholder: lastMonth?.winterRegularInPlaceholder || "",
      winterRegularOutPlaceholder: lastMonth?.winterRegularOutPlaceholder || "",
      winterMorningInPlaceholder: lastMonth?.winterMorningInPlaceholder || "",
      winterMorningOutPlaceholder: lastMonth?.winterMorningOutPlaceholder || "",
      winterNightInPlaceholder: lastMonth?.winterNightInPlaceholder || "",
      winterNightOutPlaceholder: lastMonth?.winterNightOutPlaceholder || "",
    };
    setForm(newForm);
    setHolidaysCsv("");
    setDashainCsv("");
    setTiharCsv("");
  };

  const onDelete = async (id?: number) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/day-details/delete?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete");
      await fetchRows();
    } catch (e) {
      console.error(e);
      alert("Failed to delete month.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    setLoading(true);
    try {
      const payload: DayDetailsRow = {
        ...form,
        holidays: parseCsvNums(holidaysCsv),
        dashainDays: form.isDashainMonth ? parseCsvNums(dashainCsv) : [],
        tiharDays: form.isTiharMonth ? parseCsvNums(tiharCsv) : [],
      };
      const res = await fetch("/api/day-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
      await fetchRows();
      onReset();
    } catch (e) {
      console.error(e);
      alert("Failed to save. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const onActivate = async (id?: number) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/day-details", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
      await fetchRows();
    } catch (e) {
      console.error(e);
      alert("Failed to activate month.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Calendar months
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          One row per payroll or attendance month. The{" "}
          <strong>active</strong> month drives overtime calculation and the
          browser extension.
        </p>
      </div>

      <AdminLinkNote href="/admin/settings">
        Open system settings for winter mode, rounding thresholds, and password
        changes
      </AdminLinkNote>

      <AdminCard
        title={form.id ? "Edit month" : "Create month"}
        description="Set how many days are in the month, which weekday day 1 falls on, public holiday (CHD) dates, and optional Dashain/Tihar day lists. Placeholders pre-fill Excel exports."
      >
        <div className="space-y-6">
          <AdminSection
            title="Calendar identity"
            subtitle="Matches the attendance period employees see on their roster."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AdminField
                label="Display name"
                hint="Shown in reports, e.g. Baisakh 2082 or March 2026."
                className="sm:col-span-2"
              >
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </AdminField>
              <AdminField
                label="Year"
                hint="Gregorian year for this month record."
              >
                <input
                  className="input-field"
                  type="number"
                  value={form.year}
                  onChange={(e) =>
                    setForm({ ...form, year: Number(e.target.value) })
                  }
                />
              </AdminField>
              <AdminField
                label="Month number (1–12)"
                hint="Used for date columns in some Excel templates."
              >
                <input
                  className="input-field"
                  type="number"
                  min={1}
                  max={12}
                  value={form.monthNumber ?? 1}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      monthNumber: Number(e.target.value),
                    })
                  }
                />
              </AdminField>
              <AdminField
                label="Length of month"
                hint="Usually 28–31 days in this calendar."
              >
                <input
                  className="input-field"
                  type="number"
                  min={28}
                  max={32}
                  value={form.numberofdays}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      numberofdays: Number(e.target.value),
                    })
                  }
                />
              </AdminField>
              <AdminField
                label="Weekday of day 1"
                hint="First day of this month: which day of the week is it? Drives weekly off-day logic."
              >
                <select
                  className="input-field"
                  value={form.startingday}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      startingday: Number(e.target.value),
                    })
                  }
                >
                  {WEEKDAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField
                label="Public holidays (CHD)"
                hint="Comma-separated day numbers only, e.g. 5,12,26 for the 5th, 12th, 26th."
                className="sm:col-span-2 lg:col-span-3"
              >
                <input
                  className="input-field font-mono text-sm"
                  value={holidaysCsv}
                  onChange={(e) => setHolidaysCsv(e.target.value)}
                  placeholder="e.g. 1, 7, 15"
                />
              </AdminField>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#003594]"
                checked={form.isActiveMonth}
                onChange={(e) =>
                  setForm({ ...form, isActiveMonth: e.target.checked })
                }
              />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Set as active month
                </span>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Only one month should be active. This one is used for new
                  overtime runs and extension imports.
                </p>
              </div>
            </label>
          </AdminSection>

          <AdminSection
            title="Festival overrides"
            subtitle="Optional lists of calendar day numbers treated as Dashain or Tihar for overtime rules."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <label className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded text-[#003594]"
                    checked={!!form.isDashainMonth}
                    onChange={(e) =>
                      setForm({ ...form, isDashainMonth: e.target.checked })
                    }
                  />
                  Dashain month
                </label>
                <AdminField
                  label="Dashain day numbers"
                  hint="Comma-separated, e.g. 10,11,12"
                  className="mt-3"
                >
                  <input
                    className="input-field font-mono text-sm"
                    value={dashainCsv}
                    onChange={(e) => setDashainCsv(e.target.value)}
                    disabled={!form.isDashainMonth}
                  />
                </AdminField>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <label className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded text-[#003594]"
                    checked={!!form.isTiharMonth}
                    onChange={(e) =>
                      setForm({ ...form, isTiharMonth: e.target.checked })
                    }
                  />
                  Tihar month
                </label>
                <AdminField
                  label="Tihar day numbers"
                  hint="Comma-separated day numbers."
                  className="mt-3"
                >
                  <input
                    className="input-field font-mono text-sm"
                    value={tiharCsv}
                    onChange={(e) => setTiharCsv(e.target.value)}
                    disabled={!form.isTiharMonth}
                  />
                </AdminField>
              </div>
            </div>
          </AdminSection>

          <AdminSection
            title="Default time placeholders"
            subtitle="24h HH:MM. Used when filling standard duty rows in exported spreadsheets for this month."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["regularInPlaceholder", "Regular duty — in"],
                  ["regularOutPlaceholder", "Regular duty — out"],
                  ["morningInPlaceholder", "Morning shift — in"],
                  ["morningOutPlaceholder", "Morning shift — out"],
                  ["nightInPlaceholder", "Night duty — in"],
                  ["nightOutPlaceholder", "Night duty — out"],
                ] as const
              ).map(([key, label]) => (
                <AdminField key={key} label={label}>
                  <input
                    className="input-field font-mono"
                    value={(form[key] as string) || ""}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    placeholder="HH:MM"
                  />
                </AdminField>
              ))}
            </div>
          </AdminSection>

          <AdminSection
            title="Winter offsets (hours)"
            subtitle="Decimal hours. Positive typically delays start or pulls end earlier during winter rules from system settings."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["winterRegularInPlaceholder", "Regular — in offset"],
                  ["winterRegularOutPlaceholder", "Regular — out offset"],
                  ["winterMorningInPlaceholder", "Morning — in offset"],
                  ["winterMorningOutPlaceholder", "Morning — out offset"],
                  ["winterNightInPlaceholder", "Night — in offset"],
                  ["winterNightOutPlaceholder", "Night — out offset"],
                ] as const
              ).map(([key, label]) => (
                <AdminField key={key} label={label}>
                  <input
                    type="number"
                    step={0.25}
                    className="input-field"
                    value={(form[key] as string) || ""}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                </AdminField>
              ))}
            </div>
          </AdminSection>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
          <AdminButton onClick={onSubmit} disabled={loading}>
            {loading ? "Saving…" : form.id ? "Update month" : "Create month"}
          </AdminButton>
          <AdminButton variant="muted" onClick={onReset} disabled={loading}>
            Clear form
          </AdminButton>
        </div>
      </AdminCard>

      <AdminCard
        title="All configured months"
        description={
          loading
            ? "Loading…"
            : `${rows.length} month record(s). Active month is highlighted.`
        }
      >
        <AdminTable>
          <AdminThead>
            <AdminTh>Year</AdminTh>
            <AdminTh>Month</AdminTh>
            <AdminTh>Day 1 weekday</AdminTh>
            <AdminTh>Days</AdminTh>
            <AdminTh>CHD days</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh>Dashain</AdminTh>
            <AdminTh>Tihar</AdminTh>
            <AdminTh className="text-right">Actions</AdminTh>
          </AdminThead>
          <AdminTbody>
            {rows.map((r) => (
              <AdminTr key={r.id}>
                <AdminTd className="font-medium">{r.year}</AdminTd>
                <AdminTd>{r.name}</AdminTd>
                <AdminTd>
                  {WEEKDAYS.find((w) => w.value === r.startingday)?.label ??
                    r.startingday}
                </AdminTd>
                <AdminTd>{r.numberofdays}</AdminTd>
                <AdminTd className="max-w-[140px] truncate font-mono text-xs">
                  {Array.isArray(r.holidays) ? r.holidays.join(", ") : "—"}
                </AdminTd>
                <AdminTd>
                  {r.isActiveMonth ? (
                    <AdminBadge tone="success">Active</AdminBadge>
                  ) : (
                    <AdminBadge tone="neutral">Inactive</AdminBadge>
                  )}
                </AdminTd>
                <AdminTd className="text-sm">
                  {r.isDashainMonth
                    ? (r.dashainDays || []).join(", ") || "—"
                    : "—"}
                </AdminTd>
                <AdminTd className="text-sm">
                  {r.isTiharMonth
                    ? (r.tiharDays || []).join(", ") || "—"
                    : "—"}
                </AdminTd>
                <AdminTd className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <AdminButton
                      variant="muted"
                      className="!px-3 !py-1.5 !text-xs"
                      onClick={() => onEdit(r)}
                    >
                      Edit
                    </AdminButton>
                    {!r.isActiveMonth && (
                      <>
                        <AdminButton
                          variant="accent"
                          className="!px-3 !py-1.5 !text-xs"
                          onClick={() => onActivate(r.id)}
                        >
                          Activate
                        </AdminButton>
                        <AdminButton
                          variant="danger"
                          className="!px-3 !py-1.5 !text-xs"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Delete this month? This cannot be undone."
                              )
                            ) {
                              onDelete(r.id);
                            }
                          }}
                        >
                          Delete
                        </AdminButton>
                      </>
                    )}
                  </div>
                </AdminTd>
              </AdminTr>
            ))}
            {rows.length === 0 && !loading && (
              <AdminTr>
                <AdminTd colSpan={9} className="py-10 text-center text-slate-500">
                  No months yet. Create one using the form above.
                </AdminTd>
              </AdminTr>
            )}
          </AdminTbody>
        </AdminTable>
      </AdminCard>
    </div>
  );
}
