import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { FormData } from "@/app/types/InputFormType";

interface ContextType{
    formData:FormData
    setFormData:(data:Partial<FormData>)=>void
    step:number
    setStep:(step:number)=>void
}

interface FormContextProviderProps{
    children:React.ReactNode
}
const FormContext = createContext<ContextType | undefined>(undefined)

export const FormContextProvider:React.FC<FormContextProviderProps> = ({children})=>{
    const [formData, setFormDataState] = useState<FormData>({
        name: "",
        staffId: "",
        regularOffDay: "Saturday",
        designation: "",
        departmentId: 0,
        dutyStartTime: "",
        dutyEndTime: "",
        nightDutyStartTime: "",
        nightDutyEndTime: "",
        morningShiftStartTime: "",
        morningShiftEndTime: "",
        inOutTimes: [],
        nightDutyDays: [],
        morningShiftDays: [],
    })
    const [step, setStep] = useState(2)

    const setFormData = useCallback((data: Partial<FormData>) => {
        setFormDataState((prev) => ({ ...prev, ...data }));
    }, []);

    // Check for extension data on initial load
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const searchParams = new URLSearchParams(window.location.search);
        const extensionData = searchParams.get('extensionData');
        
        if (extensionData) {
            try {
                const parsedData = JSON.parse(extensionData);
                if (parsedData) {
                    setFormData({
                        name: parsedData.name || "",
                        staffId: parsedData.staffId || "",
                        designation: parsedData.designation || "",
                        regularOffDay: parsedData.regularOffDay || "Saturday",
                        // Set default values for other required fields
                        dutyStartTime: "09:00",
                        dutyEndTime: "17:00",
                        nightDutyStartTime: "22:00",
                        nightDutyEndTime: "06:00",
                        morningShiftStartTime: "06:00",
                        morningShiftEndTime: "14:00",
                        inOutTimes: parsedData.inOutTimes || [],
                        nightDutyDays: [],
                        morningShiftDays: []
                    });
                }
            } catch (error) {
                console.error('Error parsing extension data:', error);
            }
        }
    }, [setFormData]);

    const contextValue = useMemo(
        () => ({ formData, setFormData, step, setStep }),
        [formData, setFormData, step, setStep]
    );

    return(
        <FormContext.Provider value={contextValue}>
            {children}
        </FormContext.Provider>
    )

}

export const useFormContext = ()=>{
    const formContext = useContext(FormContext)
    if (formContext === undefined) throw new Error("useFormContext must be used within FormContextProvider !")
    return formContext
}
