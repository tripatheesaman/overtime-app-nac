import { useFormContext } from "@/app/context/FormContext";
import { AttendanceRecord } from "@/app/types/InputFormType";
import { useState } from "react";
import * as XLSX from "xlsx";

const Step3 = () => {
  const { setStep, setFormData } = useFormContext();
  const [excelData, setExcelData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
          inTime: row[0] ? String(row[0]) : "",
          outTime: row[1] ? String(row[1]) : "",
        }))
        .filter((entry) => entry.inTime || entry.outTime);

      setExcelData(jsonData);
      setFormData({ inOutTimes: jsonData });
    };

    reader.readAsArrayBuffer(file);
  };


  const handleSubmit = async () => {
    setIsLoading(true);
    setStep(4)
  };

  const onPrevious = () => {
    setStep(2);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">
        Upload Attendance File
      </h2>

      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="mb-4"
      />

      {excelData.length > 0 && (
        <div className="mt-4 p-2 border rounded">
          <h3 className="font-medium">Upload Times:</h3>
        </div>
      )}

      {isLoading && (
        <div className="text-center mt-2">
          <p className="text-blue-500">Uploading... Please wait</p>
        </div>
      )}

      <div className="flex justify-between mt-4">
        <button
          onClick={onPrevious}
          className="bg-gray-500 text-white px-4 py-2 rounded-md"
        >
          Previous
        </button>

        <button
          onClick={handleSubmit}
          disabled={excelData.length === 0 || isLoading}
          className={`px-4 py-2 rounded-md ${
            isLoading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : excelData.length > 0
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-500"
          }`}
        >
          {isLoading ? "Uploading..." : "Next"}
        </button>
      </div>
    </div>
  );
};

export default Step3;
