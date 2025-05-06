/* eslint-disable @typescript-eslint/no-explicit-any */

import { useFormContext } from "@/app/context/FormContext";
import { sendFormData } from "@/app/utils/api";
import { useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const Step4 = () => {
  const { formData, setFormData, setStep } = useFormContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    formData.nightDutyDays || []
  );
  const [selectedMorningDays, setSelectedMorningDays] = useState<number[]>(
    formData.morningShiftDays || []
  );
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  const handleDayClick = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleMorningDayClick = (day: number) => {
    setSelectedMorningDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const onPrevious = () => {
    setStep(3);
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
      morningShiftDays: selectedMorningDays,
    };

    setFormData(updatedFormData);

    const response = await sendFormData(updatedFormData);

    if (response?.error) {
      setIsError(true);
      setResponseMessage(response.error || "Something went wrong.");
    } else {
      setIsError(false);
      setResponseMessage("Overtime data processed successfully!");
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
    const sheet = workbook.getWorksheet(1);

    if (!sheet) {
      setIsError(true);
      setResponseMessage("Failed to load the worksheet.");
      return;
    }

    let row = 10;
    let totalRegularOT = 0;
    let totalHolidayOT = 0;
    let totalNightHours = 0;
    overtimeData.forEach((entry) => {
      const currentRow = sheet.getRow(row);
      sheet.getCell("L5").value = entry.currentMonth;

      if (entry.beforeDuty) {
        currentRow.getCell("B").value = entry.beforeDuty[0];
        currentRow.getCell("C").value = entry.beforeDuty[1];
      }

      if (entry.holiday) {
        currentRow.getCell("D").value = entry.holiday[0];
        currentRow.getCell("E").value = entry.holiday[1];
        totalHolidayOT += entry.totalHours;
      }

      if (entry.afterDuty) {
        currentRow.getCell("F").value = entry.afterDuty[0];
        currentRow.getCell("G").value = entry.afterDuty[1];
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
      if (!entry.holiday)
        totalRegularOT += entry.totalHours;
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

      <div className="grid grid-cols-7 gap-2 p-4 border rounded-md bg-gray-100 mb-6">
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

      <h2 className="text-xl font-bold mb-4 text-center">
        Select Morning Shift Days
      </h2>

      <div className="grid grid-cols-7 gap-2 p-4 border rounded-md bg-gray-100 mb-6">
        {[...Array(32)].map((_, index) => {
          const day = index + 1;
          const isSelected = selectedMorningDays.includes(day);
          return (
            <button
              key={day}
              disabled={isLoading}
              className={`w-10 h-10 flex items-center justify-center rounded-md transition ${
                isSelected
                  ? "bg-blue-500 text-white"
                  : "bg-white text-black border hover:bg-gray-200"
              }`}
              onClick={() => handleMorningDayClick(day)}
            >
              {day}
            </button>
          );
        })}
      </div>

      {responseMessage && (
        <div
          className={`p-4 mb-4 rounded-md ${
            isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {responseMessage}
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
          disabled={isLoading}
          className={`px-4 py-2 rounded-md ${
            isLoading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white"
          }`}
        >
          {isLoading ? "Processing..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default Step4;
