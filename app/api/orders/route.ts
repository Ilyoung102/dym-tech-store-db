import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const OrderItemSchema = z.object({
  productId: z.string().optional(),
  sku: z.string(),
  name: z.string(),
  price: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  imageUrl: z.string().optional()
});

const OrderSchema = z.object({
  customerName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(1),
  installAddress: z.string().optional(),
  installDate: z.string().optional(),
  requestMemo: z.string().optional(),
  paymentMethod: z.string().default("MOCK"),
  items: z.array(OrderItemSchema).min(1)
});

export async function POST(request: Request) {
  try {
    const body = OrderSchema.parse(await request.json());
    const totalAmount = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderNo = `DYM-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        orderNo,
        customerName: body.customerName,
        phone: body.phone,
        email: body.email || null,
        address: body.address,
        installAddress: body.installAddress,
        installDate: body.installDate ? new Date(body.installDate) : null,
        requestMemo: body.requestMemo,
        paymentMethod: body.paymentMethod,
        paymentStatus: "MOCK_READY",
        orderStatus: "NEW",
        totalAmount,
        items: {
          create: body.items.map((item) => ({
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl
          }))
        }
      },
      include: { items: true }
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ORDER_CREATE_FAILED" }, { status: 400 });
  }
}
