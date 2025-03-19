import { Step1 } from "./Step1";
import { useFormContext } from "@/app/context/FormContext";
import Step2 from "./Step2";

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
      </div>
    </div>
  );
};

export default FullStepForm
