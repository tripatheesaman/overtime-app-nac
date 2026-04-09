"use client";

import { useEffect, useState } from "react";
import { AdminCard } from "@/app/admin/components/AdminCard";
import { AdminField } from "@/app/admin/components/AdminField";
import { AdminSection } from "@/app/admin/components/AdminSection";
import { AdminButton } from "@/app/admin/components/AdminButton";

type SettingsData = {
  isWinter: boolean;
  winterStartDay: number | null;
  winterEndDay: number | null;
  inTimeThreshold: number;
  outTimeThreshold: number;
  oddShiftMinHours: number;
  doubleOffdayStartDay: number;
  dayBeforeOffReductionHours: number;
  overtimeGraceMinutes: number;
  specialWindowStart: string;
  specialWindowEnd: string;
  specialWindowLowerCutoff: string;
  specialWindowUpperCutoff: string;
};

const defaultSettings: SettingsData = {
  isWinter: false,
  winterStartDay: null,
  winterEndDay: null,
  inTimeThreshold: 30,
  outTimeThreshold: 30,
  oddShiftMinHours: 0,
  doubleOffdayStartDay: 23,
  dayBeforeOffReductionHours: 2,
  overtimeGraceMinutes: 40,
  specialWindowStart: "04:50",
  specialWindowEnd: "06:00",
  specialWindowLowerCutoff: "05:15",
  specialWindowUpperCutoff: "05:35",
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data?.success && data.data) {
        setSettings({ ...defaultSettings, ...data.data });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
      alert("All settings saved successfully.");
    } catch (e) {
      console.error(e);
      alert("Could not save settings. Check that you are signed in as superadmin.");
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = String(formData.get("username") || "");
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
      alert("Password updated.");
      e.currentTarget.reset();
    } catch (e) {
      console.error(e);
      alert("Password update failed.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System settings
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Configure how attendance is rounded, how overtime and odd shifts are
          counted, winter duty windows, and security. Only{" "}
          <strong>superadmin</strong> can save these values.
        </p>
      </div>

      <AdminCard
        title="Application behaviour"
        description="These values drive the public overtime calculator and Excel export logic. Change them with care; staff-facing results update immediately after save."
      >
        <div className="space-y-6">
          <AdminSection
            title="Winter duty window"
            subtitle="When enabled, winter placeholder offsets from the calendar month apply between the start and end day numbers (inclusive)."
          >
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#003594] focus:ring-[#003594]"
                checked={settings.isWinter}
                onChange={(e) =>
                  setSettings({ ...settings, isWinter: e.target.checked })
                }
              />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Enable winter mode
                </span>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Turns on winter timing rules for the configured day range of
                  each month.
                </p>
              </div>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField
                label="Winter start day"
                hint="First calendar day (1–31) when winter rules apply."
              >
                <input
                  className="input-field"
                  type="number"
                  min={1}
                  max={31}
                  value={settings.winterStartDay ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      winterStartDay: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </AdminField>
              <AdminField
                label="Winter end day"
                hint="Last calendar day when winter rules apply. Leave empty for no end cap."
              >
                <input
                  className="input-field"
                  type="number"
                  min={1}
                  max={31}
                  value={settings.winterEndDay ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      winterEndDay: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </AdminField>
            </div>
          </AdminSection>

          <AdminSection
            title="Attendance rounding"
            subtitle="Minutes: how close raw clock times can be to scheduled in/out before snapping to duty time. Used when processing extension or pasted attendance."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField
                label="In-time threshold"
                hint="Maximum minutes away from duty start to still treat as on-time snap."
              >
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  max={120}
                  value={settings.inTimeThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      inTimeThreshold: Number(e.target.value),
                    })
                  }
                />
              </AdminField>
              <AdminField
                label="Out-time threshold"
                hint="Maximum minutes away from duty end for snap behaviour on clock-out."
              >
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  max={120}
                  value={settings.outTimeThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      outTimeThreshold: Number(e.target.value),
                    })
                  }
                />
              </AdminField>
            </div>
          </AdminSection>

          <AdminSection
            title="Odd shifts & weekly off-days"
            subtitle="Controls how “odd shift” counts are stored in reports, and the double off-day rule near month-end."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField
                label="Odd-shift minimum hours"
                hint="Night or morning odd shift counts only if total relevant hours meet or exceed this value. Use 0 to count any odd shift flag."
              >
                <input
                  className="input-field"
                  type="number"
                  step={0.5}
                  min={0}
                  value={settings.oddShiftMinHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      oddShiftMinHours: Number(e.target.value),
                    })
                  }
                />
              </AdminField>
              <AdminField
                label="Double off-day starts on day"
                hint="From this day of the month onward, the weekly off-day and the following calendar day are both treated as off."
              >
                <input
                  className="input-field"
                  type="number"
                  min={1}
                  max={31}
                  value={settings.doubleOffdayStartDay}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      doubleOffdayStartDay: Number(e.target.value),
                    })
                  }
                />
              </AdminField>
              <AdminField
                label="Day-before-off duty reduction"
                hint="Hours subtracted from scheduled end time on the day before a weekly off (only before the double off-day start day above)."
              >
                <input
                  className="input-field"
                  type="number"
                  step={0.5}
                  min={0}
                  max={12}
                  value={settings.dayBeforeOffReductionHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      dayBeforeOffReductionHours: Number(e.target.value),
                    })
                  }
                />
              </AdminField>
              <AdminField
                label="After-duty grace (IT template)"
                hint="Minutes after scheduled end before export fills “late out” in the IT-style Excel layout."
              >
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  max={180}
                  value={settings.overtimeGraceMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      overtimeGraceMinutes: Number(e.target.value),
                    })
                  }
                />
              </AdminField>
            </div>
          </AdminSection>

          <AdminSection
            title="Special early-morning window"
            subtitle="Used when rounding raw in-times that fall between these clock times (e.g. night relief). All values are 24h HH:MM."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField
                label="Window start"
                hint="Earliest time that starts the special bucket."
              >
                <input
                  className="input-field font-mono"
                  placeholder="04:50"
                  value={settings.specialWindowStart}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      specialWindowStart: e.target.value,
                    })
                  }
                />
              </AdminField>
              <AdminField
                label="Window end"
                hint="Latest time still inside the special bucket."
              >
                <input
                  className="input-field font-mono"
                  placeholder="06:00"
                  value={settings.specialWindowEnd}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      specialWindowEnd: e.target.value,
                    })
                  }
                />
              </AdminField>
              <AdminField
                label="Lower cutoff"
                hint="Times at or below this snap one way; between lower and upper snap to middle."
              >
                <input
                  className="input-field font-mono"
                  placeholder="05:15"
                  value={settings.specialWindowLowerCutoff}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      specialWindowLowerCutoff: e.target.value,
                    })
                  }
                />
              </AdminField>
              <AdminField
                label="Upper cutoff"
                hint="Times at or above this snap to the end of the window."
              >
                <input
                  className="input-field font-mono"
                  placeholder="05:35"
                  value={settings.specialWindowUpperCutoff}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      specialWindowUpperCutoff: e.target.value,
                    })
                  }
                />
              </AdminField>
            </div>
          </AdminSection>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
          <AdminButton onClick={save} disabled={loading}>
            {loading ? "Saving…" : "Save all settings"}
          </AdminButton>
        </div>
      </AdminCard>

      <AdminCard
        title="Account security"
        description="Change the password for the account you are currently signed in as. Username must match your session."
      >
        <form
          onSubmit={onChangePassword}
          className="grid max-w-2xl gap-5 sm:grid-cols-2"
        >
          <AdminField
            label="Username"
            hint="Same user you used to sign in to this panel."
            className="sm:col-span-2"
          >
            <input
              name="username"
              className="input-field"
              placeholder="superadmin"
              defaultValue="superadmin"
              autoComplete="username"
            />
          </AdminField>
          <AdminField label="Current password" hint="Required to authorize the change.">
            <input
              type="password"
              name="currentPassword"
              className="input-field"
              autoComplete="current-password"
            />
          </AdminField>
          <AdminField label="New password" hint="Choose a strong password.">
            <input
              type="password"
              name="newPassword"
              className="input-field"
              autoComplete="new-password"
            />
          </AdminField>
          <AdminField
            label="Confirm new password"
            hint="Must match the new password exactly."
            className="sm:col-span-2"
          >
            <input
              type="password"
              name="confirmPassword"
              className="input-field"
              autoComplete="new-password"
            />
          </AdminField>
          <div className="sm:col-span-2">
            <AdminButton type="submit" variant="secondary" disabled={passwordLoading}>
              {passwordLoading ? "Updating…" : "Update password"}
            </AdminButton>
          </div>
        </form>
      </AdminCard>
    </div>
  );
}
