import getCurrentMonthDetails from "@/app/services/DayDetails";
import { AttendanceRecord } from "@/app/types/InputFormType";

const CalculateOvertime = async(attendanceData:AttendanceRecord[], nightDutyDays:number[] | [], dutyStartTime:string, dutyEndTime:string, regularOffDay:string)=>{
    const currentMonthDetails = await getCurrentMonthDetails()
    console.log(currentMonthDetails)
    console.log(attendanceData)
    console.log(nightDutyDays)
    console.log(dutyStartTime)
    console.log(dutyEndTime)
    console.log(regularOffDay)
}

export default CalculateOvertime