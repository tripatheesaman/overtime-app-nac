import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

interface DepartmentRequest {
  id?: number;
  name: string;
  code: string;
  templateFile?: string; // Optional in request since we generate it
  regularInPlaceholder?: string | null;
  regularOutPlaceholder?: string | null;
  morningInPlaceholder?: string | null;
  morningOutPlaceholder?: string | null;
  nightInPlaceholder?: string | null;
  nightOutPlaceholder?: string | null;
  winterRegularInPlaceholder?: string | null;
  winterRegularOutPlaceholder?: string | null;
  winterMorningInPlaceholder?: string | null;
  winterMorningOutPlaceholder?: string | null;
  winterNightInPlaceholder?: string | null;
  winterNightOutPlaceholder?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      id, 
      name, 
      code,
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
    } = body as DepartmentRequest;

    // Validate required fields
    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json(
        { success: false, error: "Name and code are required and cannot be empty" },
        { status: 400 }
      );
    }

    // Validate code format (only alphanumeric characters)
    if (!/^[a-zA-Z0-9]+$/.test(code.trim())) {
      return NextResponse.json(
        { success: false, error: "Code must contain only letters and numbers" },
        { status: 400 }
      );
    }

    // Format code to lowercase for consistency and trim whitespace
    const formattedCode = code.trim().toLowerCase();
    const trimmedName = name.trim();

    // If updating, verify department exists
    if (id) {
      const departmentExists = await prisma.department.findUnique({
        where: { id: Number(id) }
      });
      
      if (!departmentExists) {
        return NextResponse.json(
          { success: false, error: "Department not found" },
          { status: 404 }
        );
      }
    }

    // Check for existing department with same name or code
    const existing = await prisma.department.findFirst({
      where: {
        OR: [
          { name: trimmedName },
          { code: formattedCode }
        ],
        NOT: id ? { id: Number(id) } : undefined
      }
    });

    if (existing) {
      const conflictType = existing.name === trimmedName ? 'name' : 'code';
      return NextResponse.json(
        { success: false, error: `Department with this ${conflictType} already exists` },
        { status: 400 }
      );
    }

    // Generate templateFile name based on department code
    const templateFile = `template_${formattedCode}.xlsx`;

    type DepartmentData = {
      name: string;
      code: string;
      templateFile: string;
      regularInPlaceholder?: string | null;
      regularOutPlaceholder?: string | null;
      morningInPlaceholder?: string | null;
      morningOutPlaceholder?: string | null;
      nightInPlaceholder?: string | null;
      nightOutPlaceholder?: string | null;
      winterRegularInPlaceholder?: string | null;
      winterRegularOutPlaceholder?: string | null;
      winterMorningInPlaceholder?: string | null;
      winterMorningOutPlaceholder?: string | null;
      winterNightInPlaceholder?: string | null;
      winterNightOutPlaceholder?: string | null;
    };

    const data: DepartmentData = { 
      name: trimmedName, 
      code: formattedCode,
      templateFile: templateFile
    };

    // Add placeholders if provided
    if (typeof regularInPlaceholder !== 'undefined') data.regularInPlaceholder = regularInPlaceholder || null;
    if (typeof regularOutPlaceholder !== 'undefined') data.regularOutPlaceholder = regularOutPlaceholder || null;
    if (typeof morningInPlaceholder !== 'undefined') data.morningInPlaceholder = morningInPlaceholder || null;
    if (typeof morningOutPlaceholder !== 'undefined') data.morningOutPlaceholder = morningOutPlaceholder || null;
    if (typeof nightInPlaceholder !== 'undefined') data.nightInPlaceholder = nightInPlaceholder || null;
    if (typeof nightOutPlaceholder !== 'undefined') data.nightOutPlaceholder = nightOutPlaceholder || null;
    if (typeof winterRegularInPlaceholder !== 'undefined') data.winterRegularInPlaceholder = winterRegularInPlaceholder || null;
    if (typeof winterRegularOutPlaceholder !== 'undefined') data.winterRegularOutPlaceholder = winterRegularOutPlaceholder || null;
    if (typeof winterMorningInPlaceholder !== 'undefined') data.winterMorningInPlaceholder = winterMorningInPlaceholder || null;
    if (typeof winterMorningOutPlaceholder !== 'undefined') data.winterMorningOutPlaceholder = winterMorningOutPlaceholder || null;
    if (typeof winterNightInPlaceholder !== 'undefined') data.winterNightInPlaceholder = winterNightInPlaceholder || null;
    if (typeof winterNightOutPlaceholder !== 'undefined') data.winterNightOutPlaceholder = winterNightOutPlaceholder || null;

    const record = id
      ? await prisma.department.update({
          where: { id: Number(id) },
          data: data
        })
      : await prisma.department.create({
          data: data
        });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}
