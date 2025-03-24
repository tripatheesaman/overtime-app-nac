import { Step1 } from "./Step1";
import { useFormContext } from "@/app/context/FormContext";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";

const FullStepForm = ()=>{
const { step } = useFormContext()

  return (
    <div className="flex flex-col justify-center items-center h-screen gap-y-6 p-8">
      <div className="titleContainer">
        <h1 className="font-bold text-5xl">Overtime Calculator</h1>
      </div>
      <div className="flex justify-center items-center border rounded-md w-full max-w-lg p-6">
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}
      </div>
    </div>
  );
};

export default FullStepForm
