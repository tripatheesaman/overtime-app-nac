import { createContext, useContext, useState } from "react";
import { ReactNode } from "react";
import { FormData } from "@/app/types/InputFormType";
interface ContextType{
    formData:FormData
    setFormData:(data:Partial<FormData>)=>void
    step:number
    setStep:(step:number)=>void
}

interface FormContextProviderProps{
    children:ReactNode
}
const FormContext = createContext<ContextType | undefined>(undefined)

export const FormContextProvider:React.FC<FormContextProviderProps> = ({children})=>{
    const [formData, setFormData] = useState<FormData>({name:"",staffId:"",regularOffDay:"Saturday",designation:"",dutyStartTime:"",dutyEndTime:"",inOutTimes:[], nightDutyDays:[]})
    const [step, setStep] = useState(1)

    const updateFormData = (data:Partial<FormData>)=>{
        setFormData((prev)=>({...prev,...data}))
    }

    return(
        <FormContext.Provider value={{formData,setFormData:updateFormData,step,setStep}}>
            {children}
        </FormContext.Provider>
    )

}

export const useFormContext = ()=>{
    const formContext = useContext(FormContext)
    if (formContext === undefined) throw new Error("useFormContext must be used within FormContextProvider !")
    return formContext
}
