import prisma from "../lib/prisma";
import { DayDetailsType } from "../types/DayDetailType";
import { ErrorReturnType } from "../types/ErrorReturnType";

const getCurrentMonthDetails = async (): Promise<
  DayDetailsType | ErrorReturnType
> => {
  try {
    const currentMonthDetails = await prisma.dayDetails.findFirst({
      where: { isActiveMonth: true },
    });
    if (!currentMonthDetails)
      return { message: "No date details found !", status: 404 };
    const dayDetails: DayDetailsType = {
      startDay: currentMonthDetails.startingday,
      holidays:
        typeof currentMonthDetails.holidays === "string"
          ? JSON.parse(currentMonthDetails.holidays)
          : (currentMonthDetails.holidays as number[]),
      numberOfDays: currentMonthDetails.numberofdays,
      name: currentMonthDetails.name,
      year: Number(currentMonthDetails.year),
    };
    return dayDetails;
  } catch (error) {
    return { message: error, status: 400 } as ErrorReturnType;
  } finally{
    await prisma.$disconnect()
  }
};

export default getCurrentMonthDetails;
