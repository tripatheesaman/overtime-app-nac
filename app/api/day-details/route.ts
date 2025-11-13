import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/app/lib/prisma";

export async function GET() {
  try {
    const months = await prisma.dayDetails.findMany({
      orderBy: [{ year: "desc" }, { id: "desc" }],
    });

    // Ensure holidays, dashainDays, and tiharDays are proper JSON arrays
    const processedMonths = months.map(month => ({
      ...month,
      holidays: Array.isArray(month.holidays) ? month.holidays : [],
      dashainDays: Array.isArray(month.dashainDays) ? month.dashainDays : null,
      tiharDays: Array.isArray(month.tiharDays) ? month.tiharDays : null
    }));

    return NextResponse.json({ success: true, data: processedMonths });
  } catch (error) {
    console.error('DayDetails GET Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      startingday,
      numberofdays,
      holidays,
      year,
      isActiveMonth,
      monthNumber,
      isDashainMonth,
      dashainDays,
      isTiharMonth,
      tiharDays,
      regularInPlaceholder,
      regularOutPlaceholder,
      morningInPlaceholder,
      morningOutPlaceholder,
      nightInPlaceholder,
      nightOutPlaceholder,
      winterRegularInPlaceholder,
      winterRegularOutPlaceholder,
      winterMorningInPlaceholder,
      winterMorningOutPlaceholder,
      winterNightInPlaceholder,
      winterNightOutPlaceholder,
    } = body || {};

    type DayDetailsPayload = {
      name: string;
      startingday: number;
      numberofdays: number;
      holidays: number[] | string;
      year: number;
      isActiveMonth: boolean;
      monthNumber?: number;
      isDashainMonth?: boolean;
      dashainDays?: number[] | null;
      isTiharMonth?: boolean;
      tiharDays?: number[] | null;
      regularInPlaceholder?: string;
      regularOutPlaceholder?: string;
      morningInPlaceholder?: string;
      morningOutPlaceholder?: string;
      nightInPlaceholder?: string;
      nightOutPlaceholder?: string;
      winterRegularInPlaceholder?: string;
      winterRegularOutPlaceholder?: string;
      winterMorningInPlaceholder?: string;
      winterMorningOutPlaceholder?: string;
      winterNightInPlaceholder?: string;
      winterNightOutPlaceholder?: string;
    };

    const payload: DayDetailsPayload = {
      name,
      startingday,
      numberofdays,
      holidays,
      year,
      isActiveMonth: Boolean(isActiveMonth),
    };

    if (typeof monthNumber !== "undefined") {
      payload.monthNumber = Number(monthNumber);
    }

    if (typeof isDashainMonth !== "undefined") payload.isDashainMonth = Boolean(isDashainMonth);
    if (typeof dashainDays !== "undefined") payload.dashainDays = dashainDays ?? null;
    if (typeof isTiharMonth !== "undefined") payload.isTiharMonth = Boolean(isTiharMonth);
    if (typeof tiharDays !== "undefined") payload.tiharDays = tiharDays ?? null;

    // Placeholders
    if (typeof regularInPlaceholder !== 'undefined') payload.regularInPlaceholder = regularInPlaceholder;
    if (typeof regularOutPlaceholder !== 'undefined') payload.regularOutPlaceholder = regularOutPlaceholder;
    if (typeof morningInPlaceholder !== 'undefined') payload.morningInPlaceholder = morningInPlaceholder;
    if (typeof morningOutPlaceholder !== 'undefined') payload.morningOutPlaceholder = morningOutPlaceholder;
    if (typeof nightInPlaceholder !== 'undefined') payload.nightInPlaceholder = nightInPlaceholder;
    if (typeof nightOutPlaceholder !== 'undefined') payload.nightOutPlaceholder = nightOutPlaceholder;
    if (typeof winterRegularInPlaceholder !== 'undefined') payload.winterRegularInPlaceholder = winterRegularInPlaceholder;
    if (typeof winterRegularOutPlaceholder !== 'undefined') payload.winterRegularOutPlaceholder = winterRegularOutPlaceholder;
    if (typeof winterMorningInPlaceholder !== 'undefined') payload.winterMorningInPlaceholder = winterMorningInPlaceholder;
    if (typeof winterMorningOutPlaceholder !== 'undefined') payload.winterMorningOutPlaceholder = winterMorningOutPlaceholder;
    if (typeof winterNightInPlaceholder !== 'undefined') payload.winterNightInPlaceholder = winterNightInPlaceholder;
    if (typeof winterNightOutPlaceholder !== 'undefined') payload.winterNightOutPlaceholder = winterNightOutPlaceholder;

    // Coerce JSON fields to Prisma-compatible inputs
    const dataForPrisma = { ...payload } as Omit<
      typeof payload,
      'dashainDays' | 'tiharDays'
    > & {
      dashainDays?: number[] | Prisma.NullableJsonNullValueInput;
      tiharDays?: number[] | Prisma.NullableJsonNullValueInput;
    };
    if (Object.prototype.hasOwnProperty.call(payload, "dashainDays")) {
      dataForPrisma.dashainDays =
        payload.dashainDays === null ? Prisma.JsonNull : (payload.dashainDays as number[]);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "tiharDays")) {
      dataForPrisma.tiharDays =
        payload.tiharDays === null ? Prisma.JsonNull : (payload.tiharDays as number[]);
    }

    let record;
    if (id) {
      record = await prisma.dayDetails.update({ where: { id: Number(id) }, data: dataForPrisma });
    } else {
      // Ensure required fields for create
      if (typeof (dataForPrisma as Record<string, unknown>).monthNumber === 'undefined') {
        (dataForPrisma as Record<string, unknown>).monthNumber = 1;
      }
      record = await prisma.dayDetails.create({ data: dataForPrisma as unknown as Prisma.DayDetailsCreateInput });
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}

// Set active month by id and deactivate others
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body || {};
    if (!id) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });

    await prisma.$transaction([
      prisma.dayDetails.updateMany({ data: { isActiveMonth: false } }),
      prisma.dayDetails.update({ where: { id: Number(id) }, data: { isActiveMonth: true } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}


