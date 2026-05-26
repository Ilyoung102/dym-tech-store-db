import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serializeProduct } from "@/lib/serialize";

export const dynamic = "force-dynamic";

const CreateProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  categorySlug: z.string().min(1),
  description: z.string().min(1).default("신규 상품 설명"),
  price: z.number().int().nonnegative().default(0),
  originalPrice: z.number().int().nonnegative().nullable().optional(),
  stockStatus: z.string().default("재고 있음"),
  deliveryText: z.string().optional(),
  badge: z.string().optional()
});

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  try {
    await requireAdmin();
    const products = await prisma.product.findMany({
      include: { category: true, specs: { orderBy: { sortOrder: "asc" } }, images: { orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }] } },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }]
    });
    return NextResponse.json({ products: products.map(serializeProduct) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ADMIN_PRODUCTS_LOAD_FAILED" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = CreateProductSchema.parse(await request.json());
    const category = await prisma.productCategory.findUnique({ where: { slug: body.categorySlug } });
    if (!category) return NextResponse.json({ error: "CATEGORY_NOT_FOUND" }, { status: 404 });

    const product = await prisma.product.create({
      data: {
        sku: body.sku,
        slug: `${slugify(body.name)}-${Date.now()}`,
        name: body.name,
        description: body.description,
        shortDesc: body.description.slice(0, 80),
        price: body.price,
        originalPrice: body.originalPrice,
        stockStatus: body.stockStatus,
        deliveryText: body.deliveryText,
        badge: body.badge,
        categoryId: category.id,
        sortOrder: await prisma.product.count()
      },
      include: { category: true, specs: true, images: true }
    });
    await prisma.auditLog.create({ data: { actor: admin.email, action: "CREATE_PRODUCT", target: "Product", targetId: product.id } });
    return NextResponse.json({ product: serializeProduct(product) }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "CREATE_PRODUCT_FAILED" }, { status: 400 });
  }
}
