import { useFormContext } from "@/app/context/FormContext";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";

const FullStepForm = () => {
  const { step } = useFormContext();

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 sm:px-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#003594] to-[#D4483B] bg-clip-text text-transparent">
          Overtime Calculator
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Calculate your overtime hours with precision
        </p>
      </div>
      
      <div className="w-full max-w-2xl flex-1 flex flex-col">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    step === stepNumber
                      ? "bg-[#003594] text-white shadow-lg"
                      : step > stepNumber
                      ? "bg-[#D4483B] text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 2 && (
                  <div
                    className={`w-12 h-0.5 transition-all duration-200 ${
                      step > stepNumber ? "bg-[#D4483B]" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {step === 2 && <Step2 />}
              {step === 3 && <Step3 />}
              {step === 4 && <Step4 />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullStepForm;
