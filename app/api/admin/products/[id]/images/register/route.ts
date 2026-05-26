import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serializeProduct } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const registerSchema = z.object({
  url: z.string().url(),
  pathname: z.string().optional().nullable(),
  type: z.string().default("DETAIL"),
  isMain: z.boolean().default(false),
  alt: z.string().optional().nullable()
});

export async function POST(request: Request, context: Context) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const input = registerSchema.parse(await request.json());

    const productExists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!productExists) {
      return NextResponse.json({ error: "PRODUCT_NOT_FOUND", message: "상품을 찾을 수 없습니다." }, { status: 404 });
    }

    const count = await prisma.productImage.count({ where: { productId: id } });
    const product = await prisma.$transaction(async (tx) => {
      if (input.isMain) {
        await tx.productImage.updateMany({ where: { productId: id }, data: { isMain: false } });
      }

      await tx.productImage.create({
        data: {
          productId: id,
          url: input.url,
          pathname: input.pathname || null,
          alt: input.alt || "상품 이미지",
          type: input.type,
          isMain: input.isMain || count === 0,
          sortOrder: count
        }
      });

      await tx.auditLog.create({ data: { actor: admin.email, action: "REGISTER_PRODUCT_IMAGE", target: "Product", targetId: id, metadata: { type: input.type, url: input.url } } });

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: { category: true, specs: { orderBy: { sortOrder: "asc" } }, images: { orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }] } }
      });
    });

    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "REGISTER_PRODUCT_IMAGE_FAILED", message: error instanceof Error ? error.message : "이미지 DB 등록 실패" },
      { status: 400 }
    );
  }
}
