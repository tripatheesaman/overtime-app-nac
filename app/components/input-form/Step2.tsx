import { useFormContext } from "@/app/context/FormContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

const baseTimeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const schema = z
  .object({
    dutyStartTime: z
      .string()
      .regex(baseTimeRegex, "Invalid time format! Use HH:MM"),
    dutyEndTime: z
      .string()
      .regex(baseTimeRegex, "Invalid time format! Use HH:MM"),
    nightDutyStartTime: z
      .string()
      .regex(baseTimeRegex, "Invalid time format! Use HH:MM"),
    nightDutyEndTime: z
      .string()
      .regex(baseTimeRegex, "Invalid time format! Use HH:MM"),
    morningShiftEnabled: z.boolean(),
    morningShiftStartTime: z.string().optional(),
    morningShiftEndTime: z.string().optional(),
  })
  .superRefine((data, ctx) => {
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
  });

type FormValues = z.infer<typeof schema>;

const Step2 = () => {
  const { setStep, formData, setFormData } = useFormContext();
  const [morningShiftEnabled, setMorningShiftEnabled] = useState(!!formData.morningShiftStartTime);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      dutyStartTime: formData.dutyStartTime,
      dutyEndTime: formData.dutyEndTime,
      nightDutyStartTime: formData.nightDutyStartTime || "17:00",
      nightDutyEndTime: formData.nightDutyEndTime || "23:00",
      morningShiftEnabled: !!formData.morningShiftStartTime,
      morningShiftStartTime: formData.morningShiftStartTime || "06:00",
      morningShiftEndTime: formData.morningShiftEndTime || "14:00",
    },
    resolver: zodResolver(schema),
  });

  const onPrevious = () => {
    setStep(1);
  };

  const onSubmit = (data: FormValues) => {
    setFormData({
      ...data,
      morningShiftStartTime: morningShiftEnabled ? data.morningShiftStartTime : "",
      morningShiftEndTime: morningShiftEnabled ? data.morningShiftEndTime : "",
    });
    setStep(3);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Duty Schedule
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Please set your regular and night duty timings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Regular Duty Start Time
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Regular Duty End Time
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Night Duty Start Time
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Night Duty End Time
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
      </div>

      <div className="pt-4">
        <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={morningShiftEnabled}
            onChange={e => setMorningShiftEnabled(e.target.checked)}
            className="w-4 h-4 text-[#003594] border-gray-300 rounded focus:ring-[#003594]"
          />
          <span className="text-sm font-medium">Enable Morning Shift</span>
        </label>
      </div>

      {morningShiftEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Morning Shift Start Time
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Morning Shift End Time
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
      )}

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onPrevious}
          className="btn-secondary"
        >
          Previous
        </button>
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