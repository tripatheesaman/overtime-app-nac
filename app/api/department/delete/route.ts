import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    // Check if department has any overtime records
    const hasRecords = await prisma.overTimeDetails.findFirst({
      where: { departmentId: Number(id) }
    });

    if (hasRecords) {
      return NextResponse.json(
        { success: false, error: "Cannot delete department with existing records" },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}