/* eslint-disable @typescript-eslint/no-explicit-any */

import { useFormContext } from "@/app/context/FormContext";
import { sendFormData } from "@/app/utils/api";
import { useState, useEffect } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const formatTotalHours = (hours: number): string => {
  if (hours === 0) return "";
  const totalMinutes = Math.round(hours * 60);
  const formattedHours = Math.floor(totalMinutes / 60);
  const formattedMinutes = totalMinutes % 60;
  return `${formattedHours.toString().padStart(2, "0")}:${formattedMinutes.toString().padStart(2, "0")}`;
};

const Step4 = () => {
  const { formData, setFormData } = useFormContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    formData.nightDutyDays || []
  );
  const [selectedMorningDays, setSelectedMorningDays] = useState<number[]>(
    formData.morningShiftDays || []
  );
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    // Wait for a short delay to ensure GET request is complete
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    setResponseMessage(null);
    setIsError(false);

    // Validate required fields
    if (!formData.name || !formData.staffId || !formData.designation) {
      setIsError(true);
      setResponseMessage("Please fill in all required employee details.");
      setIsLoading(false);
      return;
    }

    if (!formData.dutyStartTime || !formData.dutyEndTime) {
      setIsError(true);
      setResponseMessage("Please set your regular duty times.");
      setIsLoading(false);
      return;
    }

    if (formData.inOutTimes.length === 0) {
      setIsError(true);
      setResponseMessage("No attendance records found.");
      setIsLoading(false);
      return;
    }

    const updatedFormData = {
      ...formData,
      nightDutyDays: selectedDays,
      morningShiftDays: selectedMorningDays,
    };

    setFormData(updatedFormData);

    try {
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
    } catch (err) {
      console.error("Failed to process overtime data:", err);
      setIsError(true);
      setResponseMessage("Failed to process overtime data. Please try again.");
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
    let totalDashainOT = 0;
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
        if (entry.isDashainOvertime) {
          totalDashainOT += entry.totalDashainHours || 0;
        } else {
          totalHolidayOT += entry.totalHours;
        }
      }

      if (entry.afterDuty) {
        currentRow.getCell("F").value = entry.afterDuty[0];
        currentRow.getCell("G").value = entry.afterDuty[1];
      }

      if (entry.night) {
        currentRow.getCell("I").value = entry.night[0];
        currentRow.getCell("J").value = entry.night[1];
      }
      
      // Display total hours based on type
      if (entry.isDashainOvertime) {
        if (entry.totalDashainHours > 0)
          currentRow.getCell("H").value = formatTotalHours(entry.totalDashainHours);
      } else {
        if (entry.totalHours > 0)
          currentRow.getCell("H").value = formatTotalHours(entry.totalHours);
      }
      
      if (entry.totalNightHours > 0)
        currentRow.getCell("K").value = formatTotalHours(entry.totalNightHours);
      
      // Display holiday type
      if (entry.typeOfHoliday !== null)
        currentRow.getCell("L").value = entry.typeOfHoliday;
      
      totalNightHours += entry.totalNightHours;
      
      // Add to regular OT only if not Dashain and not holiday
      if (!entry.holiday && !entry.isDashainOvertime)
        totalRegularOT += entry.totalHours;
      
      currentRow.commit();
      row++;
    });

    sheet.getCell("A4").value = `Name:${formData.name}`;
    sheet.getCell("A5").value = `Designation:${formData.designation}`;
    sheet.getCell("A6").value = `Staff No: :${formData.staffId}`;
    sheet.getCell("L6").value = formData.regularOffDay;

    // Set total values in HH:MM format
    sheet.getCell("H44").value = formatTotalHours(totalDashainOT); // Dashain total in H44
    sheet.getCell("H43").value = formatTotalHours(totalRegularOT); // Regular total in D44
    sheet.getCell("D43").value = formatTotalHours(totalHolidayOT); // Holiday total in D43
    sheet.getCell("D44").value = formatTotalHours(totalRegularOT + totalHolidayOT); // Grand total
    sheet.getCell("K43").value = formatTotalHours(totalNightHours);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "overtime.xlsx");
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003594]"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-8 overflow-y-auto pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Select Duty Days
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Choose the days for night duty and morning shift.
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Night Duty Days
            </h3>
            <div className="grid grid-cols-7 gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              {[...Array(32)].map((_, index) => {
                const day = index + 1;
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isLoading}
                    className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 ${
                      isSelected
                        ? "bg-[#003594] text-white shadow-md"
                        : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Morning Shift Days
            </h3>
            <div className="grid grid-cols-7 gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              {[...Array(32)].map((_, index) => {
                const day = index + 1;
                const isSelected = selectedMorningDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isLoading}
                    className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 ${
                      isSelected
                        ? "bg-[#D4483B] text-white shadow-md"
                        : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                    onClick={() => handleMorningDayClick(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {responseMessage && (
          <div
            className={`p-4 rounded-lg ${
              isError
                ? "bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200"
                : "bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-200"
            }`}
          >
            <div className="flex items-center">
              {isError ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {responseMessage}
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 pt-4 pb-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={`${
              isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "btn-primary"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </div>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step4;
