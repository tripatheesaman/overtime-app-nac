import { useFormContext } from "@/app/context/FormContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";

const baseTimeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

interface Department {
  id: number;
  name: string;
  code: string;
  templateFile: string;
}

const schema = z
  .object({
    departmentId: z.number().min(1, "Please select a department"),
    dutyStartTime: z
      .string()
      .regex(baseTimeRegex, "Invalid time format! Use HH:MM"),
    dutyEndTime: z
      .string()
      .regex(baseTimeRegex, "Invalid time format! Use HH:MM"),
    nightDutyEnabled: z.boolean(),
    nightDutyStartTime: z.string().optional(),
    nightDutyEndTime: z.string().optional(),
    morningShiftEnabled: z.boolean(),
    morningShiftStartTime: z.string().optional(),
    morningShiftEndTime: z.string().optional(),
    eightHourDutyStartTime: z.string().optional(),
    eightHourDutyEndTime: z.string().optional(),
    eightHourNightDutyStartTime: z.string().optional(),
    eightHourNightDutyEndTime: z.string().optional(),
    eightHourMorningShiftStartTime: z.string().optional(),
    eightHourMorningShiftEndTime: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.nightDutyEnabled) {
      if (!data.nightDutyStartTime || !baseTimeRegex.test(data.nightDutyStartTime)) {
        ctx.addIssue({
          path: ["nightDutyStartTime"],
          code: z.ZodIssueCode.custom,
          message: "Invalid time format! Use HH:MM",
        });
      }
      if (!data.nightDutyEndTime || !baseTimeRegex.test(data.nightDutyEndTime)) {
        ctx.addIssue({
          path: ["nightDutyEndTime"],
          code: z.ZodIssueCode.custom,
          message: "Invalid time format! Use HH:MM",
        });
      }
    }
    if (data.morningShiftEnabled) {
      if (!data.morningShiftStartTime || !baseTimeRegex.test(data.morningShiftStartTime)) {
        ctx.addIssue({
          path: ["morningShiftStartTime"],
          code: z.ZodIssueCode.custom,
          message: "Invalid time format! Use HH:MM",
        });
      }
      if (!data.morningShiftEndTime || !baseTimeRegex.test(data.morningShiftEndTime)) {
        ctx.addIssue({
          path: ["morningShiftEndTime"],
          code: z.ZodIssueCode.custom,
          message: "Invalid time format! Use HH:MM",
        });
      }
    }
    const requiresEightHourTimes = [
      { key: "eightHourDutyStartTime", value: data.eightHourDutyStartTime },
      { key: "eightHourDutyEndTime", value: data.eightHourDutyEndTime },
      { key: "eightHourNightDutyStartTime", value: data.eightHourNightDutyStartTime },
      { key: "eightHourNightDutyEndTime", value: data.eightHourNightDutyEndTime },
      { key: "eightHourMorningShiftStartTime", value: data.eightHourMorningShiftStartTime },
      { key: "eightHourMorningShiftEndTime", value: data.eightHourMorningShiftEndTime },
    ];
    for (const item of requiresEightHourTimes) {
      if (item.value && !baseTimeRegex.test(item.value)) {
        ctx.addIssue({
          path: [item.key],
          code: z.ZodIssueCode.custom,
          message: "Invalid time format! Use HH:MM",
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

const Step2 = () => {
  const { setStep, formData, setFormData } = useFormContext();
  const [nightDutyEnabled, setNightDutyEnabled] = useState(false);
  const [morningShiftEnabled, setMorningShiftEnabled] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [isEightHourOverlayEnabled, setIsEightHourOverlayEnabled] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
    setError,
  } = useForm<FormValues>({
    defaultValues: {
      departmentId: formData.departmentId || 0,
      dutyStartTime: formData.dutyStartTime || "10:00",
      dutyEndTime: formData.dutyEndTime || "17:00",
      nightDutyEnabled: false,
      nightDutyStartTime: formData.nightDutyStartTime || "",
      nightDutyEndTime: formData.nightDutyEndTime || "",
      morningShiftEnabled: false,
      morningShiftStartTime: formData.morningShiftStartTime || "",
      morningShiftEndTime: formData.morningShiftEndTime || "",
      eightHourDutyStartTime: formData.eightHourDutyStartTime || "",
      eightHourDutyEndTime: formData.eightHourDutyEndTime || "",
      eightHourNightDutyStartTime: formData.eightHourNightDutyStartTime || "",
      eightHourNightDutyEndTime: formData.eightHourNightDutyEndTime || "",
      eightHourMorningShiftStartTime: formData.eightHourMorningShiftStartTime || "",
      eightHourMorningShiftEndTime: formData.eightHourMorningShiftEndTime || "",
    },
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setNightDutyEnabled(false);
    setMorningShiftEnabled(false);
    setValue("nightDutyEnabled", false);
    setValue("morningShiftEnabled", false);
  }, [setValue]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();
        if (!data?.success || !data.data) return;
        const settings = data.data;
        setIsEightHourOverlayEnabled(Boolean(settings.eightHourOverlay?.enabled));
        const normal = settings.placeholders?.normal;
        const eightHourDefaults = settings.eightHourOverlay?.defaults;
        if (!normal) return;
        if (!formData.dutyStartTime) setValue("dutyStartTime", normal.regularIn);
        if (!formData.dutyEndTime) setValue("dutyEndTime", normal.regularOut);
        if (!formData.nightDutyStartTime) setValue("nightDutyStartTime", normal.nightIn);
        if (!formData.nightDutyEndTime) setValue("nightDutyEndTime", normal.nightOut);
        if (!formData.morningShiftStartTime) setValue("morningShiftStartTime", normal.morningIn);
        if (!formData.morningShiftEndTime) setValue("morningShiftEndTime", normal.morningOut);
        if (eightHourDefaults) {
          if (!formData.eightHourDutyStartTime) setValue("eightHourDutyStartTime", eightHourDefaults.regularIn);
          if (!formData.eightHourDutyEndTime) setValue("eightHourDutyEndTime", eightHourDefaults.regularOut);
          if (!formData.eightHourNightDutyStartTime) setValue("eightHourNightDutyStartTime", eightHourDefaults.nightIn);
          if (!formData.eightHourNightDutyEndTime) setValue("eightHourNightDutyEndTime", eightHourDefaults.nightOut);
          if (!formData.eightHourMorningShiftStartTime) setValue("eightHourMorningShiftStartTime", eightHourDefaults.morningIn);
          if (!formData.eightHourMorningShiftEndTime) setValue("eightHourMorningShiftEndTime", eightHourDefaults.morningOut);
        }
      } catch {
        return;
      }
    };
    fetchSettings();
  }, [setValue, formData]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch("/api/department");
        const data = await response.json();
        if (data.success) {
          setDepartments(data.data);
          
          // Set Ground Support Department as default if no department is selected
          if (!formData.departmentId || formData.departmentId === 0) {
            const groundSupportDept = data.data.find(
              (dept: Department) => 
                dept.code?.toLowerCase() === "grsd" || 
                dept.name?.toLowerCase().includes("ground support")
            );
            if (groundSupportDept) {
              setValue("departmentId", groundSupportDept.id);
              setFormData({ departmentId: groundSupportDept.id });
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [setValue, setFormData, formData.departmentId]);

  const selectedDepartmentId = watch("departmentId");

  useEffect(() => {
    if (!selectedDepartmentId || selectedDepartmentId === 0) return;
    const selected = departments.find((d) => d.id === selectedDepartmentId);
    if (!selected) return;

    const current = getValues();
    setFormData({
      departmentId: selectedDepartmentId,
      dutyStartTime: current.dutyStartTime,
      dutyEndTime: current.dutyEndTime,
      nightDutyStartTime: current.nightDutyStartTime ?? "",
      nightDutyEndTime: current.nightDutyEndTime ?? "",
      morningShiftStartTime: current.morningShiftStartTime ?? "",
      morningShiftEndTime: current.morningShiftEndTime ?? "",
      eightHourDutyStartTime: current.eightHourDutyStartTime ?? "",
      eightHourDutyEndTime: current.eightHourDutyEndTime ?? "",
      eightHourNightDutyStartTime: current.eightHourNightDutyStartTime ?? "",
      eightHourNightDutyEndTime: current.eightHourNightDutyEndTime ?? "",
      eightHourMorningShiftStartTime: current.eightHourMorningShiftStartTime ?? "",
      eightHourMorningShiftEndTime: current.eightHourMorningShiftEndTime ?? "",
    });
  }, [selectedDepartmentId, departments, setFormData, getValues]);

  const onSubmit = (data: FormValues) => {
    if (isEightHourOverlayEnabled) {
      if (!data.eightHourDutyStartTime || !baseTimeRegex.test(data.eightHourDutyStartTime)) {
        setError("eightHourDutyStartTime", {
          type: "custom",
          message: "Required in HH:MM for 8 hour overlay",
        });
        return;
      }
      if (!data.eightHourDutyEndTime || !baseTimeRegex.test(data.eightHourDutyEndTime)) {
        setError("eightHourDutyEndTime", {
          type: "custom",
          message: "Required in HH:MM for 8 hour overlay",
        });
        return;
      }
      if (nightDutyEnabled) {
        if (
          !data.eightHourNightDutyStartTime ||
          !baseTimeRegex.test(data.eightHourNightDutyStartTime)
        ) {
          setError("eightHourNightDutyStartTime", {
            type: "custom",
            message: "Required in HH:MM when Night Duty is enabled",
          });
          return;
        }
        if (
          !data.eightHourNightDutyEndTime ||
          !baseTimeRegex.test(data.eightHourNightDutyEndTime)
        ) {
          setError("eightHourNightDutyEndTime", {
            type: "custom",
            message: "Required in HH:MM when Night Duty is enabled",
          });
          return;
        }
      }
      if (morningShiftEnabled) {
        if (
          !data.eightHourMorningShiftStartTime ||
          !baseTimeRegex.test(data.eightHourMorningShiftStartTime)
        ) {
          setError("eightHourMorningShiftStartTime", {
            type: "custom",
            message: "Required in HH:MM when Morning Shift is enabled",
          });
          return;
        }
        if (
          !data.eightHourMorningShiftEndTime ||
          !baseTimeRegex.test(data.eightHourMorningShiftEndTime)
        ) {
          setError("eightHourMorningShiftEndTime", {
            type: "custom",
            message: "Required in HH:MM when Morning Shift is enabled",
          });
          return;
        }
      }
    }
    const hasAnyShiftEnabled = nightDutyEnabled || morningShiftEnabled;
    setFormData({
      // Preserve existing employee data from extension
      departmentId: data.departmentId,
      dutyStartTime: data.dutyStartTime,
      dutyEndTime: data.dutyEndTime,
      nightDutyStartTime: nightDutyEnabled ? data.nightDutyStartTime : "",
      nightDutyEndTime: nightDutyEnabled ? data.nightDutyEndTime : "",
      morningShiftStartTime: morningShiftEnabled ? data.morningShiftStartTime : "",
      morningShiftEndTime: morningShiftEnabled ? data.morningShiftEndTime : "",
      eightHourDutyStartTime: isEightHourOverlayEnabled ? data.eightHourDutyStartTime : "",
      eightHourDutyEndTime: isEightHourOverlayEnabled ? data.eightHourDutyEndTime : "",
      eightHourNightDutyStartTime:
        isEightHourOverlayEnabled && nightDutyEnabled
          ? data.eightHourNightDutyStartTime
          : "",
      eightHourNightDutyEndTime:
        isEightHourOverlayEnabled && nightDutyEnabled
          ? data.eightHourNightDutyEndTime
          : "",
      eightHourMorningShiftStartTime:
        isEightHourOverlayEnabled && morningShiftEnabled
          ? data.eightHourMorningShiftStartTime
          : "",
      eightHourMorningShiftEndTime:
        isEightHourOverlayEnabled && morningShiftEnabled
          ? data.eightHourMorningShiftEndTime
          : "",
    });
    setStep(hasAnyShiftEnabled ? 3 : 4);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Duty Schedule
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please select your department and set your duty timings.
        </p>
      </div>

      {/* Employee Information Display (Read-only if from extension) */}
      {(formData.name || formData.staffId || formData.designation) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Employee Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {formData.name && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Name: </span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.name}</span>
              </div>
            )}
            {formData.staffId && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Staff ID: </span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.staffId}</span>
              </div>
            )}
            {formData.designation && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Designation: </span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.designation}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Department Selection */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Department Selection
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Department <span className="text-[#D4483B]">*</span>
          </label>
          <select
            {...register("departmentId", { valueAsNumber: true })}
            className="input-field"
            disabled={loadingDepartments}
          >
            <option value={0}>
              {loadingDepartments ? "Loading departments..." : "Select a department"}
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          {errors.departmentId && (
            <p className="mt-1 text-sm text-[#D4483B]">
              {String(errors.departmentId.message)}
            </p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Regular Duty
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Time
            </label>
            <input
              type="text"
              {...register("dutyStartTime")}
              className="input-field"
              placeholder="HH:MM"
            />
            {errors.dutyStartTime && (
              <p className="mt-1 text-sm text-[#D4483B]">
                {String(errors.dutyStartTime.message)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Time
            </label>
            <input
              type="text"
              {...register("dutyEndTime")}
              className="input-field"
              placeholder="HH:MM"
            />
            {errors.dutyEndTime && (
              <p className="mt-1 text-sm text-[#D4483B]">
                {String(errors.dutyEndTime.message)}
              </p>
            )}
          </div>
        </div>
        {isEightHourOverlayEnabled && (
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">
              8 Hour Shift Time
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Regular Start Time
                </label>
                <input
                  type="text"
                  {...register("eightHourDutyStartTime")}
                  className="input-field"
                  placeholder="HH:MM"
                />
                {errors.eightHourDutyStartTime && (
                  <p className="mt-1 text-sm text-[#D4483B]">
                    {String(errors.eightHourDutyStartTime.message)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Regular End Time
                </label>
                <input
                  type="text"
                  {...register("eightHourDutyEndTime")}
                  className="input-field"
                  placeholder="HH:MM"
                />
                {errors.eightHourDutyEndTime && (
                  <p className="mt-1 text-sm text-[#D4483B]">
                    {String(errors.eightHourDutyEndTime.message)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <label className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={nightDutyEnabled}
            onChange={e => setNightDutyEnabled(e.target.checked)}
            className="w-5 h-5 text-[#003594] border-gray-300 rounded focus:ring-[#003594]"
          />
          <span className="text-sm font-medium">Enable Night Duty</span>
        </label>

        <label className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={morningShiftEnabled}
            onChange={e => setMorningShiftEnabled(e.target.checked)}
            className="w-5 h-5 text-[#003594] border-gray-300 rounded focus:ring-[#003594]"
          />
          <span className="text-sm font-medium">Enable Morning Shift</span>
        </label>
      </div>

      {nightDutyEnabled && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Night Duty
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time
              </label>
              <input
                type="text"
                {...register("nightDutyStartTime")}
                className="input-field"
                placeholder="HH:MM"
              />
              {errors.nightDutyStartTime && (
                <p className="mt-1 text-sm text-[#D4483B]">
                  {String(errors.nightDutyStartTime.message)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="text"
                {...register("nightDutyEndTime")}
                className="input-field"
                placeholder="HH:MM"
              />
              {errors.nightDutyEndTime && (
                <p className="mt-1 text-sm text-[#D4483B]">
                  {String(errors.nightDutyEndTime.message)}
                </p>
              )}
            </div>
          </div>
          {isEightHourOverlayEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  8 Hour Night Start Time
                </label>
                <input
                  type="text"
                  {...register("eightHourNightDutyStartTime")}
                  className="input-field"
                  placeholder="HH:MM"
                />
                {errors.eightHourNightDutyStartTime && (
                  <p className="mt-1 text-sm text-[#D4483B]">
                    {String(errors.eightHourNightDutyStartTime.message)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  8 Hour Night End Time
                </label>
                <input
                  type="text"
                  {...register("eightHourNightDutyEndTime")}
                  className="input-field"
                  placeholder="HH:MM"
                />
                {errors.eightHourNightDutyEndTime && (
                  <p className="mt-1 text-sm text-[#D4483B]">
                    {String(errors.eightHourNightDutyEndTime.message)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {morningShiftEnabled && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Morning Shift
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time
              </label>
              <input
                type="text"
                {...register("morningShiftStartTime")}
                className="input-field"
                placeholder="HH:MM"
              />
              {errors.morningShiftStartTime && (
                <p className="mt-1 text-sm text-[#D4483B]">
                  {String(errors.morningShiftStartTime.message)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="text"
                {...register("morningShiftEndTime")}
                className="input-field"
                placeholder="HH:MM"
              />
              {errors.morningShiftEndTime && (
                <p className="mt-1 text-sm text-[#D4483B]">
                  {String(errors.morningShiftEndTime.message)}
                </p>
              )}
            </div>
          </div>
          {isEightHourOverlayEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  8 Hour Morning Start Time
                </label>
                <input
                  type="text"
                  {...register("eightHourMorningShiftStartTime")}
                  className="input-field"
                  placeholder="HH:MM"
                />
                {errors.eightHourMorningShiftStartTime && (
                  <p className="mt-1 text-sm text-[#D4483B]">
                    {String(errors.eightHourMorningShiftStartTime.message)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  8 Hour Morning End Time
                </label>
                <input
                  type="text"
                  {...register("eightHourMorningShiftEndTime")}
                  className="input-field"
                  placeholder="HH:MM"
                />
                {errors.eightHourMorningShiftEndTime && (
                  <p className="mt-1 text-sm text-[#D4483B]">
                    {String(errors.eightHourMorningShiftEndTime.message)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-8">
        <button
          type="submit"
          className="btn-primary"
        >
          Next Step
        </button>
      </div>
    </form>
  );
};

export default Step2;