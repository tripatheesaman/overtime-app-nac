"use client";

import { useEffect, useState } from "react";
import { AdminCard } from "@/app/admin/components/AdminCard";
import { AdminField } from "@/app/admin/components/AdminField";
import { AdminSection } from "@/app/admin/components/AdminSection";
import { AdminButton } from "@/app/admin/components/AdminButton";
import { AppSettings, DEFAULT_APP_SETTINGS } from "@/app/types/settings";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  const setRange = (
    key: "winterOverlay" | "doubleOffOverlay" | "noFridayOverlay" | "eightHourOverlay",
    field: "startDay" | "endDay",
    value: number
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        range: {
          ...prev[key].range,
          [field]: value,
        },
      },
    }));
  };

  const setShiftPlaceholder = (
    parent: "placeholders" | "eightHourOverlay",
    child: "normal" | "winter" | "defaults",
    field:
      | "regularIn"
      | "regularOut"
      | "nightIn"
      | "nightOut"
      | "morningIn"
      | "morningOut",
    value: string
  ) => {
    setSettings((prev) => {
      if (parent === "placeholders") {
        return {
          ...prev,
          placeholders: {
            ...prev.placeholders,
            [child]: {
              ...prev.placeholders[child as "normal" | "winter"],
              [field]: value,
            },
          },
        };
      }
      return {
        ...prev,
        eightHourOverlay: {
          ...prev.eightHourOverlay,
          defaults: {
            ...prev.eightHourOverlay.defaults,
            [field]: value,
          },
        },
      };
    });
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data?.success && data.data) {
        setSettings(data.data);
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
          Mode settings
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Configure normal mode and overlays for winter, double off day, no
          friday, and 8-hour shift. Only{" "}
          <strong>superadmin</strong> can save these values.
        </p>
      </div>

      <AdminCard
        title="Overtime configuration"
        description="These values drive overtime calculation, UI behavior, and export output."
      >
        <div className="space-y-6">
          <AdminSection
            title="Normal mode"
            subtitle="Base behavior when no overlays are active."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField
                label="Day-before-off reduction (hours)"
                hint="Hours reduced from duty end on day before weekly off."
              >
                <input
                  className="input-field"
                  type="number"
                  step={0.5}
                  min={0}
                  max={8}
                  value={settings.normal.dayBeforeOffReductionHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      normal: {
                        ...settings.normal,
                        dayBeforeOffReductionHours: Number(e.target.value),
                      },
                    })
                  }
                />
              </AdminField>
              <AdminField
                label="Enable Night Duty selection"
                hint="Controls whether users choose night duty days."
              >
                <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/50">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-[#003594] focus:ring-[#003594]"
                    checked={settings.shifts.enableNightDuty}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shifts: {
                          ...settings.shifts,
                          enableNightDuty: e.target.checked,
                        },
                      })
                    }
                  />
                </label>
              </AdminField>
              <AdminField
                label="Enable Morning Shift selection"
                hint="Controls whether users choose morning shift days."
              >
                <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/50">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-[#003594] focus:ring-[#003594]"
                    checked={settings.shifts.enableMorningShift}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shifts: {
                          ...settings.shifts,
                          enableMorningShift: e.target.checked,
                        },
                      })
                    }
                  />
                </label>
              </AdminField>
            </div>
          </AdminSection>

          <AdminSection
            title="Cutoff thresholds"
            subtitle="Rounding and odd-shift threshold configuration."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="In-time threshold">
                <input
                  className="input-field"
                  type="number"
                  value={settings.cutoffThresholds.inTimeThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cutoffThresholds: {
                        ...settings.cutoffThresholds,
                        inTimeThreshold: Number(e.target.value),
                      },
                    })
                  }
                />
              </AdminField>
              <AdminField label="Out-time threshold">
                <input
                  className="input-field"
                  type="number"
                  value={settings.cutoffThresholds.outTimeThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cutoffThresholds: {
                        ...settings.cutoffThresholds,
                        outTimeThreshold: Number(e.target.value),
                      },
                    })
                  }
                />
              </AdminField>
              <AdminField label="Odd shift day minimum hours">
                <input
                  className="input-field"
                  type="number"
                  step={0.5}
                  value={settings.cutoffThresholds.oddShiftDayMinHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cutoffThresholds: {
                        ...settings.cutoffThresholds,
                        oddShiftDayMinHours: Number(e.target.value),
                      },
                    })
                  }
                />
              </AdminField>
              <AdminField label="Odd shift night minimum hours">
                <input
                  className="input-field"
                  type="number"
                  step={0.5}
                  value={settings.cutoffThresholds.oddShiftNightMinHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cutoffThresholds: {
                        ...settings.cutoffThresholds,
                        oddShiftNightMinHours: Number(e.target.value),
                      },
                    })
                  }
                />
              </AdminField>
              <AdminField label="After duty grace (minutes)">
                <input
                  className="input-field"
                  type="number"
                  value={settings.cutoffThresholds.afterDutyGraceMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cutoffThresholds: {
                        ...settings.cutoffThresholds,
                        afterDutyGraceMinutes: Number(e.target.value),
                      },
                    })
                  }
                />
              </AdminField>
            </div>
          </AdminSection>

          <AdminSection
            title="Special window"
            subtitle="Window based time cutoffs."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Window start">
                <input
                  className="input-field font-mono"
                  placeholder="04:50"
                  value={settings.cutoffThresholds.specialWindowStart}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cutoffThresholds: {
                        ...settings.cutoffThresholds,
                        specialWindowStart: e.target.value,
                      },
                    })
                  }
                />
              </AdminField>
              <AdminField label="Window end">
                <input
                  className="input-field font-mono"
                  placeholder="06:00"
                  value={settings.cutoffThresholds.specialWindowEnd}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cutoffThresholds: {
                        ...settings.cutoffThresholds,
                        specialWindowEnd: e.target.value,
                      },
                    })
                  }
                />
              </AdminField>
              <AdminField label="Lower cutoff">
                <input
                  className="input-field font-mono"
                  placeholder="05:15"
                  value={settings.cutoffThresholds.specialWindowLowerCutoff}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cutoffThresholds: {
                        ...settings.cutoffThresholds,
                        specialWindowLowerCutoff: e.target.value,
                      },
                    })
                  }
                />
              </AdminField>
              <AdminField label="Upper cutoff">
                <input
                  className="input-field font-mono"
                  placeholder="05:35"
                  value={settings.cutoffThresholds.specialWindowUpperCutoff}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cutoffThresholds: {
                        ...settings.cutoffThresholds,
                        specialWindowUpperCutoff: e.target.value,
                      },
                    })
                  }
                />
              </AdminField>
            </div>
          </AdminSection>

          {(
            [
              ["winterOverlay", "Winter overlay"],
              ["doubleOffOverlay", "Double off overlay"],
              ["noFridayOverlay", "No friday overlay"],
              ["eightHourOverlay", "8-hour overlay"],
            ] as const
          ).map(([key, title]) => (
            <AdminSection key={key} title={title} subtitle="Enable and define date range.">
              <div className="grid gap-4 sm:grid-cols-3">
                <AdminField label="Enabled">
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-[#003594] focus:ring-[#003594]"
                      checked={settings[key].enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          [key]: { ...settings[key], enabled: e.target.checked },
                        })
                      }
                    />
                  </label>
                </AdminField>
                <AdminField label="Start day">
                  <input
                    className="input-field"
                    type="number"
                    min={1}
                    max={31}
                    value={settings[key].range.startDay}
                    onChange={(e) =>
                      setRange(key, "startDay", Number(e.target.value))
                    }
                  />
                </AdminField>
                <AdminField label="End day">
                  <input
                    className="input-field"
                    type="number"
                    min={1}
                    max={31}
                    value={settings[key].range.endDay}
                    onChange={(e) => setRange(key, "endDay", Number(e.target.value))}
                  />
                </AdminField>
              </div>
            </AdminSection>
          ))}

          {(["normal", "winter"] as const).map((modeKey) => (
            <AdminSection
              key={modeKey}
              title={`${modeKey[0].toUpperCase()}${modeKey.slice(1)} placeholders`}
              subtitle="Duty placeholders per shift."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["regularIn", "Regular in"],
                    ["regularOut", "Regular out"],
                    ["nightIn", "Night in"],
                    ["nightOut", "Night out"],
                    ["morningIn", "Morning in"],
                    ["morningOut", "Morning out"],
                  ] as const
                ).map(([field, label]) => (
                  <AdminField key={field} label={label}>
                    <input
                      className="input-field"
                      value={settings.placeholders[modeKey][field]}
                      onChange={(e) =>
                        setShiftPlaceholder("placeholders", modeKey, field, e.target.value)
                      }
                    />
                  </AdminField>
                ))}
              </div>
            </AdminSection>
          ))}

          <AdminSection
            title="8-hour overlay defaults"
            subtitle="Default duty values when 8-hour mode is active."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["regularIn", "Regular in"],
                  ["regularOut", "Regular out"],
                  ["nightIn", "Night in"],
                  ["nightOut", "Night out"],
                  ["morningIn", "Morning in"],
                  ["morningOut", "Morning out"],
                ] as const
              ).map(([field, label]) => (
                <AdminField key={field} label={label}>
                  <input
                    className="input-field"
                    value={settings.eightHourOverlay.defaults[field]}
                    onChange={(e) =>
                      setShiftPlaceholder("eightHourOverlay", "defaults", field, e.target.value)
                    }
                  />
                </AdminField>
              ))}
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
