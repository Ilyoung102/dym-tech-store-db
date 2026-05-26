import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { uploadProductAsset } from "@/lib/storage";
import { serializeProduct } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const form = await request.formData();
    const file = form.get("file");
    const type = String(form.get("type") || "DETAIL");
    const isMain = String(form.get("isMain") || "false") === "true";
    const alt = String(form.get("alt") || "상품 이미지");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
    }

    const stored = await uploadProductAsset(file);
    const count = await prisma.productImage.count({ where: { productId: id } });

    const product = await prisma.$transaction(async (tx) => {
      if (isMain) {
        await tx.productImage.updateMany({ where: { productId: id }, data: { isMain: false } });
      }
      await tx.productImage.create({
        data: {
          productId: id,
          url: stored.url,
          pathname: stored.pathname,
          alt,
          type,
          isMain: isMain || count === 0,
          sortOrder: count
        }
      });
      await tx.auditLog.create({ data: { actor: admin.email, action: "UPLOAD_PRODUCT_IMAGE", target: "Product", targetId: id, metadata: { type, url: stored.url } } });
      return tx.product.findUniqueOrThrow({
        where: { id },
        include: { category: true, specs: { orderBy: { sortOrder: "asc" } }, images: { orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }] } }
      });
    });

    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "UPLOAD_PRODUCT_IMAGE_FAILED" }, { status: 400 });
  }
}
