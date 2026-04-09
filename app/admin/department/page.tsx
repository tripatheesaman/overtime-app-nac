"use client";

import { useState, useEffect } from "react";
import { AdminCard } from "@/app/admin/components/AdminCard";
import { AdminField } from "@/app/admin/components/AdminField";
import { AdminSection } from "@/app/admin/components/AdminSection";
import { AdminButton } from "@/app/admin/components/AdminButton";
import {
  AdminTable,
  AdminThead,
  AdminTh,
  AdminTbody,
  AdminTr,
  AdminTd,
} from "@/app/admin/components/AdminTable";

type Department = {
  id?: number;
  name: string;
  code: string;
  templateFile?: string;
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

export default function DepartmentPage() {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const emptyForm: Department = {
    name: "",
    code: "",
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
  };
  const [form, setForm] = useState<Department>(emptyForm);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/department");
      const data = await res.json();
      if (data.success) setDepartments(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const onSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/department", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
      await fetchDepartments();
      setForm(emptyForm);
    } catch (e) {
      console.error(e);
      alert("Failed to save. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id?: number) => {
    if (!id) return;
    if (
      !confirm(
        "Delete this department? Only allowed if no overtime records reference it."
      )
    )
      return;
    setLoading(true);
    try {
      const res = await fetch(`/api/department/delete?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
      await fetchDepartments();
    } catch (e) {
      console.error(e);
      alert("Failed to delete department.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Departments
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Each department maps to an Excel template file in{" "}
          <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs dark:bg-slate-800">
            /public
          </code>{" "}
          named{" "}
          <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs dark:bg-slate-800">
            template_&#123;code&#125;.xlsx
          </code>
          . Placeholders pre-fill the public overtime form when staff pick this
          department.
        </p>
      </div>

      <AdminCard
        title={form.id ? "Edit department" : "New department"}
        description="Use a short lowercase code without spaces (e.g. grsd, it). The code cannot be changed implicitly after create—edit carefully."
      >
        <div className="space-y-6">
          <AdminSection
            title="Identity"
            subtitle="What staff see in the dropdown and how files are named."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField
                label="Department name"
                hint="Full name shown in the overtime calculator, e.g. Ground Support."
              >
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ground Support"
                />
              </AdminField>
              <AdminField
                label="Department code"
                hint="Letters and numbers only; stored lowercase. Drives template filename."
              >
                <input
                  className="input-field font-mono"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value })
                  }
                  placeholder="e.g. grsd"
                />
              </AdminField>
            </div>
          </AdminSection>

          <AdminSection
            title="Suggested duty times (placeholders)"
            subtitle="24h HH:MM. When a user selects this department, these values load into Step 2."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["regularInPlaceholder", "Regular shift — clock in"],
                  ["regularOutPlaceholder", "Regular shift — clock out"],
                  ["morningInPlaceholder", "Morning shift — in"],
                  ["morningOutPlaceholder", "Morning shift — out"],
                  ["nightInPlaceholder", "Night shift — in"],
                  ["nightOutPlaceholder", "Night shift — out"],
                ] as const
              ).map(([key, label]) => (
                <AdminField key={key} label={label}>
                  <input
                    className="input-field font-mono"
                    value={form[key] ?? ""}
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
            subtitle="Optional decimal hours; combined with month-level winter settings when winter mode is on."
          >
            <div className="grid gap-4 sm:grid-cols-2">
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
                    value={form[key] ?? ""}
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
          <AdminButton
            onClick={onSubmit}
            disabled={loading || !form.name.trim() || !form.code.trim()}
          >
            {loading ? "Saving…" : form.id ? "Update department" : "Create department"}
          </AdminButton>
          {form.id ? (
            <AdminButton
              variant="muted"
              onClick={() => setForm(emptyForm)}
              disabled={loading}
            >
              Cancel edit
            </AdminButton>
          ) : null}
        </div>
      </AdminCard>

      <AdminCard
        title="Registered departments"
        description={
          loading ? "Loading…" : `${departments.length} department(s) in the system.`
        }
      >
        <AdminTable>
          <AdminThead>
            <AdminTh>Name</AdminTh>
            <AdminTh>Code</AdminTh>
            <AdminTh>Excel template</AdminTh>
            <AdminTh className="text-right">Actions</AdminTh>
          </AdminThead>
          <AdminTbody>
            {departments.map((dept) => (
              <AdminTr key={dept.id}>
                <AdminTd className="font-medium">{dept.name}</AdminTd>
                <AdminTd>
                  <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold dark:bg-slate-800">
                    {dept.code}
                  </code>
                </AdminTd>
                <AdminTd className="font-mono text-xs text-slate-600 dark:text-slate-400">
                  template_{dept.code}.xlsx
                </AdminTd>
                <AdminTd className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <AdminButton
                      variant="muted"
                      className="!px-3 !py-1.5 !text-xs"
                      onClick={() => setForm(dept)}
                    >
                      Edit
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      className="!px-3 !py-1.5 !text-xs"
                      onClick={() => onDelete(dept.id)}
                    >
                      Delete
                    </AdminButton>
                  </div>
                </AdminTd>
              </AdminTr>
            ))}
            {departments.length === 0 && !loading && (
              <AdminTr>
                <AdminTd colSpan={4} className="py-10 text-center text-slate-500">
                  No departments yet. Add one using the form above.
                </AdminTd>
              </AdminTr>
            )}
          </AdminTbody>
        </AdminTable>
      </AdminCard>
    </div>
  );
}
