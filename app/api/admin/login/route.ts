import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setAdminSession } from "@/lib/auth";
import { ensureDefaultAdmin, resetDefaultAdminPassword } from "@/lib/seed";

export const dynamic = "force-dynamic";

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(4) });

function isDefaultDevAdmin(email: string, password: string) {
  const defaultEmail = process.env.ADMIN_EMAIL || "admin@dym.test";
  const defaultPassword = process.env.ADMIN_PASSWORD || "admin1234";
  return email === defaultEmail && password === defaultPassword;
}

export async function POST(request: Request) {
  try {
    const body = LoginSchema.parse(await request.json());

    await ensureDefaultAdmin();

    let admin = await prisma.admin.findFirst({ where: { email: body.email, isActive: true } });

    if (!admin && isDefaultDevAdmin(body.email, body.password)) {
      await resetDefaultAdminPassword();
      admin = await prisma.admin.findFirst({ where: { email: body.email, isActive: true } });
    }

    if (!admin) return NextResponse.json({ error: "INVALID_LOGIN" }, { status: 401 });

    let ok = await bcrypt.compare(body.password, admin.passwordHash);

    // 개발/테스트 중 이전 seed의 비밀번호 해시가 꼬인 경우 기본 계정은 자동 복구합니다.
    if (!ok && isDefaultDevAdmin(body.email, body.password)) {
      await resetDefaultAdminPassword();
      admin = await prisma.admin.findFirst({ where: { email: body.email, isActive: true } });
      ok = !!admin && await bcrypt.compare(body.password, admin.passwordHash);
    }

    if (!admin || !ok) return NextResponse.json({ error: "INVALID_LOGIN" }, { status: 401 });

    await setAdminSession(admin.id);
    await prisma.auditLog.create({ data: { actor: admin.email, action: "ADMIN_LOGIN", target: "Admin", targetId: admin.id } });
    return NextResponse.json({ admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "LOGIN_FAILED" }, { status: 400 });
  }
}
