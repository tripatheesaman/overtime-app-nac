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
    regularOffDay: z.enum([
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]),
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
      regularOffDay: formData.regularOffDay,
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
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium" style={{ color: '#003594' }}>
            Regular Duty Start Time
          </label>
          <input
            type="text"
            {...register("dutyStartTime")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="HH:MM"
            style={{ borderColor: '#003594' }}
          />
          {errors.dutyStartTime && (
            <p className="mt-1 text-sm" style={{ color: '#D4483B' }}>
              {String(errors.dutyStartTime.message)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium" style={{ color: '#003594' }}>
            Regular Duty End Time
          </label>
          <input
            type="text"
            {...register("dutyEndTime")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="HH:MM"
            style={{ borderColor: '#003594' }}
          />
          {errors.dutyEndTime && (
            <p className="mt-1 text-sm" style={{ color: '#D4483B' }}>
              {String(errors.dutyEndTime.message)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium" style={{ color: '#003594' }}>
            Night Duty Start Time
          </label>
          <input
            type="text"
            {...register("nightDutyStartTime")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="HH:MM"
            style={{ borderColor: '#003594' }}
          />
          {errors.nightDutyStartTime && (
            <p className="mt-1 text-sm" style={{ color: '#D4483B' }}>
              {String(errors.nightDutyStartTime.message)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium" style={{ color: '#003594' }}>
            Night Duty End Time
          </label>
          <input
            type="text"
            {...register("nightDutyEndTime")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="HH:MM"
            style={{ borderColor: '#003594' }}
          />
          {errors.nightDutyEndTime && (
            <p className="mt-1 text-sm" style={{ color: '#D4483B' }}>
              {String(errors.nightDutyEndTime.message)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium" style={{ color: '#003594' }}>
            <input
              type="checkbox"
              checked={morningShiftEnabled}
              onChange={e => setMorningShiftEnabled(e.target.checked)}
              className="mr-2"
              style={{ accentColor: '#003594' }}
            />
            Enable Morning Shift
          </label>
        </div>

        {morningShiftEnabled && (
          <>
            <div>
              <label className="block text-sm font-medium" style={{ color: '#003594' }}>
                Morning Shift Start Time
              </label>
              <input
                type="text"
                {...register("morningShiftStartTime")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="HH:MM"
                style={{ borderColor: '#003594' }}
              />
              {errors.morningShiftStartTime && (
                <p className="mt-1 text-sm" style={{ color: '#D4483B' }}>
                  {String(errors.morningShiftStartTime.message)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: '#003594' }}>
                Morning Shift End Time
              </label>
              <input
                type="text"
                {...register("morningShiftEndTime")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="HH:MM"
                style={{ borderColor: '#003594' }}
              />
              {errors.morningShiftEndTime && (
                <p className="mt-1 text-sm" style={{ color: '#D4483B' }}>
                  {String(errors.morningShiftEndTime.message)}
                </p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium" style={{ color: '#003594' }}>
            Regular Off Day
          </label>
          <select
            {...register("regularOffDay")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            style={{ borderColor: '#003594' }}
          >
            <option value="Sunday">Sunday</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
          </select>
          {errors.regularOffDay && (
            <p className="mt-1 text-sm" style={{ color: '#D4483B' }}>
              {String(errors.regularOffDay.message)}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between py-4">
        <button
          type="button"
          onClick={onPrevious}
          className="px-4 py-2 rounded-md"
          style={{ backgroundColor: '#D4483B', color: 'white' }}
        >
          Previous
        </button>

        <button
          type="submit"
          className="px-4 py-2 rounded-md"
          style={{ backgroundColor: '#003594', color: 'white' }}
        >
          Next
        </button>
      </div>
    </form>
  );
};

export default Step2;