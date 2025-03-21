import { createContext, useContext, useState } from "react";
import { ReactNode } from "react";

type dayOfWeek='Sunday'|'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'

export interface FormData{
    name:string
    designation:string
    staffId:string
    regularOffDay:dayOfWeek
    dutyStartTime:string
    dutyEndTime:string
    inOutTimes: AttendanceRecord[]
}
interface ContextType{
    formData:FormData
    setFormData:(data:Partial<FormData>)=>void
    step:number
    setStep:(step:number)=>void
}

export interface AttendanceRecord{
    inTime:string,
    outTime:string
}

interface FormContextProviderProps{
    children:ReactNode
}
const FormContext = createContext<ContextType | undefined>(undefined)

export const FormContextProvider:React.FC<FormContextProviderProps> = ({children})=>{
    const [formData, setFormData] = useState<FormData>({name:"",staffId:"",regularOffDay:"Saturday",designation:"",dutyStartTime:"",dutyEndTime:"",inOutTimes:[]})
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
