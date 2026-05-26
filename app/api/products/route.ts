import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedIfEmpty } from "@/lib/seed";
import { serializeProduct } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (process.env.AUTO_SEED_ON_EMPTY === "true") {
      await seedIfEmpty();
    }

    const categories = await prisma.productCategory.findMany({ orderBy: { sortOrder: "asc" } });
    const products = await prisma.product.findMany({
      where: { isVisible: true },
      include: {
        category: true,
        specs: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }] }
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }]
    });

    const serialized = products.map(serializeProduct);
    const sections = categories.map((category) => ({
      title: category.name,
      slug: category.slug,
      description: category.description,
      count: serialized.filter((product) => product.categorySlug === category.slug).length,
      items: serialized.filter((product) => product.categorySlug === category.slug)
    }));

    return NextResponse.json({ products: serialized, sections });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "PRODUCTS_LOAD_FAILED" }, { status: 500 });
  }
}
