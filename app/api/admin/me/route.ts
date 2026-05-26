import { NextResponse } from "next/server";
import { getAdminFromSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminFromSession();
  return NextResponse.json({ admin });
}
