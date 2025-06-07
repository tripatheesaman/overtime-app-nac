import { useFormContext } from "@/app/context/FormContext";
import { Step1 } from "./Step1";
import Step2 from "./Step2";
import Step4 from "./Step4";

const Form = () => {
  const { step } = useFormContext();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-center space-x-4 mb-8">
        <div
          className={`flex items-center ${
            step === 1 ? "text-[#003594]" : "text-gray-400"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 1
                ? "border-[#003594] bg-[#003594] text-white"
                : "border-gray-300"
            }`}
          >
            1
          </div>
          <span className="ml-2">Employee Details</span>
        </div>
        <div
          className={`flex items-center ${
            step === 2 ? "text-[#003594]" : "text-gray-400"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 2
                ? "border-[#003594] bg-[#003594] text-white"
                : "border-gray-300"
            }`}
          >
            2
          </div>
          <span className="ml-2">Duty Schedule</span>
        </div>
      </div>

      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 4 && <Step4 />}
    </div>
  );
};

export default Form; 