import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buildSeedProducts, categorySeed } from "@/lib/initial-data";

export type SeedMode = "safe" | "resetCatalog";

export async function ensureDefaultAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@dym.test";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { isActive: true },
    create: { email: adminEmail, passwordHash, name: "관리자", role: "SUPER_ADMIN", isActive: true }
  });

  return { id: admin.id, email: admin.email };
}

export async function resetDefaultAdminPassword() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@dym.test";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash, isActive: true, name: "관리자", role: "SUPER_ADMIN" },
    create: { email: adminEmail, passwordHash, name: "관리자", role: "SUPER_ADMIN", isActive: true }
  });

  return { id: admin.id, email: admin.email };
}

async function upsertCatalog({ resetImages = false, resetSpecs = false }: { resetImages?: boolean; resetSpecs?: boolean } = {}) {
  const categories = new Map<string, string>();

  for (const [index, category] of categorySeed.entries()) {
    const saved = await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description, sortOrder: index },
      create: { slug: category.slug, name: category.name, description: category.description, sortOrder: index }
    });
    categories.set(category.slug, saved.id);
  }

  const products = buildSeedProducts();
  for (const product of products) {
    const categoryId = categories.get(product.categorySlug);
    if (!categoryId) continue;

    const saved = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        slug: product.slug,
        name: product.name,
        categoryId,
        description: product.description,
        shortDesc: product.description.slice(0, 80),
        price: product.price,
        originalPrice: product.originalPrice,
        stockStatus: product.stockStatus,
        deliveryText: product.deliveryText,
        badge: product.badge,
        rating: product.rating,
        reviewCount: product.reviewCount,
        isFeatured: product.isFeatured,
        isVisible: true,
        sortOrder: product.sortOrder
      },
      create: {
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        categoryId,
        description: product.description,
        shortDesc: product.description.slice(0, 80),
        price: product.price,
        originalPrice: product.originalPrice,
        stockStatus: product.stockStatus,
        deliveryText: product.deliveryText,
        badge: product.badge,
        rating: product.rating,
        reviewCount: product.reviewCount,
        isFeatured: product.isFeatured,
        isVisible: true,
        sortOrder: product.sortOrder
      }
    });

    const existingImages = await prisma.productImage.count({ where: { productId: saved.id } });
    if (resetImages || existingImages === 0) {
      await prisma.productImage.deleteMany({ where: { productId: saved.id } });
      await prisma.productImage.createMany({
        data: product.images.map((image, imageIndex) => ({
          productId: saved.id,
          url: image.url,
          alt: image.alt || `${product.name} 이미지 ${imageIndex + 1}`,
          type: image.type || (imageIndex === 0 ? "MAIN" : "DETAIL"),
          sortOrder: imageIndex,
          isMain: image.isMain ?? imageIndex === 0
        }))
      });
    }

    const existingSpecs = await prisma.productSpec.count({ where: { productId: saved.id } });
    if (resetSpecs || existingSpecs === 0) {
      await prisma.productSpec.deleteMany({ where: { productId: saved.id } });
      await prisma.productSpec.createMany({
        data: product.specs.map((spec, specIndex) => ({
          productId: saved.id,
          key: spec.key,
          value: spec.value,
          group: spec.group ?? "기본 제원",
          sortOrder: specIndex
        }))
      });
    }
  }

  return { productCount: products.length, categoryCount: categorySeed.length };
}

export async function seedDatabase(mode: SeedMode = "safe") {
  const admin = await resetDefaultAdminPassword();

  if (mode === "resetCatalog") {
    await prisma.productSpec.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.productCategory.deleteMany();
  }

  const catalog = await upsertCatalog({ resetImages: mode === "resetCatalog", resetSpecs: mode === "resetCatalog" });

  await prisma.auditLog.create({
    data: {
      action: mode === "resetCatalog" ? "RESET_SEED_CATALOG" : "SEED_DATABASE",
      actor: "system",
      target: "database",
      metadata: { productCount: catalog.productCount, adminEmail: admin.email }
    }
  });

  return { ...catalog, adminEmail: admin.email, mode };
}

export async function seedIfEmpty() {
  const [productCount, adminCount, imageCount] = await Promise.all([prisma.product.count(), prisma.admin.count(), prisma.productImage.count()]);

  if (productCount === 0) {
    const result = await seedDatabase("safe");
    return { skipped: false, ...result };
  }

  if (imageCount === 0) {
    const catalog = await upsertCatalog({ resetImages: true, resetSpecs: false });
    const admin = await resetDefaultAdminPassword();
    return { skipped: false, repairedImages: true, ...catalog, adminEmail: admin.email };
  }

  if (adminCount === 0) {
    const admin = await resetDefaultAdminPassword();
    return { skipped: true, productCount, adminCreated: true, adminEmail: admin.email };
  }

  await ensureDefaultAdmin();
  return { skipped: true, productCount };
}
