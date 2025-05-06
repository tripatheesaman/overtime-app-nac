import { Step1 } from "./Step1";
import { useFormContext } from "@/app/context/FormContext";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";

const FullStepForm = () => {
  const { step } = useFormContext();

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-8rem)] gap-y-8 p-4 sm:p-8">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#D4483B] to-[#003594] bg-clip-text text-transparent">
          Overtime Calculator
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Calculate your overtime hours with precision
        </p>
      </div>
      
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === stepNumber
                      ? "bg-[#D4483B] text-white"
                      : step > stepNumber
                      ? "bg-[#003594] text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`w-12 h-0.5 ${
                      step > stepNumber ? "bg-[#003594]" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 />}
        </div>
      </div>
    </div>
  );
};

export default FullStepForm;
