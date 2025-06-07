import { useFormContext } from "@/app/context/FormContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ExtensionRecord {
  inTime: string | number | null;
  outTime: string | number | null;
}

const convertExcelTimeToHHMM = (value: string | number | undefined | null): string => {
  if (!value) return "";
  
  // If it's already a number (Excel time value), return as is
  if (typeof value === "number") {
    return value.toString();
  }
  
  // If it's a string in HH:MM format, convert to Excel time
  if (typeof value === "string") {
    // Remove any leading/trailing spaces and quotes
    const cleanValue = value.trim().replace(/^['"]|['"]$/g, "");
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(cleanValue)) {
      const [hours, minutes] = cleanValue.split(":").map(Number);
      const excelTime = (hours + minutes / 60) / 24;
      return excelTime.toString();
    }
  }
  
  return "";
};

const Step3 = () => {
  const { setStep, setFormData } = useFormContext();
  const router = useRouter();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check for extension data in URL
    const searchParams = new URLSearchParams(window.location.search);
    const extensionData = searchParams.get('extensionData');
    
    if (extensionData) {
      try {
        const parsedData = JSON.parse(extensionData);
        
        // Check if the data has the expected structure
        if (parsedData && parsedData.inOutTimes && Array.isArray(parsedData.inOutTimes)) {
          const formattedData = parsedData.inOutTimes.map((record: ExtensionRecord) => ({
            inTime: record.inTime ? convertExcelTimeToHHMM(record.inTime) : "",
            outTime: record.outTime ? convertExcelTimeToHHMM(record.outTime) : "",
          }));
          
          // Set all form data at once
          setFormData({ 
            inOutTimes: formattedData,
            regularOffDay: parsedData.regularOffDay || "Saturday",
            name: parsedData.name || "",
            staffId: parsedData.staffId || "",
            designation: parsedData.designation || "",
            // Set default values for other required fields
            dutyStartTime: "09:00",
            dutyEndTime: "17:00",
            nightDutyStartTime: "22:00",
            nightDutyEndTime: "06:00",
            morningShiftStartTime: "06:00",
            morningShiftEndTime: "14:00",
            nightDutyDays: [],
            morningShiftDays: []
          });
          
          // Remove the extension data from URL using Next.js router
          router.replace(window.location.pathname);
          
          // Automatically proceed to Step 4
          setStep(4);
        } else {
          console.error('Invalid extension data structure:', parsedData);
        }
      } catch (error) {
        console.error('Error parsing extension data:', error);
      }
    }
  }, [setFormData, router, setStep]);

  return null; // Don't render anything since we're auto-proceeding
};

export default Step3;
