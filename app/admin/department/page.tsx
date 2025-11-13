'use client'

import { useState, useEffect } from 'react';

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
    name: '', 
    code: '',
    regularInPlaceholder: '',
    regularOutPlaceholder: '',
    morningInPlaceholder: '',
    morningOutPlaceholder: '',
    nightInPlaceholder: '',
    nightOutPlaceholder: '',
    winterRegularInPlaceholder: '',
    winterRegularOutPlaceholder: '',
    winterMorningInPlaceholder: '',
    winterMorningOutPlaceholder: '',
    winterNightInPlaceholder: '',
    winterNightOutPlaceholder: '',
  };
  const [form, setForm] = useState<Department>(emptyForm);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/department');
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
      const res = await fetch('/api/department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      await fetchDepartments();
      setForm(emptyForm);
    } catch (e) {
      console.error(e);
      alert('Failed to save. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this department? This cannot be undone.')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/department/delete?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      await fetchDepartments();
    } catch (e) {
      console.error(e);
      alert('Failed to delete department.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Department Form */}
      <div>
        <h2 className="font-medium mb-3">Add/Edit Department</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Department Name</label>
            <input 
              className="input-field" 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. GRSD"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Department Code</label>
            <input 
              className="input-field" 
              value={form.code} 
              onChange={e => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. grsd"
            />
            <p className="text-xs text-gray-500 mt-1">Used for template file naming (e.g., template_grsd.xlsx)</p>
          </div>
        </div>

        {/* Placeholders Section */}
        <div className="mt-6">
          <h3 className="font-medium mb-3 text-sm">Department-Specific Placeholders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Regular In Placeholder</label>
              <input 
                className="input-field" 
                value={form.regularInPlaceholder ?? ''} 
                onChange={e => setForm({ ...form, regularInPlaceholder: e.target.value })}
                placeholder="e.g. 10:00"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Regular Out Placeholder</label>
              <input 
                className="input-field" 
                value={form.regularOutPlaceholder ?? ''} 
                onChange={e => setForm({ ...form, regularOutPlaceholder: e.target.value })}
                placeholder="e.g. 17:00"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Morning In Placeholder</label>
              <input 
                className="input-field" 
                value={form.morningInPlaceholder ?? ''} 
                onChange={e => setForm({ ...form, morningInPlaceholder: e.target.value })}
                placeholder="e.g. 05:30"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Morning Out Placeholder</label>
              <input 
                className="input-field" 
                value={form.morningOutPlaceholder ?? ''} 
                onChange={e => setForm({ ...form, morningOutPlaceholder: e.target.value })}
                placeholder="e.g. 12:30"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Night In Placeholder</label>
              <input 
                className="input-field" 
                value={form.nightInPlaceholder ?? ''} 
                onChange={e => setForm({ ...form, nightInPlaceholder: e.target.value })}
                placeholder="e.g. 17:00"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Night Out Placeholder</label>
              <input 
                className="input-field" 
                value={form.nightOutPlaceholder ?? ''} 
                onChange={e => setForm({ ...form, nightOutPlaceholder: e.target.value })}
                placeholder="e.g. 00:00"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2 text-sm">Winter Placeholders</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Winter Regular In</label>
                <input 
                  className="input-field" 
                  value={form.winterRegularInPlaceholder ?? ''} 
                  onChange={e => setForm({ ...form, winterRegularInPlaceholder: e.target.value })}
                  placeholder="e.g. 10:00"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Winter Regular Out</label>
                <input 
                  className="input-field" 
                  value={form.winterRegularOutPlaceholder ?? ''} 
                  onChange={e => setForm({ ...form, winterRegularOutPlaceholder: e.target.value })}
                  placeholder="e.g. 16:00"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Winter Morning In</label>
                <input 
                  className="input-field" 
                  value={form.winterMorningInPlaceholder ?? ''} 
                  onChange={e => setForm({ ...form, winterMorningInPlaceholder: e.target.value })}
                  placeholder="e.g. 05:30"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Winter Morning Out</label>
                <input 
                  className="input-field" 
                  value={form.winterMorningOutPlaceholder ?? ''} 
                  onChange={e => setForm({ ...form, winterMorningOutPlaceholder: e.target.value })}
                  placeholder="e.g. 12:30"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Winter Night In</label>
                <input 
                  className="input-field" 
                  value={form.winterNightInPlaceholder ?? ''} 
                  onChange={e => setForm({ ...form, winterNightInPlaceholder: e.target.value })}
                  placeholder="e.g. 17:00"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Winter Night Out</label>
                <input 
                  className="input-field" 
                  value={form.winterNightOutPlaceholder ?? ''} 
                  onChange={e => setForm({ ...form, winterNightOutPlaceholder: e.target.value })}
                  placeholder="e.g. 00:00"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button 
            className="btn-primary"
            onClick={onSubmit}
            disabled={loading || !form.name || !form.code}
          >
            {form.id ? 'Update' : 'Create'}
          </button>
          {form.id && (
            <button 
              className="bg-gray-200 px-4 py-2 rounded"
              onClick={() => setForm(emptyForm)}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Existing Departments */}
      <div className="p-4 rounded-lg border bg-white dark:bg-gray-800">
        <h2 className="font-medium mb-3">Existing Departments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Template File</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(dept => (
                <tr key={dept.id} className="border-b">
                  <td className="py-2 pr-4">{dept.name}</td>
                  <td className="py-2 pr-4">{dept.code}</td>
                  <td className="py-2 pr-4">template_{dept.code}.xlsx</td>
                  <td className="py-2 pr-4 flex gap-2">
                    <button 
                      className="px-2 py-1 border rounded"
                      onClick={() => setForm(dept)}
                    >
                      Edit
                    </button>
                    <button 
                      className="px-2 py-1 border rounded bg-red-100 hover:bg-red-200 text-red-700"
                      onClick={() => onDelete(dept.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    No departments found. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
