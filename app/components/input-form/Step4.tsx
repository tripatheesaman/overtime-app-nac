/* eslint-disable @typescript-eslint/no-explicit-any */

import { useFormContext } from "@/app/context/FormContext";
import { sendFormData } from "@/app/utils/api";
import { useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
const Step4 = () => {
  const { formData, setFormData, step, setStep } = useFormContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    formData.nightDutyDays || []
  );
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  const handleDayClick = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const onPrevious = () => {
    setStep(step - 1);
  };

  const formatTotalHours = (hours: number) => {
    if (hours === 0) return;
    const formattedHours = `${hours}:00`;
    return formattedHours;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setResponseMessage(null);
    setIsError(false);

    const updatedFormData = {
      ...formData,
      nightDutyDays: selectedDays,
    };

    setFormData(updatedFormData);

    const response = await sendFormData(updatedFormData);

    if (response?.error) {
      setIsError(true);
      setResponseMessage(response.error || "Something went wrong.");
    } else {
      setIsError(false);
      setResponseMessage("Overtime data processed successfully!");
      // setStep(step + 1); // Optional: go to confirmation step
      if (response?.overtimeData) {
        await exportOvertimeToExcel(response.overtimeData);
      }
    }

    setIsLoading(false);
  };
  const exportOvertimeToExcel = async (overtimeData: any[]) => {
    const response = await fetch("/template.xlsx");
    const arrayBuffer = await response.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const sheet = workbook.getWorksheet(1); // Or use sheet name if known

    if (!sheet) {
      setIsError(true);
      setResponseMessage("Failed to load the worksheet.");
      return;
    }

    let row = 10;
    let totalRegularOT = 0;
    let totalHolidayOT = 0;
    let totalNightHours = 0;
    console.log(overtimeData);
    overtimeData.forEach((entry) => {
      const currentRow = sheet.getRow(row);
      sheet.getCell("L5").value = entry.currentMonth;

      if (entry.beforeDuty) {
        currentRow.getCell("B").value = entry.beforeDuty[0];
        currentRow.getCell("C").value = entry.beforeDuty[1];
        totalRegularOT += entry.totalHours;
      }

      if (entry.holiday) {
        currentRow.getCell("D").value = entry.holiday[0];
        currentRow.getCell("E").value = entry.holiday[1];
        totalHolidayOT += entry.totalHours;
      }

      if (entry.afterDuty) {
        currentRow.getCell("F").value = entry.afterDuty[0];
        currentRow.getCell("G").value = entry.afterDuty[1];
        totalRegularOT += entry.totalHours;
      }

      if (entry.night) {
        currentRow.getCell("I").value = entry.night[0];
        currentRow.getCell("J").value = entry.night[1];
      }
      if (entry.totalHours > 0)
        currentRow.getCell("H").value = formatTotalHours(entry.totalHours);
      if (entry.totalNightHours > 0)
        currentRow.getCell("K").value = formatTotalHours(entry.totalNightHours);
      if (entry.typeOfHoliday !== null)
        currentRow.getCell("L").value = entry.typeOfHoliday;
      totalNightHours += entry.totalNightHours;
      currentRow.commit();
      row++;
    });
    sheet.getCell("A4").value = `Name:${formData.name}`;
    sheet.getCell("A5").value = `Designation:${formData.designation}`;
    sheet.getCell("A6").value = `Staff No: :${formData.staffId}`;
    sheet.getCell("L6").value = formData.regularOffDay;

    // Set total values
    sheet.getCell("H43").value = totalRegularOT.toFixed(2);
    sheet.getCell("D43").value = totalHolidayOT.toFixed(2);
    sheet.getCell("F44").value = (totalRegularOT + totalHolidayOT).toFixed(2);
    if (totalNightHours > 0)
      sheet.getCell("K43").value = totalNightHours.toFixed(2);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "overtime.xlsx");
  };

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
              disabled={isLoading}
              className={`w-10 h-10 flex items-center justify-center rounded-md transition ${
                isSelected
                  ? "bg-blue-500 text-white"
                  : "bg-white text-black border hover:bg-gray-200"
              }`}
              onClick={() => handleDayClick(day)}
            >
              {day}
            </button>
          );
        })}
      </div>

      {responseMessage && (
        <p
          className={`mt-4 text-sm text-center ${
            isError ? "text-red-500" : "text-green-600"
          }`}
        >
          {responseMessage}
        </p>
      )}

      <div className="flex justify-between mt-4">
        <button
          onClick={onPrevious}
          className="bg-gray-500 text-white px-4 py-2 rounded-md disabled:opacity-50"
          disabled={isLoading}
        >
          Previous
        </button>

        <button
          onClick={handleSubmit}
          className={`px-4 py-2 rounded-md text-white ${
            isLoading ? "bg-blue-300" : "bg-blue-500"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default Step4;
