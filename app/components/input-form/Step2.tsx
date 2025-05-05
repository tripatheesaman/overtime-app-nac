import { useFormContext } from "@/app/context/FormContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {z} from "zod"
import { FormData } from "@/app/types/InputFormType";

const schema = z.object({
  dutyStartTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format! Use HH:MM"),
  dutyEndTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format! Use HH:MM"),
  nightDutyStartTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format! Use HH:MM"),
  nightDutyEndTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format! Use HH:MM"),
  regularOffDay: z.enum([
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]),
});

const Step2 = ()=>{
const { step, setStep, formData, setFormData } = useFormContext();  
const {
    register, handleSubmit, formState:{errors}
} = useForm({
    defaultValues:{
        dutyStartTime: formData.dutyStartTime,
        dutyEndTime: formData.dutyEndTime,
        nightDutyStartTime: formData.nightDutyStartTime || "17:00",
        nightDutyEndTime: formData.nightDutyEndTime || "23:00",
        regularOffDay: formData.regularOffDay
    },
    resolver:zodResolver(schema)
})

const onPrevious = ()=>{
    setStep(1)
}

const onSubmit = (data:any)=>{
    setFormData(data)
    setStep(3)
}

return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Regular Duty Start Time
          </label>
          <input
            type="text"
            {...register("dutyStartTime")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="HH:MM"
          />
          {errors.dutyStartTime && (
            <p className="mt-1 text-sm text-red-600">
              {errors.dutyStartTime.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Regular Duty End Time
          </label>
          <input
            type="text"
            {...register("dutyEndTime")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="HH:MM"
          />
          {errors.dutyEndTime && (
            <p className="mt-1 text-sm text-red-600">
              {errors.dutyEndTime.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Night Duty Start Time
          </label>
          <input
            type="text"
            {...register("nightDutyStartTime")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="HH:MM"
          />
          {errors.nightDutyStartTime && (
            <p className="mt-1 text-sm text-red-600">
              {errors.nightDutyStartTime.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Night Duty End Time
          </label>
          <input
            type="text"
            {...register("nightDutyEndTime")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="HH:MM"
          />
          {errors.nightDutyEndTime && (
            <p className="mt-1 text-sm text-red-600">
              {errors.nightDutyEndTime.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Regular Off Day
          </label>
          <select
            {...register("regularOffDay")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            <p className="mt-1 text-sm text-red-600">
              {errors.regularOffDay.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between py-4">
        <button
          type="button"
          onClick={onPrevious}
          className="bg-gray-500 text-white px-4 py-2 rounded-md"
        >
          Previous
        </button>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Next
        </button>
      </div>
    </form>
  );
};

export default Step2;