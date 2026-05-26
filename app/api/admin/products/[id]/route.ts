import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serializeProduct } from "@/lib/serialize";

export const dynamic = "force-dynamic";

const SpecSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  group: z.string().optional(),
  sortOrder: z.number().int().optional()
});

const UpdateProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  categorySlug: z.string().min(1),
  description: z.string().min(1),
  price: z.number().int().nonnegative(),
  originalPrice: z.number().int().nonnegative().nullable().optional(),
  stockStatus: z.string().min(1),
  deliveryText: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  specs: z.array(SpecSchema).default([])
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = UpdateProductSchema.parse(await request.json());

    const category = await prisma.productCategory.findUnique({ where: { slug: body.categorySlug } });
    if (!category) return NextResponse.json({ error: "CATEGORY_NOT_FOUND" }, { status: 404 });

    const product = await prisma.$transaction(async (tx) => {
      await tx.productSpec.deleteMany({ where: { productId: id } });
      const updated = await tx.product.update({
        where: { id },
        data: {
          sku: body.sku,
          name: body.name,
          categoryId: category.id,
          description: body.description,
          shortDesc: body.description.slice(0, 80),
          price: body.price,
          originalPrice: body.originalPrice ?? null,
          stockStatus: body.stockStatus,
          deliveryText: body.deliveryText,
          badge: body.badge,
          isVisible: body.isVisible,
          isFeatured: body.isFeatured,
          specs: {
            create: body.specs.map((spec, index) => ({
              key: spec.key,
              value: spec.value,
              group: spec.group || "기본 제원",
              sortOrder: spec.sortOrder ?? index
            }))
          }
        },
        include: { category: true, specs: { orderBy: { sortOrder: "asc" } }, images: { orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }] } }
      });
      await tx.auditLog.create({ data: { actor: admin.email, action: "UPDATE_PRODUCT", target: "Product", targetId: id, metadata: { sku: body.sku } } });
      return updated;
    });

    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "UPDATE_PRODUCT_FAILED" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    await prisma.product.update({ where: { id }, data: { isVisible: false } });
    await prisma.auditLog.create({ data: { actor: admin.email, action: "HIDE_PRODUCT", target: "Product", targetId: id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "DELETE_PRODUCT_FAILED" }, { status: 400 });
  }
}
