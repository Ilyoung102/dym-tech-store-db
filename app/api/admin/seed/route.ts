import { NextResponse } from "next/server";
import { getAdminFromSession } from "@/lib/auth";
import { seedDatabase } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = request.headers.get("x-setup-token");
  const admin = await getAdminFromSession();
  const setupTokenOk = !!process.env.ADMIN_SETUP_TOKEN && token === process.env.ADMIN_SETUP_TOKEN;

  if (!admin && !setupTokenOk) {
    return NextResponse.json({ error: "UNAUTHORIZED_SEED" }, { status: 401 });
  }

  let mode: "safe" | "resetCatalog" = "safe";
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.mode === "resetCatalog") mode = "resetCatalog";
  } catch {
    mode = "safe";
  }

  const result = await seedDatabase(mode);
  return NextResponse.json(result);
}
