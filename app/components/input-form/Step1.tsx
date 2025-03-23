import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFormContext } from "@/app/context/FormContext"
import { FormData } from "@/app/types/InputFormType"

const schema = z.object({
    name:z.string().min(2,"Name should be atleast 3 characters long !"),
    staffId:z.string().min(4,"Staff ID should be atleast 4 characters long !"),
    designation:z.string().min(6,"Designation should be atleast 6 characters long !")
})
export const Step1 = ()=>{
const {formData,setFormData,setStep} = useFormContext()
const {
  register,
  handleSubmit,  
  formState: { errors },
} = useForm({
    defaultValues:formData,
    resolver:zodResolver(schema)
});

const onSubmit = (data: Partial<FormData>) => {
  setFormData(data); 
  setStep(2);
};


return (
  <form onSubmit={handleSubmit(onSubmit)} className="p-4">
    <h2 className="text-lg font-bold mb-4">Personal Information</h2>

    <input
      {...register("name")}
      placeholder="Enter Your Full Name"
      className="border p-2 rounded-md w-full mb-2"
    />
    {errors.name?.message && (
      <p className="text-red-500 text-sm">
        {typeof errors.name?.message === "string" ? errors.name.message : ""}
      </p>
    )}

    <input
      {...register("designation")}
      placeholder="Designation"
      className="border p-2 rounded-md w-full mb-2"
    />
    {errors.designation?.message && (
      <p className="text-red-500 text-sm">
        {typeof errors.designation?.message === "string"
          ? errors.designation.message
          : ""}
      </p>
    )}

    <input
      {...register("staffId")}
      placeholder="Staff ID"
      className="border p-2 rounded-md w-full mb-4"
    />
    {errors.staffId?.message && (
      <p className="text-red-500 text-sm">
        {typeof errors.staffId?.message === "string"
          ? errors.staffId.message
          : ""}
      </p>
    )}
    <div className="flex justify-between">
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded-md"
      >
        Next
      </button>
    </div>
  </form>
);  
}



