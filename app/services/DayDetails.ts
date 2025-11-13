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
    const raw = currentMonthDetails as Record<string, unknown>;
    const dayDetails: DayDetailsType = {
      startDay: currentMonthDetails.startingday,
      holidays:
        typeof currentMonthDetails.holidays === "string"
          ? JSON.parse(currentMonthDetails.holidays)
          : (currentMonthDetails.holidays as number[]),
      numberOfDays: currentMonthDetails.numberofdays,
      name: currentMonthDetails.name,
      year: Number(currentMonthDetails.year),
      monthNumber: Number((raw.monthNumber as number | undefined) ?? 1),
      isDashainMonth: (raw.isDashainMonth as boolean | undefined) ?? undefined,
      dashainDays:
        typeof raw.dashainDays === "string"
          ? JSON.parse(raw.dashainDays as string)
          : (raw.dashainDays as number[] | undefined),
      isTiharMonth: (raw.isTiharMonth as boolean | undefined) ?? undefined,
      tiharDays:
        typeof raw.tiharDays === "string"
          ? JSON.parse(raw.tiharDays as string)
          : (raw.tiharDays as number[] | undefined),
      regularInPlaceholder: (raw.regularInPlaceholder as string | null | undefined) ?? null,
      regularOutPlaceholder: (raw.regularOutPlaceholder as string | null | undefined) ?? null,
      morningInPlaceholder: (raw.morningInPlaceholder as string | null | undefined) ?? null,
      morningOutPlaceholder: (raw.morningOutPlaceholder as string | null | undefined) ?? null,
      nightInPlaceholder: (raw.nightInPlaceholder as string | null | undefined) ?? null,
      nightOutPlaceholder: (raw.nightOutPlaceholder as string | null | undefined) ?? null,
      winterRegularInPlaceholder: (raw.winterRegularInPlaceholder as string | null | undefined) ?? null,
      winterRegularOutPlaceholder: (raw.winterRegularOutPlaceholder as string | null | undefined) ?? null,
      winterMorningInPlaceholder: (raw.winterMorningInPlaceholder as string | null | undefined) ?? null,
      winterMorningOutPlaceholder: (raw.winterMorningOutPlaceholder as string | null | undefined) ?? null,
      winterNightInPlaceholder: (raw.winterNightInPlaceholder as string | null | undefined) ?? null,
      winterNightOutPlaceholder: (raw.winterNightOutPlaceholder as string | null | undefined) ?? null,
    };
    return dayDetails;
  } catch (error) {
    return { message: error, status: 400 } as ErrorReturnType;
  } finally{
  }
};

export default getCurrentMonthDetails;
