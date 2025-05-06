import { useFormContext } from "@/app/context/FormContext";
import { AttendanceRecord } from "@/app/types/InputFormType";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

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
  const [excelData, setExcelData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasExtensionData, setHasExtensionData] = useState<boolean>(false);

  useEffect(() => {
    // Check for extension data in URL
    const searchParams = new URLSearchParams(window.location.search);
    const extensionData = searchParams.get('extensionData');
    
    if (extensionData) {
      try {
        const parsedData = JSON.parse(extensionData);
        
        const formattedData = parsedData.map((record: ExtensionRecord) => ({
          inTime: record.inTime ? convertExcelTimeToHHMM(record.inTime) : "",
          outTime: record.outTime ? convertExcelTimeToHHMM(record.outTime) : "",
        }));
        
        
        setExcelData(formattedData);
        setFormData({ inOutTimes: formattedData });
        setHasExtensionData(true);
        
        // Remove the extension data from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } catch (error) {
        console.error('Error parsing extension data:', error);
      }
    }
  }, [setFormData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rawData: (string | undefined)[][] = XLSX.utils.sheet_to_json(
        sheet,
        { header: 1 }
      );

      const jsonData: AttendanceRecord[] = rawData
        .slice(0)
        .map((row) => ({
          inTime: row[0] ? convertExcelTimeToHHMM(row[0]) : "",
          outTime: row[1] ? convertExcelTimeToHHMM(row[1]) : "",
        }));

      setExcelData(jsonData);
      setFormData({ inOutTimes: jsonData });
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setStep(4);
  };

  const onPrevious = () => {
    setStep(2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {hasExtensionData ? "Captured Attendance Data" : "Upload Attendance File"}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {hasExtensionData 
            ? "Review the attendance data captured from the extension."
            : "Upload your Excel file containing attendance records."}
        </p>
      </div>

      {!hasExtensionData && (
        <div className="flex flex-col items-center justify-center w-full">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">XLSX or XLS</p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {excelData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Attendance Records
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Row
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      In Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Out Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {excelData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.inTime || 'Empty'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.outTime || 'Empty'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center space-x-2 text-[#003594]">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing...</span>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          className="btn-secondary"
        >
          Previous
        </button>
        <button
          onClick={handleSubmit}
          disabled={excelData.length === 0 || isLoading}
          className={`${
            isLoading || excelData.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "btn-primary"
          }`}
        >
          {isLoading ? "Processing..." : "Next Step"}
        </button>
      </div>
    </div>
  );
};

export default Step3;
