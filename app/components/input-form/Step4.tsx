/* eslint-disable @typescript-eslint/no-explicit-any */

import { useFormContext } from "@/app/context/FormContext";
import { sendFormData } from "@/app/utils/api";
import { useState, useEffect } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import {
  applyWinterAdjustments,
  parseWinterAdjustment,
} from "@/app/lib/helpers/winterTimeAdjustments";

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

  const isValidTimeValue = (value?: string | null) => {
    if (!value) return false;
    const normalized = value.trim();
    return normalized !== "NA" && normalized !== "--" && normalized !== "";
  };

  const formatDateForIt = (year: number, monthNumber: number, day: number) => {
    const month = monthNumber.toString().padStart(2, "0");
    const dayString = day.toString().padStart(2, "0");
    return `${year}/${month}/${dayString}`;
  };

  const calculateTwoHoursBefore = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const date = dayjs().hour(hours).minute(minutes);
    const twoHoursBefore = date.subtract(2, "hour");
    return twoHoursBefore.format("HH:mm");
  };

  const fetchCurrentMonthDetails = async () => {
    try {
      const query = encodeURIComponent(JSON.stringify({ action: "getCurrentMonthDetails" }));
      const response = await fetch(`/api/extension-data?data=${query}`);
      const data = await response.json();
      if (data?.success && data.data) {
        return data.data;
      }
      console.error("Failed to fetch month details:", data?.error || "Unknown error");
      return null;
    } catch (error) {
      console.error("Failed to fetch month details:", error);
      return null;
    }
  };

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

  const populateDefaultWorksheet = (sheet: ExcelJS.Worksheet, overtimeData: any[], monthDetails?: any) => {
    const setCellTextPreservingStyle = (cell: ExcelJS.Cell, newValue: string) => {
      const originalFont = cell.font ? { ...cell.font } : undefined;
      const originalAlignment = cell.alignment ? { ...cell.alignment } : undefined;
      const originalBorder = cell.border ? { ...cell.border } : undefined;
      const originalFill = cell.fill ? { ...cell.fill } : undefined;
      const originalProtection = cell.protection ? { ...cell.protection } : undefined;
      const originalNumFmt = cell.numFmt;
      cell.value = newValue;
      if (originalFont) cell.font = originalFont;
      if (originalAlignment) cell.alignment = originalAlignment;
      if (originalBorder) cell.border = originalBorder;
      if (originalFill) cell.fill = originalFill;
      if (originalProtection) cell.protection = originalProtection;
      if (originalNumFmt) cell.numFmt = originalNumFmt;
    };

    const updateLabeledCell = (cell: ExcelJS.Cell, fallbackLabel: string, value: string) => {
      const originalValue = cell.value;
      let label = fallbackLabel;
      if (typeof originalValue === "string") {
        const colonIndex = originalValue.indexOf(":");
        if (colonIndex !== -1) {
          label = originalValue.slice(0, colonIndex + 1);
        } else {
          label = originalValue;
        }
      }
      setCellTextPreservingStyle(cell, `${label} ${value}`.trim());
    };

    // Check if it's Dashain or Tihar month
    const isDashainMonth = Boolean(monthDetails?.isDashainMonth);
    const isTiharMonth = Boolean(monthDetails?.isTiharMonth);

    let row = 10;
    let totalRegularOT = 0;
    let totalHolidayOT = 0;
    let totalDashainOT = 0;
    let totalTiharOT = 0;
    let totalNightHours = 0;

    overtimeData.forEach((entry: any) => {
      const currentRow = sheet.getRow(row);

      // For Dashain/Tihar days, times should be filled as CHD (in D/E columns), not in beforeDuty (B/C)
      const isDashainOrTiharDay = entry.isDashainOvertime || entry.isTiharOvertime;

      // Only fill beforeDuty (B/C) for non-Dashain/Tihar days
      if (entry.beforeDuty && !isDashainOrTiharDay) {
        currentRow.getCell("B").value = entry.beforeDuty[0];
        currentRow.getCell("C").value = entry.beforeDuty[1];
      }

      // For Dashain/Tihar days, fill times in D/E (CHD columns) - combine all times like regular CHD
      if (isDashainOrTiharDay) {
        // For Dashain/Tihar, combine all times (beforeDuty + holiday + afterDuty) into D/E
        // D = earliest start time, E = latest end time
        const times: Array<{ start: string; end: string }> = [];
        
        if (entry.beforeDuty && entry.beforeDuty[0] && entry.beforeDuty[1]) {
          times.push({ start: entry.beforeDuty[0], end: entry.beforeDuty[1] });
        }
        if (entry.holiday && entry.holiday[0] && entry.holiday[1]) {
          times.push({ start: entry.holiday[0], end: entry.holiday[1] });
        }
        if (entry.afterDuty && entry.afterDuty[0] && entry.afterDuty[1]) {
          times.push({ start: entry.afterDuty[0], end: entry.afterDuty[1] });
        }
        
        if (times.length > 0) {
          // Find earliest start time
          let startTime = times[0].start;
          for (const time of times) {
            if (time.start < startTime) {
              startTime = time.start;
            }
          }
          
          // Find latest end time
          let endTime = times[0].end;
          for (const time of times) {
            if (time.end > endTime) {
              endTime = time.end;
            }
          }
          
          currentRow.getCell("D").value = startTime;
          currentRow.getCell("E").value = endTime;
        }
        
        // Track totals
        if (entry.isDashainOvertime) {
          totalDashainOT += entry.totalDashainHours || 0;
        } else if (entry.isTiharOvertime) {
          totalTiharOT += entry.totalTiharHours || 0;
        }
      } else if (entry.holiday) {
        // Regular holiday (non-Dashain/Tihar) - fill like regular CHD
        currentRow.getCell("D").value = entry.holiday[0];
        currentRow.getCell("E").value = entry.holiday[1];
        totalHolidayOT += entry.totalHours || 0;
      }

      // Fill afterDuty (F/G) only for non-Dashain/Tihar days
      // For Dashain/Tihar, afterDuty is already included in D/E
      if (entry.afterDuty && !isDashainOrTiharDay) {
        currentRow.getCell("F").value = entry.afterDuty[0];
        currentRow.getCell("G").value = entry.afterDuty[1];
      }

      if (entry.night) {
        currentRow.getCell("I").value = entry.night[0];
        currentRow.getCell("J").value = entry.night[1];
      }

      if (entry.isDashainOvertime) {
        if (entry.totalDashainHours > 0) {
          currentRow.getCell("H").value = formatTotalHours(entry.totalDashainHours);
        }
      } else if (entry.isTiharOvertime) {
        if (entry.totalTiharHours > 0) {
          currentRow.getCell("H").value = formatTotalHours(entry.totalTiharHours);
        }
      } else if (entry.totalHours > 0) {
        currentRow.getCell("H").value = formatTotalHours(entry.totalHours);
      }

      if (entry.totalNightHours > 0) {
        currentRow.getCell("K").value = formatTotalHours(entry.totalNightHours);
      }

      if (entry.typeOfHoliday !== null) {
        currentRow.getCell("L").value = entry.typeOfHoliday;
      }

      totalNightHours += entry.totalNightHours || 0;

      if (!entry.holiday && !entry.isDashainOvertime && !entry.isTiharOvertime) {
        totalRegularOT += entry.totalHours || 0;
      }

      currentRow.commit();
      row++;
    });

    updateLabeledCell(sheet.getCell("A4"), "Name:", formData.name ?? "");
    updateLabeledCell(sheet.getCell("A5"), "Designation:", formData.designation ?? "");
    updateLabeledCell(sheet.getCell("A6"), "Staff No:", formData.staffId ?? "");
    
    // Set month name in L5 (uppercase) - get from first entry or monthDetails
    const monthName = overtimeData.length > 0 && overtimeData[0]?.currentMonth 
      ? overtimeData[0].currentMonth.toUpperCase()
      : (monthDetails?.name?.toUpperCase() ?? "");
    sheet.getCell("L5").value = monthName;
    
    // Set weekly day off in L6 (uppercase)
    sheet.getCell("L6").value = (formData.regularOffDay ?? "").toUpperCase();

    // Handle both Dashain and Tihar month case
    if (isDashainMonth && isTiharMonth) {
      // F44: "Dashain Hours" label (bolded)
      const f44Cell = sheet.getCell("F44");
      f44Cell.value = "Dashain Hours:";
      const f44Font = f44Cell.font ? { ...f44Cell.font } : {};
      f44Cell.font = { ...f44Font, bold: true };

      // H44: totalDashainOT value (bolded and with borders)
      const h44Cell = sheet.getCell("H44");
      h44Cell.value = formatTotalHours(totalDashainOT);
      const h44Font = h44Cell.font ? { ...h44Cell.font } : {};
      h44Cell.font = { ...h44Font, bold: true };
      h44Cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // I44: "Tihar" label (bolded)
      const i44Cell = sheet.getCell("I44");
      i44Cell.value = "Tihar Hours:";
      const i44Font = i44Cell.font ? { ...i44Cell.font } : {};
      i44Cell.font = { ...i44Font, bold: true };

      // K44: totalTiharOT value (bolded and with borders)
      const k44Cell = sheet.getCell("K44");
      k44Cell.value = formatTotalHours(totalTiharOT);
      const k44Font = k44Cell.font ? { ...k44Cell.font } : {};
      k44Cell.font = { ...k44Font, bold: true };
      k44Cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    } else if (isDashainMonth) {
      // Just Dashain month
      const f44Cell = sheet.getCell("F44");
      f44Cell.value = "Dashain Hours:";
      const f44Font = f44Cell.font ? { ...f44Cell.font } : {};
      f44Cell.font = { ...f44Font, bold: true };

      const h44Cell = sheet.getCell("H44");
      h44Cell.value = formatTotalHours(totalDashainOT);
      const h44Font = h44Cell.font ? { ...h44Cell.font } : {};
      h44Cell.font = { ...h44Font, bold: true };
      h44Cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    } else if (isTiharMonth) {
      // Just Tihar month
      const f44Cell = sheet.getCell("F44");
      f44Cell.value = "Tihar Hours:";
      const f44Font = f44Cell.font ? { ...f44Cell.font } : {};
      f44Cell.font = { ...f44Font, bold: true };

      const h44Cell = sheet.getCell("H44");
      h44Cell.value = formatTotalHours(totalTiharOT);
      const h44Font = h44Cell.font ? { ...h44Cell.font } : {};
      h44Cell.font = { ...h44Font, bold: true };
      h44Cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    } else {
      // No festival month - original logic
      sheet.getCell("H44").value = formatTotalHours(totalDashainOT);
    }

    sheet.getCell("H43").value = formatTotalHours(totalRegularOT);
    sheet.getCell("D43").value = formatTotalHours(totalHolidayOT);
    sheet.getCell("D44").value = formatTotalHours(totalRegularOT + totalHolidayOT);
    sheet.getCell("K43").value = formatTotalHours(totalNightHours);
  };

  const populateItWorksheet = (
    sheet: ExcelJS.Worksheet,
    overtimeData: any[],
    monthDetails: any,
    departmentInfo?: any
  ) => {
    const numberOfDays = monthDetails?.numberOfDays ?? overtimeData.length ?? 0;
    const year = Number(monthDetails?.year ?? 0);
    if (!year) {
      setIsError(true);
      setResponseMessage("Year not found in month details. Please ensure the month is properly configured.");
      return;
    }
    const monthNumber = Number(monthDetails?.monthNumber ?? 1);
    const monthName = monthDetails?.name ?? "";
    const startDay = Number(monthDetails?.startDay ?? 0);
    const holidays = Array.isArray(monthDetails?.holidays) ? monthDetails.holidays : [];
    const isWinterEnabled = Boolean(monthDetails?.isWinter ?? false);
    const winterStartDay = Number(monthDetails?.winterStartDay ?? null);

    const resolveAdjustment = (
      departmentValue?: string | null,
      monthValue?: string | null
    ) =>
      parseWinterAdjustment(
        departmentValue ??
          (typeof monthValue === "string" ? monthValue : undefined)
      );

    // Get adjustments from department (preferred) or fallback to monthDetails
    const winterRegularInAdjustment = resolveAdjustment(
      departmentInfo?.winterRegularInPlaceholder,
      monthDetails?.winterRegularInPlaceholder ?? null
    );
    const winterRegularOutAdjustment = resolveAdjustment(
      departmentInfo?.winterRegularOutPlaceholder,
      monthDetails?.winterRegularOutPlaceholder ?? null
    );
    const winterMorningInAdjustment = resolveAdjustment(
      departmentInfo?.winterMorningInPlaceholder,
      monthDetails?.winterMorningInPlaceholder ?? null
    );
    const winterMorningOutAdjustment = resolveAdjustment(
      departmentInfo?.winterMorningOutPlaceholder,
      monthDetails?.winterMorningOutPlaceholder ?? null
    );
    const winterNightInAdjustment = resolveAdjustment(
      departmentInfo?.winterNightInPlaceholder,
      monthDetails?.winterNightInPlaceholder ?? null
    );
    const winterNightOutAdjustment = resolveAdjustment(
      departmentInfo?.winterNightOutPlaceholder,
      monthDetails?.winterNightOutPlaceholder ?? null
    );

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const setCellTextPreservingStyle = (cell: ExcelJS.Cell, newValue: string) => {
      const originalFont = cell.font ? { ...cell.font } : undefined;
      const originalAlignment = cell.alignment ? { ...cell.alignment } : undefined;
      const originalBorder = cell.border ? { ...cell.border } : undefined;
      const originalFill = cell.fill ? { ...cell.fill } : undefined;
      const originalProtection = cell.protection ? { ...cell.protection } : undefined;
      const originalNumFmt = cell.numFmt;
      cell.value = newValue;
      if (originalFont) cell.font = originalFont;
      if (originalAlignment) cell.alignment = originalAlignment;
      if (originalBorder) cell.border = originalBorder;
      if (originalFill) cell.fill = originalFill;
      if (originalProtection) cell.protection = originalProtection;
      if (originalNumFmt) cell.numFmt = originalNumFmt;
    };

    const updateLabeledCell = (cell: ExcelJS.Cell, fallbackLabel: string, value: string) => {
      const originalValue = cell.value;
      let label = fallbackLabel;
      if (typeof originalValue === "string") {
        const colonIndex = originalValue.indexOf(":");
        if (colonIndex !== -1) {
          label = originalValue.slice(0, colonIndex + 1);
        } else {
          label = originalValue;
        }
      }
      setCellTextPreservingStyle(cell, `${label} ${value}`.trim());
    };

    updateLabeledCell(sheet.getCell("A5"), "Name:", formData.name ?? "");
    updateLabeledCell(sheet.getCell("A6"), "Designation:", formData.designation ?? "");
    updateLabeledCell(sheet.getCell("A7"), "Staff No:", formData.staffId ?? "");
    updateLabeledCell(sheet.getCell("I5"), "Month/Year:", `${monthName}/${year}`);
    updateLabeledCell(sheet.getCell("I6"), "W/Off Day:", formData.regularOffDay ?? "");
    updateLabeledCell(sheet.getCell("I7"), "Duty Hours:", `${formData.dutyStartTime ?? ""} - ${formData.dutyEndTime ?? ""}`);

    // Helper function to compare times (returns true if time1 >= time2)
    const isTimeGreaterOrEqual = (time1: string, time2: string): boolean => {
      if (!time1 || !time2 || !isValidTimeValue(time1) || !isValidTimeValue(time2)) {
        return false;
      }
      const normalized1 = time1.trim();
      const normalized2 = time2.trim();
      const [h1, m1] = normalized1.split(":").map((part) => Number(part));
      const [h2, m2] = normalized2.split(":").map((part) => Number(part));
      const minutes1 = h1 * 60 + m1;
      const minutes2 = h2 * 60 + m2;
      return minutes1 >= minutes2;
    };

    // Helper function to compare times (returns true if time1 <= time2)
    const isTimeLessOrEqual = (time1: string, time2: string): boolean => {
      if (!time1 || !time2 || !isValidTimeValue(time1) || !isValidTimeValue(time2)) {
        return false;
      }
      const normalized1 = time1.trim();
      const normalized2 = time2.trim();
      const [h1, m1] = normalized1.split(":").map((part) => Number(part));
      const [h2, m2] = normalized2.split(":").map((part) => Number(part));
      const minutes1 = h1 * 60 + m1;
      const minutes2 = h2 * 60 + m2;
      return minutes1 <= minutes2;
    };

    const getFirstValidTime = (
      ...values: Array<string | undefined | null>
    ): string => {
      for (const value of values) {
        if (value && isValidTimeValue(value)) {
          return value.trim();
        }
      }
      return "";
    };

    // Counters for special days
    let daysWithOutTimeAfter21 = 0; // outTime >= 21:00 (excluding days with inTime <= 5:30)
    let daysWithInTimeBefore530 = 0; // inTime <= 5:30

    // Check if it's Dashain or Tihar month
    const isDashainMonth = Boolean(monthDetails?.isDashainMonth);
    const isTiharMonth = Boolean(monthDetails?.isTiharMonth);
    const isDashainOrTiharMonth = isDashainMonth || isTiharMonth;

    // Totals for CHD (excluding Dashain/Tihar) and Dashain/Tihar hours
    let totalChdHoursExcludingDashainTihar = 0;
    let totalDashainTiharHours = 0;
    let daysWithTimes = 0;
    let totalChdOrOffDays = 0;
    let chdOrOffDaysWithoutTimes = 0;
    let totalNightHours = 0;

    for (let index = 0; index < numberOfDays; index++) {
      const entry = overtimeData[index] ?? {};
      const attendance = formData.inOutTimes[index];
      const dayNumber = index + 1;
      const currentRow = sheet.getRow(10 + index);

      currentRow.getCell("A").value = formatDateForIt(year, monthNumber, dayNumber);

      // Check if person is present - must have valid inTime AND outTime
      // Explicitly check that both times exist and are valid (not empty, not "NA", not "--")
      const holidayTypeRaw = (entry?.typeOfHoliday ?? "").toString();
      const holidayTypeUpper = holidayTypeRaw.toUpperCase();
      const isDashainDay = Boolean(entry?.isDashainOvertime);
      const isTiharDay = Boolean(entry?.isTiharOvertime);
      const isChdDay =
        holidayTypeUpper.includes("CHD") ||
        isDashainDay ||
        isTiharDay ||
        holidays.includes(dayNumber);
      const isOffDayType = holidayTypeUpper.includes("OFF");
      const isHolidayOvertimeEntry = Boolean(entry?.isHolidayOvertime);
      const isChdOrOffDay = isChdDay || isOffDayType || isHolidayOvertimeEntry;

      const inTime = attendance?.inTime;
      const outTime = attendance?.outTime;
      const hasInTime = inTime && isValidTimeValue(inTime);
      const hasOutTime = outTime && isValidTimeValue(outTime);
      const isPresent = Boolean(hasInTime && hasOutTime);

      const effectiveInTime = getFirstValidTime(
        inTime,
        entry?.holiday?.[0],
        entry?.beforeDuty?.[0],
        entry?.afterDuty?.[0]
      );
      const effectiveOutTime = getFirstValidTime(
        outTime,
        entry?.holiday?.[1],
        entry?.afterDuty?.[1],
        entry?.night?.[1]
      );

      const hasTimesForCounting =
        isValidTimeValue(effectiveInTime) || isValidTimeValue(effectiveOutTime);

      if (isChdOrOffDay) {
        totalChdOrOffDays += 1;
      }

      if (hasTimesForCounting) {
        daysWithTimes += 1;
      } else if (isChdOrOffDay) {
        chdOrOffDaysWithoutTimes += 1;
      }

      // Calculate totals for Dashain/Tihar months
      if (isDashainOrTiharMonth && hasTimesForCounting) {
        // If it's a Dashain or Tihar day, add to Dashain/Tihar total
        if (isDashainDay || isTiharDay) {
          // Add Dashain hours if it's a Dashain day
          if (isDashainDay) {
            const dashainHours = typeof entry?.totalDashainHours === "number"
              ? entry.totalDashainHours
              : Number(entry?.totalDashainHours || 0);
            totalDashainTiharHours += dashainHours;
          }
          // Add Tihar hours if it's a Tihar day
          if (isTiharDay) {
            const tiharHours = typeof entry?.totalTiharHours === "number"
              ? entry.totalTiharHours
              : Number(entry?.totalTiharHours || 0);
            totalDashainTiharHours += tiharHours;
          }
          // Don't add CHD hours to G42 if it's Dashain/Tihar (even if it's also CHD)
          // CHD hours will still be shown in column G for that day
        } else {
          // If it's not a Dashain/Tihar day, add CHD hours to the total (excluding Dashain/Tihar)
          const chdHours = typeof entry?.totalChdHours === "number"
            ? entry.totalChdHours
            : Number(entry?.totalChdHours || 0);
          totalChdHoursExcludingDashainTihar += chdHours;
        }
      }

      // If absent, don't fill "P" or any time values, but still fill remarks
      if (!isPresent) {
        // Don't fill "P" for absent days (leave B column empty)
        // Don't fill any time values (C-K)
        currentRow.getCell("C").value = "";
        currentRow.getCell("D").value = "";
        currentRow.getCell("E").value = "";
        currentRow.getCell("F").value = "";
        currentRow.getCell("G").value = "";
        currentRow.getCell("H").value = "";
        currentRow.getCell("I").value = "";
        currentRow.getCell("J").value = "";
        currentRow.getCell("K").value = "";
        // Fill remarks even when absent
        currentRow.getCell("L").value = entry?.typeOfHoliday ?? "";
        currentRow.commit();
        continue; // Skip to next iteration
      }

      // Only write "P" for present days (when both inTime and outTime are valid)
      currentRow.getCell("B").value = "P";

      currentRow.getCell("C").value = entry?.beforeDuty?.[0] ?? "";

      // Calculate regular duty start and end times (D and E columns)
      // Check if it's day before off day
      const nextDayIndex = (startDay + index + 1) % 7;
      const nextDayName = daysOfWeek[nextDayIndex];
      const isDayBeforeOff = nextDayName.toLowerCase() === (formData.regularOffDay ?? "").toLowerCase();
      const isHoliday = holidays.includes(dayNumber);
      const isOffDayEntry = entry?.typeOfHoliday?.includes("OFF") || entry?.typeOfHoliday === "CHD" || entry?.isHolidayOvertime;

      // Check if winter applies for this day
      const isWinterDay = Boolean(
        isWinterEnabled && winterStartDay && dayNumber >= winterStartDay
      );

      // Determine shift type for the day
      const isNightDutyDay = Array.isArray(formData.nightDutyDays) && formData.nightDutyDays.includes(dayNumber);
      const isMorningShiftDay = Array.isArray(formData.morningShiftDays) && formData.morningShiftDays.includes(dayNumber);

      const allowWinterOutAdjustment =
        !(isDayBeforeOff && !isHoliday && !isOffDayEntry);

      const adjustShiftTimes = (
        baseStart: string,
        baseEnd: string,
        inAdjustment: ReturnType<typeof parseWinterAdjustment> | null,
        outAdjustment: ReturnType<typeof parseWinterAdjustment> | null,
        nightShift = false
      ) =>
        applyWinterAdjustments({
          baseStart,
          baseEnd,
          inAdjustment: inAdjustment ?? undefined,
          outAdjustment: outAdjustment ?? undefined,
          isWinterDay,
          allowOutAdjustment: allowWinterOutAdjustment,
          baseEndNextDay: nightShift,
        });

      let dutyStartTime = formData.dutyStartTime ?? "";
      let dutyEndTime = formData.dutyEndTime ?? "";

      if (isNightDutyDay) {
        const adjusted = adjustShiftTimes(
          formData.nightDutyStartTime ?? dutyStartTime,
          formData.nightDutyEndTime ?? dutyEndTime,
          winterNightInAdjustment,
          winterNightOutAdjustment,
          true
        );
        dutyStartTime = adjusted.start;
        dutyEndTime = adjusted.end;
        if (isDayBeforeOff && !isHoliday && !isOffDayEntry && dutyEndTime) {
          dutyEndTime = calculateTwoHoursBefore(dutyEndTime);
        }
      } else if (isMorningShiftDay) {
        const adjusted = adjustShiftTimes(
          formData.morningShiftStartTime ?? dutyStartTime,
          formData.morningShiftEndTime ?? dutyEndTime,
          winterMorningInAdjustment,
          winterMorningOutAdjustment
        );
        dutyStartTime = adjusted.start;
        dutyEndTime = adjusted.end;
        if (isDayBeforeOff && !isHoliday && !isOffDayEntry && dutyEndTime) {
          dutyEndTime = calculateTwoHoursBefore(dutyEndTime);
        }
      } else {
        const adjusted = adjustShiftTimes(
          dutyStartTime,
          dutyEndTime,
          winterRegularInAdjustment,
          winterRegularOutAdjustment
        );
        dutyStartTime = adjusted.start;
        dutyEndTime = adjusted.end;
        if (isDayBeforeOff && !isHoliday && !isOffDayEntry && dutyEndTime) {
          dutyEndTime = calculateTwoHoursBefore(dutyEndTime);
        }
      }

      currentRow.getCell("D").value = dutyStartTime;
      currentRow.getCell("E").value = dutyEndTime;

      // Fill after duty time (F column) if:
      // 1. afterDuty[1] exists and is different from the actual duty end time (adjusted for day before off day), OR
      // 2. holiday[1] exists (for off days/holidays/Dashain/Tihar), OR
      // 3. Actual out time is beyond grace period (40 minutes) from the actual duty end time
      const afterDutyEndTime = entry?.afterDuty?.[1] ?? "";
      const holidayEndTime = entry?.holiday?.[1] ?? "";
      const actualOutTime = attendance?.outTime ?? "";
      const isOffDay = entry?.typeOfHoliday?.includes("OFF") || entry?.typeOfHoliday === "CHD" || entry?.isHolidayOvertime;
      const isDashainOrTihar = isDashainDay || isTiharDay;

      // Use the adjusted dutyEndTime (which accounts for day before off day) for comparisons
      const effectiveDutyEndTime = dutyEndTime; // This is already adjusted for day before off day

      let afterDutyValue = "";

      // For off days/holidays/Dashain/Tihar days, use holiday[1] if it exists (prioritize this)
      if ((isOffDay || isDashainOrTihar) && holidayEndTime && isValidTimeValue(holidayEndTime)) {
        afterDutyValue = holidayEndTime;
      }
      // For Dashain/Tihar days, also check afterDuty[1] if holiday[1] doesn't exist
      else if (isDashainOrTihar && afterDutyEndTime && isValidTimeValue(afterDutyEndTime)) {
        afterDutyValue = afterDutyEndTime;
      }
      // For regular days (including day before off day), check if afterDuty[1] exists and is valid
      else if (afterDutyEndTime && isValidTimeValue(afterDutyEndTime) && effectiveDutyEndTime) {
        const [afterHours, afterMinutes] = afterDutyEndTime.split(":").map(Number);
        const [dutyHours, dutyMinutes] = effectiveDutyEndTime.split(":").map(Number);

        const afterTimeInMinutes = afterHours * 60 + afterMinutes;
        const dutyTimeInMinutes = dutyHours * 60 + dutyMinutes;

        // If afterDuty end time is different from the effective duty end time, use it
        if (afterTimeInMinutes !== dutyTimeInMinutes) {
          afterDutyValue = afterDutyEndTime;
        }
      }

      // If still no value and we have actual out time, check grace period
      // Use the effective duty end time (adjusted for day before off day) for grace period calculation
      if (!afterDutyValue && effectiveDutyEndTime && actualOutTime && isValidTimeValue(actualOutTime) && !isOffDay && !isDashainOrTihar) {
        const [dutyHours, dutyMinutes] = effectiveDutyEndTime.split(":").map(Number);
        const [outHours, outMinutes] = actualOutTime.split(":").map(Number);

        const dutyTimeInMinutes = dutyHours * 60 + dutyMinutes;
        const outTimeInMinutes = outHours * 60 + outMinutes;

        // Grace period is 40 minutes
        const gracePeriodMinutes = 40;
        const gracePeriodEnd = dutyTimeInMinutes + gracePeriodMinutes;

        // Only fill if out time is beyond grace period (more than 40 minutes after effective duty end)
        if (outTimeInMinutes > gracePeriodEnd) {
          afterDutyValue = actualOutTime;
        }
      }

      currentRow.getCell("F").value = afterDutyValue;

      // Count before 05:30 vs after 21:00 based on inserted times (mutually exclusive)
      // For night shift days with in/out times, always count as "after 21:00" days
      if (isNightDutyDay && isPresent) {
        // Night shift days with valid times always count as "after 21:00" days
        daysWithOutTimeAfter21++;
      } else {
        // Use column C (beforeDuty from) when available; otherwise fall back to column D (dutyStartTime)
        const insertedInForCount = isValidTimeValue(entry?.beforeDuty?.[0])
          ? (entry?.beforeDuty?.[0] as string)
          : (isValidTimeValue(effectiveInTime) ? effectiveInTime : dutyStartTime);
        // Use column F (afterDuty to) when available; otherwise fall back to column E (dutyEndTime)
        const insertedAfterOrOutForCount = isValidTimeValue(afterDutyValue)
          ? afterDutyValue
          : dutyEndTime;
        const earlyThreshold = isWinterDay ? "06:00" : "05:30";
        if (isValidTimeValue(insertedInForCount) && isTimeLessOrEqual(insertedInForCount, earlyThreshold)) {
          daysWithInTimeBefore530++;
        } else if (isValidTimeValue(insertedAfterOrOutForCount) && isTimeGreaterOrEqual(insertedAfterOrOutForCount, "21:00")) {
          daysWithOutTimeAfter21++;
        }
      }

      const chdHours = typeof entry?.totalChdHours === "number"
        ? entry.totalChdHours
        : Number(entry?.totalChdHours || 0);
      const offHours = typeof entry?.totalOffHours === "number"
        ? entry.totalOffHours
        : Number(entry?.totalOffHours || 0);
      const regularHours = typeof entry?.totalRegularOvertimeHours === "number"
        ? entry.totalRegularOvertimeHours
        : Number(entry?.totalRegularOvertimeHours || 0);

      currentRow.getCell("G").value = chdHours;
      currentRow.getCell("H").value = offHours;
      currentRow.getCell("I").value = regularHours;

      currentRow.getCell("J").value = entry?.night?.[0] ?? "";
      currentRow.getCell("K").value = entry?.night?.[1] ?? "";
      const nightHours = typeof entry?.totalNightHours === "number"
        ? entry.totalNightHours
        : Number(entry?.totalNightHours || 0);
      totalNightHours += nightHours;
      currentRow.getCell("L").value = entry?.typeOfHoliday ?? "";

      currentRow.commit();
    }

    // Insert special day counts
    sheet.getCell("H44").value = daysWithOutTimeAfter21;
    sheet.getCell("H45").value = daysWithInTimeBefore530;
    sheet.getCell("K45").value = daysWithTimes;
    sheet.getCell("K44").value = totalChdOrOffDays;
    sheet.getCell("K43").value = daysWithTimes + chdOrOffDaysWithoutTimes;
    sheet.getCell("J42").value = Number(totalNightHours.toFixed(2));

    // Insert totals for Dashain/Tihar months
    if (isDashainOrTiharMonth) {
      sheet.getCell("G42").value = totalChdHoursExcludingDashainTihar;
      sheet.getCell("K46").value = totalDashainTiharHours;
    }

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

    if (!formData.departmentId || formData.departmentId === 0) {
      setIsError(true);
      setResponseMessage("Please select a department.");
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
    let templateFileName = "template_grsd.xlsx";
    let selectedDept: any = null;

    try {
      const deptResponse = await fetch(`/api/department`);
      const deptData = await deptResponse.json();
      if (deptData.success && Array.isArray(deptData.data)) {
        selectedDept = deptData.data.find((d: any) => d.id === formData.departmentId);
        if (selectedDept?.templateFile) {
          templateFileName = selectedDept.templateFile;
        }
      }
    } catch (error) {
      console.error("Failed to fetch department info:", error);
    }

    const response = await fetch(`/${templateFileName}`);
    if (!response.ok) {
      setIsError(true);
      setResponseMessage(
        `Template file not found: ${templateFileName}. Please ensure the template file exists in the public folder.`
      );
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const sheet = workbook.getWorksheet(1);

    if (!sheet) {
      setIsError(true);
      setResponseMessage("Failed to load the worksheet.");
      return;
    }

    const itLikeDepartments = ["it", "lcu"];
    const usesItLayout = selectedDept?.code
      ? itLikeDepartments.includes(selectedDept.code.toLowerCase())
      : false;

    const monthDetails = await fetchCurrentMonthDetails();
    if (!monthDetails) {
      setIsError(true);
      setResponseMessage("Unable to fetch month details for export.");
      return;
    }

    if (usesItLayout) {
      // Pass department placeholders to populateItWorksheet for IT-like departments
      populateItWorksheet(sheet, overtimeData, monthDetails, selectedDept);
    } else {
      populateDefaultWorksheet(sheet, overtimeData, monthDetails);
    }

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
                    className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 ${isSelected
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
                    className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 ${isSelected
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
            className={`p-4 rounded-lg ${isError
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
            className={`${isLoading
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
