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
    defaultValues:formData,
    resolver:zodResolver(schema)
})

const onSubmit = (data: Partial<FormData>)=>{
    setFormData(data)
    setStep(3)


}
const onPrevious = () => {
  setStep(step - 1);
};
 return (
   <form
     onSubmit={handleSubmit(onSubmit)}
     className="p-6 rounded-lg shadow-md max-w-md mx-auto"
   >
     <label className="block font-medium">Duty Start Time</label>
     <input
       {...register("dutyStartTime")}
       type="text"
       placeholder="HH:MM"
       className="border p-2 rounded-md w-full mt-1"
     />
     {errors.dutyStartTime && (
       <p className="text-red-500 text-sm">{errors.dutyStartTime.message}</p>
     )}

     {/* Out Time Input */}
     <label className="block font-medium mt-3">Duty End Time</label>
     <input
       {...register("dutyEndTime")}
       type="text"
       placeholder="HH:MM"
       className="border p-2 rounded-md w-full mt-1"
     />
     {errors.dutyEndTime && (
       <p className="text-red-500 text-sm">{errors.dutyEndTime.message}</p>
     )}

     <label className="block font-medium mt-3">Regular Off Day</label>
     <select
       {...register("regularOffDay")}
       className="border p-2 rounded-md w-full mt-1"
     >
       <option className="bg-blue-700" value="">
         Select Off Day
       </option>
       {[
         "Sunday",
         "Monday",
         "Tuesday",
         "Wednesday",
         "Thursday",
         "Friday",
         "Saturday",
       ].map((day) => (
         <option className="bg-blue-700" key={day} value={day}>
           {day}
         </option>
       ))}
     </select>
     {errors.regularOffDay && (
       <p className="text-red-500 text-sm">{errors.regularOffDay.message}</p>
     )}

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


export default Step2