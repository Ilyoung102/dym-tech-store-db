import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const QuoteSchema = z.object({
  companyName: z.string().optional(),
  managerName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  installPlace: z.string().optional(),
  desiredProduct: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  supplyType: z.string().optional(),
  message: z.string().min(1),
  privacyAgreed: z.boolean().refine(Boolean, "개인정보 동의가 필요합니다.")
});

export async function POST(request: Request) {
  try {
    const body = QuoteSchema.parse(await request.json());
    const quote = await prisma.quoteRequest.create({
      data: {
        companyName: body.companyName,
        managerName: body.managerName,
        phone: body.phone,
        email: body.email || null,
        installPlace: body.installPlace,
        desiredProduct: body.desiredProduct,
        quantity: body.quantity,
        supplyType: body.supplyType,
        message: body.message,
        privacyAgreed: body.privacyAgreed
      }
    });
    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "QUOTE_CREATE_FAILED" }, { status: 400 });
  }
}
