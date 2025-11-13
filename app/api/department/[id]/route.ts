import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid department ID" },
        { status: 400 }
      );
    }

    const department = await prisma.department.findUnique({
      where: { id }
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: department });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}