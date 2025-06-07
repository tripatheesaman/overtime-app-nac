import { useFormContext } from "@/app/context/FormContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ExtensionRecord {
  inTime: string | number | null;
  outTime: string | number | null;
}

const convertExcelTimeToHHMM = (value: string | number | undefined | null): string => {
  if (!value) return "";
  
  // If it's already a number (Excel time value), convert to HH:MM
  if (typeof value === "number") {
    const totalMinutes = value * 24 * 60; // Convert fraction to total minutes
    const hours = Math.floor(totalMinutes / 60); // Extract hours
    const minutes = Math.round(totalMinutes % 60); // Extract minutes
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }
  
  // If it's a string in HH:MM format, convert to Excel time
  if (typeof value === "string") {
    // Remove any leading/trailing spaces and quotes
    const cleanValue = value.trim().replace(/^['"]|['"]$/g, "");
    
    // Handle both HH:MM and H:MM formats
    const timePattern = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;
    if (timePattern.test(cleanValue)) {
      const [hours, minutes] = cleanValue.split(":").map(Number);
      const excelTime = (hours + minutes / 60) / 24;
      return excelTime.toString();
    }
  }
  
  return "";
};

const Step3 = () => {
  const { setStep, setFormData, formData } = useFormContext();
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
          
          // Set all form data at once, preserving existing duty times
          setFormData({ 
            inOutTimes: formattedData,
            regularOffDay: parsedData.regularOffDay || "Saturday",
            name: parsedData.name || "",
            staffId: parsedData.staffId || "",
            designation: parsedData.designation || "",
            // Use existing duty times from form data
            dutyStartTime: formData.dutyStartTime,
            dutyEndTime: formData.dutyEndTime,
            nightDutyStartTime: formData.nightDutyStartTime,
            nightDutyEndTime: formData.nightDutyEndTime,
            morningShiftStartTime: formData.morningShiftStartTime,
            morningShiftEndTime: formData.morningShiftEndTime,
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
  }, [setFormData, router, setStep, formData]);

  return null;
};

export default Step3;
