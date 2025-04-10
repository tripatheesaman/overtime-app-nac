"use client";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ExportOvertimeExcel = ({ overtimeData }: { overtimeData: any[] }) => {
  const handleExport = async (overtimeData) => {
    const response = await fetch("/template.xlsx");
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    let row = 10;

    let totalRegularOT = 0;
    let totalHolidayOT = 0;

    overtimeData.forEach((entry) => {
      if (entry.beforeDuty) {
        sheet[`B${row}`] = { v: entry.beforeDuty[0] };
        sheet[`C${row}`] = { v: entry.beforeDuty[1] };
        totalRegularOT += entry.totalHours;
      }

      if (entry.holiday) {
        sheet[`D${row}`] = { v: entry.holiday[0] };
        sheet[`E${row}`] = { v: entry.holiday[1] };
        totalHolidayOT += entry.totalHours;
      }

      if (entry.afterDuty) {
        sheet[`F${row}`] = { v: entry.afterDuty[0] };
        sheet[`G${row}`] = { v: entry.afterDuty[1] };
        totalRegularOT += entry.totalHours;
      }

      if (entry.night) {
        sheet[`I${row}`] = { v: entry.night[0] };
        sheet[`J${row}`] = { v: entry.night[1] };
        // Night OT not included in regular OT
      }

      sheet[`H${row}`] = { v: entry.totalHours };
      row++;
    });

    // A34: Total Regular OT (excluding night + holiday)
    sheet["A34"] = { v: totalRegularOT.toFixed(2) };

    // A35: Total Holiday OT
    sheet["A35"] = { v: totalHolidayOT.toFixed(2) };

    // A36: Grand Total OT
    sheet["A36"] = { v: (totalRegularOT + totalHolidayOT).toFixed(2) };

    // Create Blob and trigger download
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "overtime.xlsx");
  };

handleExport(overtimeData);
  
};

export default ExportOvertimeExcel;
