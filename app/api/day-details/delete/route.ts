import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const record = await prisma.dayDetails.findUnique({
      where: { id: Number(id) }
    });

    if (!record) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    // Don't allow deleting active month
    if (record.isActiveMonth) {
      return NextResponse.json(
        { success: false, error: "Cannot delete active month" },
        { status: 400 }
      );
    }

    await prisma.dayDetails.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}