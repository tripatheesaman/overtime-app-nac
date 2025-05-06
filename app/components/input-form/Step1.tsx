import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFormContext } from "@/app/context/FormContext"
import { FormData } from "@/app/types/InputFormType"

const schema = z.object({
    name: z.string().min(2, "Name should be at least 3 characters long!"),
    staffId: z.string().min(4, "Staff ID should be at least 4 characters long!"),
    designation: z.string().min(6, "Designation should be at least 6 characters long!")
})

export const Step1 = () => {
  const { formData, setFormData, setStep } = useFormContext()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: formData,
    resolver: zodResolver(schema)
  });

  const onSubmit = (data: Partial<FormData>) => {
    setFormData(data);
    setStep(2);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Personal Information
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Please provide your personal details to proceed with the overtime calculation.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name
          </label>
          <input
            id="name"
            {...register("name")}
            placeholder="Enter Your Full Name"
            className="input-field"
          />
          {errors.name?.message && (
            <p className="mt-1 text-sm text-[#D4483B]">
              {typeof errors.name?.message === "string" ? errors.name.message : ""}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="designation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Designation
          </label>
          <input
            id="designation"
            {...register("designation")}
            placeholder="Enter Your Designation"
            className="input-field"
          />
          {errors.designation?.message && (
            <p className="mt-1 text-sm text-[#D4483B]">
              {typeof errors.designation?.message === "string" ? errors.designation.message : ""}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Staff ID
          </label>
          <input
            id="staffId"
            {...register("staffId")}
            placeholder="Enter Your Staff ID"
            className="input-field"
          />
          {errors.staffId?.message && (
            <p className="mt-1 text-sm text-[#D4483B]">
              {typeof errors.staffId?.message === "string" ? errors.staffId.message : ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
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



