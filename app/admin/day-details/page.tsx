'use client'

import { useEffect, useMemo, useState } from "react";

type DayDetailsRow = {
  id?: number
  name: string
  startingday: number
  numberofdays: number
  holidays: number[]
  year: number
  monthNumber?: number
  isActiveMonth: boolean
  isDashainMonth?: boolean
  dashainDays?: number[] | null
  isTiharMonth?: boolean
  tiharDays?: number[] | null
  regularInPlaceholder?: string | null
  regularOutPlaceholder?: string | null
  morningInPlaceholder?: string | null
  morningOutPlaceholder?: string | null
  nightInPlaceholder?: string | null
  nightOutPlaceholder?: string | null
  winterRegularInPlaceholder?: string | null
  winterRegularOutPlaceholder?: string | null
  winterMorningInPlaceholder?: string | null
  winterMorningOutPlaceholder?: string | null
  winterNightInPlaceholder?: string | null
  winterNightOutPlaceholder?: string | null
}

const parseCsvNums = (val: string): number[] =>
  val
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n > 0)

export default function AdminDayDetailsPage() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<DayDetailsRow[]>([])
  const [isWinter, setIsWinter] = useState(false)
  const [winterStartDay, setWinterStartDay] = useState<number | null>(null)

  const emptyForm: DayDetailsRow = useMemo(() => ({
    name: '',
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
  }), [])

  const [form, setForm] = useState<DayDetailsRow>(emptyForm)
  const [holidaysCsv, setHolidaysCsv] = useState('')
  const [dashainCsv, setDashainCsv] = useState('')
  const [tiharCsv, setTiharCsv] = useState('')

  const fetchRows = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/day-details')
      const data = await res.json()
      if (data.success) setRows(data.data)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data.success) {
        setIsWinter(data.data.isWinter || false)
        setWinterStartDay(data.data.winterStartDay || null)
      }
    } catch {}
  }

  useEffect(() => { 
    fetchRows()
    fetchSettings()
  }, [])

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
      regularInPlaceholder: row.regularInPlaceholder ?? '',
      regularOutPlaceholder: row.regularOutPlaceholder ?? '',
      morningInPlaceholder: row.morningInPlaceholder ?? '',
      morningOutPlaceholder: row.morningOutPlaceholder ?? '',
      nightInPlaceholder: row.nightInPlaceholder ?? '',
      nightOutPlaceholder: row.nightOutPlaceholder ?? '',
      winterRegularInPlaceholder: row.winterRegularInPlaceholder ?? '',
      winterRegularOutPlaceholder: row.winterRegularOutPlaceholder ?? '',
      winterMorningInPlaceholder: row.winterMorningInPlaceholder ?? '',
      winterMorningOutPlaceholder: row.winterMorningOutPlaceholder ?? '',
      winterNightInPlaceholder: row.winterNightInPlaceholder ?? '',
      winterNightOutPlaceholder: row.winterNightOutPlaceholder ?? '',
    })
    setHolidaysCsv((row.holidays || []).join(','))
    setDashainCsv((row.dashainDays || []).join(','))
    setTiharCsv((row.tiharDays || []).join(','))
  }

  const onReset = () => {
    // Find the most recent month's data
    const sortedRows = [...rows].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return (b.id || 0) - (a.id || 0);
    });
    const lastMonth = sortedRows[0];

    // Copy placeholders from the last month if available
    const newForm = {
      ...emptyForm,
      // Copy all placeholder values if they exist
      regularInPlaceholder: lastMonth?.regularInPlaceholder || '',
      regularOutPlaceholder: lastMonth?.regularOutPlaceholder || '',
      morningInPlaceholder: lastMonth?.morningInPlaceholder || '',
      morningOutPlaceholder: lastMonth?.morningOutPlaceholder || '',
      nightInPlaceholder: lastMonth?.nightInPlaceholder || '',
      nightOutPlaceholder: lastMonth?.nightOutPlaceholder || '',
      winterRegularInPlaceholder: lastMonth?.winterRegularInPlaceholder || '',
      winterRegularOutPlaceholder: lastMonth?.winterRegularOutPlaceholder || '',
      winterMorningInPlaceholder: lastMonth?.winterMorningInPlaceholder || '',
      winterMorningOutPlaceholder: lastMonth?.winterMorningOutPlaceholder || '',
      winterNightInPlaceholder: lastMonth?.winterNightInPlaceholder || '',
      winterNightOutPlaceholder: lastMonth?.winterNightOutPlaceholder || ''
    };

    setForm(newForm);
    setHolidaysCsv('');
    setDashainCsv('');
    setTiharCsv('');
  }

  const onDelete = async (id?: number) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/day-details/delete?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete');
      await fetchRows();
    } catch (e) {
      console.error(e);
      alert('Failed to delete month.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    setLoading(true)
    try {
      const payload: DayDetailsRow = {
        ...form,
        holidays: parseCsvNums(holidaysCsv),
        dashainDays: form.isDashainMonth ? parseCsvNums(dashainCsv) : [],
        tiharDays: form.isTiharMonth ? parseCsvNums(tiharCsv) : [],
      }
      const res = await fetch('/api/day-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed')
      await fetchRows()
      onReset()
    } catch (e) {
      console.error(e)
      alert('Failed to save. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const onActivate = async (id?: number) => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch('/api/day-details', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed')
      await fetchRows()
    } catch (e) {
      console.error(e)
      alert('Failed to activate month.')
    } finally {
      setLoading(false)
    }
  }

  const onSaveWinterSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWinter, winterStartDay }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed')
      alert('Winter settings saved')
    } catch (e) {
      console.error(e)
      alert('Failed to save winter settings')
    } finally {
      setLoading(false)
    }
  }

  const onChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const username = String(formData.get('username') || '')
    const currentPassword = String(formData.get('currentPassword') || '')
    const newPassword = String(formData.get('newPassword') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentPassword, newPassword })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed')
      alert('Password updated')
      e.currentTarget.reset()
    } catch (e) {
      console.error(e)
      alert('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* Global Winter Toggle */}
      <div>
        <h2 className="font-medium mb-3">Winter Mode Settings</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isWinter}
              onChange={e => setIsWinter(e.target.checked)}
              className="w-5 h-5"
            />
            <span>Enable Winter Mode</span>
          </label>
          {isWinter && (
            <div>
              <label className="block text-sm mb-1">Winter Start Day (from this day onwards, winter placeholders apply)</label>
              <input
                type="number"
                min={1}
                max={31}
                value={winterStartDay || ''}
                onChange={e => setWinterStartDay(e.target.value ? Number(e.target.value) : null)}
                className="input-field w-32"
                placeholder="e.g. 15"
              />
            </div>
          )}
          <button className="btn-primary" onClick={onSaveWinterSettings} disabled={loading}>Save Winter Settings</button>
        </div>
      </div>

      {/* Month Form */}
      <div>
        <h2 className="font-medium mb-3">Month Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Month Name</label>
            <input className="input-field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">Starting Day (0=Sun...6=Sat)</label>
            <input className="input-field" type="number" min={0} max={6} value={form.startingday} onChange={e=>setForm({...form,startingday:Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm mb-1">Number of Days</label>
            <input className="input-field" type="number" min={28} max={32} value={form.numberofdays} onChange={e=>setForm({...form,numberofdays:Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm mb-1">Year</label>
            <input className="input-field" type="number" value={form.year} onChange={e=>setForm({...form,year:Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm mb-1">Month Number (1-12)</label>
            <input className="input-field" type="number" min={1} max={12} value={form.monthNumber ?? 1} onChange={e=>setForm({...form,monthNumber:Number(e.target.value)})} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Holidays (CSV) e.g. 1,7,15</label>
            <input className="input-field" value={holidaysCsv} onChange={e=>setHolidaysCsv(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActiveMonth} onChange={e=>setForm({...form,isActiveMonth:e.target.checked})} />
            <span>Set Active</span>
          </label>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-3 border rounded-lg">
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={!!form.isDashainMonth} onChange={e=>setForm({...form,isDashainMonth:e.target.checked})} />
              <span>Dashain Month</span>
            </label>
            <input className="input-field" placeholder="Dashain days CSV" value={dashainCsv} onChange={e=>setDashainCsv(e.target.value)} disabled={!form.isDashainMonth} />
          </div>
          <div className="p-3 border rounded-lg">
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={!!form.isTiharMonth} onChange={e=>setForm({...form,isTiharMonth:e.target.checked})} />
              <span>Tihar Month</span>
            </label>
            <input className="input-field" placeholder="Tihar days CSV" value={tiharCsv} onChange={e=>setTiharCsv(e.target.value)} disabled={!form.isTiharMonth} />
          </div>
        </div>

        {/* Placeholders Section */}
        <div className="mt-6">
          <h3 className="font-medium mb-3">Regular Placeholders</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Regular In</label>
              <input className="input-field" value={form.regularInPlaceholder || ''} onChange={e=>setForm({...form,regularInPlaceholder:e.target.value})} placeholder="HH:MM" />
            </div>
            <div>
              <label className="block text-sm mb-1">Regular Out</label>
              <input className="input-field" value={form.regularOutPlaceholder || ''} onChange={e=>setForm({...form,regularOutPlaceholder:e.target.value})} placeholder="HH:MM" />
            </div>
            <div>
              <label className="block text-sm mb-1">Morning In</label>
              <input className="input-field" value={form.morningInPlaceholder || ''} onChange={e=>setForm({...form,morningInPlaceholder:e.target.value})} placeholder="HH:MM" />
            </div>
            <div>
              <label className="block text-sm mb-1">Morning Out</label>
              <input className="input-field" value={form.morningOutPlaceholder || ''} onChange={e=>setForm({...form,morningOutPlaceholder:e.target.value})} placeholder="HH:MM" />
            </div>
            <div>
              <label className="block text-sm mb-1">Night In</label>
              <input className="input-field" value={form.nightInPlaceholder || ''} onChange={e=>setForm({...form,nightInPlaceholder:e.target.value})} placeholder="HH:MM" />
            </div>
            <div>
              <label className="block text-sm mb-1">Night Out</label>
              <input className="input-field" value={form.nightOutPlaceholder || ''} onChange={e=>setForm({...form,nightOutPlaceholder:e.target.value})} placeholder="HH:MM" />
            </div>
          </div>

          <h3 className="font-medium mt-6 mb-3">Winter Offsets (hours)</h3>
          <p className="text-sm text-gray-500 mb-4">
            Positive values delay the start time or bring the end time earlier. Negative values do the opposite.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Regular In Offset</label>
              <input type="number" step="0.25" className="input-field" value={form.winterRegularInPlaceholder || ''} onChange={e=>setForm({...form,winterRegularInPlaceholder:e.target.value})} placeholder="e.g. 1" />
            </div>
            <div>
              <label className="block text-sm mb-1">Regular Out Offset</label>
              <input type="number" step="0.25" className="input-field" value={form.winterRegularOutPlaceholder || ''} onChange={e=>setForm({...form,winterRegularOutPlaceholder:e.target.value})} placeholder="e.g. 1" />
            </div>
            <div>
              <label className="block text-sm mb-1">Morning In Offset</label>
              <input type="number" step="0.25" className="input-field" value={form.winterMorningInPlaceholder || ''} onChange={e=>setForm({...form,winterMorningInPlaceholder:e.target.value})} placeholder="e.g. 1" />
            </div>
            <div>
              <label className="block text-sm mb-1">Morning Out Offset</label>
              <input type="number" step="0.25" className="input-field" value={form.winterMorningOutPlaceholder || ''} onChange={e=>setForm({...form,winterMorningOutPlaceholder:e.target.value})} placeholder="e.g. 1" />
            </div>
            <div>
              <label className="block text-sm mb-1">Night In Offset</label>
              <input type="number" step="0.25" className="input-field" value={form.winterNightInPlaceholder || ''} onChange={e=>setForm({...form,winterNightInPlaceholder:e.target.value})} placeholder="e.g. 1" />
            </div>
            <div>
              <label className="block text-sm mb-1">Night Out Offset</label>
              <input type="number" step="0.25" className="input-field" value={form.winterNightOutPlaceholder || ''} onChange={e=>setForm({...form,winterNightOutPlaceholder:e.target.value})} placeholder="e.g. 1" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="btn-primary" onClick={onSubmit} disabled={loading}>{form.id ? 'Update' : 'Create'}</button>
          <button className="bg-gray-200 px-4 py-2 rounded" onClick={onReset} disabled={loading}>Reset</button>
        </div>
      </div>

      {/* Change Password */}
      <div className="p-4 rounded-lg border bg-white dark:bg-gray-800">
        <h2 className="font-medium mb-3">Change Password</h2>
        <form onSubmit={onChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input name="username" className="input-field" placeholder="superadmin" defaultValue="superadmin" />
          </div>
          <div>
            <label className="block text-sm mb-1">Current Password</label>
            <input type="password" name="currentPassword" className="input-field" />
          </div>
          <div>
            <label className="block text-sm mb-1">New Password</label>
            <input type="password" name="newPassword" className="input-field" />
          </div>
          <div>
            <label className="block text-sm mb-1">Confirm Password</label>
            <input type="password" name="confirmPassword" className="input-field" />
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary" type="submit" disabled={loading}>Update Password</button>
          </div>
        </form>
      </div>

      {/* Existing Months */}
      <div>
        <h2 className="font-medium mb-3">Existing Months</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Year</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Start</th>
                <th className="py-2 pr-4">Days</th>
                <th className="py-2 pr-4">Holidays</th>
                <th className="py-2 pr-4">Active</th>
                <th className="py-2 pr-4">Dashain</th>
                <th className="py-2 pr-4">Tihar</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b" style={{fontWeight: (r.isDashainMonth || r.isTiharMonth) ? 'bold' : 'normal'}}>
                  <td className="py-2 pr-4">{r.year}</td>
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 pr-4">{r.startingday}</td>
                  <td className="py-2 pr-4">{r.numberofdays}</td>
                  <td className="py-2 pr-4">{Array.isArray(r.holidays) ? r.holidays.join(',') : ''}</td>
                  <td className="py-2 pr-4">{r.isActiveMonth ? 'Yes' : 'No'}</td>
                  <td className="py-2 pr-4">{r.isDashainMonth ? (r.dashainDays || []).join(',') : '-'}</td>
                  <td className="py-2 pr-4">{r.isTiharMonth ? (r.tiharDays || []).join(',') : '-'}</td>
                  <td className="py-2 pr-4 flex gap-2">
                    <button className="px-2 py-1 border rounded" onClick={()=>onEdit(r)}>Edit</button>
                    {!r.isActiveMonth && (
                      <>
                        <button className="px-2 py-1 border rounded" onClick={()=>onActivate(r.id)}>Make Active</button>
                        <button 
                          className="px-2 py-1 border rounded bg-red-100 hover:bg-red-200 text-red-700" 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this month? This action cannot be undone.')) {
                              onDelete(r.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
