import { useFormContext } from "@/app/context/FormContext"
import { sendFormData } from "@/app/utils/api"
import { useState } from "react"

const Step4 = () =>{
    const {formData, setFormData, step, setStep} = useFormContext()
    const [isLoading, setIsLoading]  = useState<boolean>(false)
    const [selectedDays, setSelectedDays] = useState<number[]>(formData.nightDutyDays || [])
    const handleDayClick = (day:number)=>{
        setSelectedDays((prev)=>
            prev.includes(day)?prev.filter((d)=> (d !== day)):[...prev, day]
        )
    }

    const onPrevious = ()=>{
        setStep(step-1)
    }

    const handleSubmit = async()=>{
        setIsLoading(true)
        setFormData({nightDutyDays:selectedDays})
        const response = await sendFormData(formData)
        console.log(response)


    }

    return (
      <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">
          Select Night Duty Days
        </h2>

        <div className="grid grid-cols-7 gap-2 p-4 border rounded-md bg-gray-100">
          {[...Array(32)].map((_, index) => {
            const day = index + 1;
            const isSelected = selectedDays.includes(day);
            return (
            
              <button
                key={day}
                disabled= {isLoading}
                className={`w-10 h-10 flex items-center justify-center rounded-md ${
                  isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-white text-black border"
                }`}
                onClick={() => handleDayClick(day)}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* ✅ Navigation Buttons */}
        <div className="flex justify-between mt-4">
          <button
            onClick={onPrevious}
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Previous
          </button>

          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-md
                 bg-blue-500 text-white
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    );
    

}

export default Step4