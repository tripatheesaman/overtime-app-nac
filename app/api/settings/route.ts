import { NextRequest, NextResponse } from "next/server";
import { getAppSettings, upsertAppSettings } from "@/app/lib/settings";
import { canMutateGlobalSettings, getAdminSession } from "@/app/lib/auth";

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: true, data: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!canMutateGlobalSettings(session)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    const payload = await req.json();
    await upsertAppSettings(payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}

