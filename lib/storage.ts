import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put, del } from "@vercel/blob";

export type StoredFile = {
  url: string;
  pathname?: string;
};

function safeFileName(fileName: string) {
  const base = fileName.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
  return `${Date.now()}-${base}`;
}

export async function uploadProductAsset(file: File): Promise<StoredFile> {
  const maxBytes = 4.5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("FILE_TOO_LARGE_4_5MB");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("ONLY_IMAGE_FILE_ALLOWED");
  }

  const fileName = safeFileName(file.name || "product-image.png");
  const pathname = `products/uploads/${fileName}`;
  const driver = process.env.STORAGE_DRIVER || (process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local");

  if (driver === "vercel-blob") {
    const blob = await put(pathname, file, { access: "public", addRandomSuffix: true });
    return { url: blob.url, pathname: blob.pathname };
  }

  const arrayBuffer = await file.arrayBuffer();
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const localName = safeFileName(file.name || "product-image.png");
  await writeFile(path.join(uploadDir, localName), Buffer.from(arrayBuffer));
  return { url: `/uploads/${localName}`, pathname: `uploads/${localName}` };
}

export async function deleteProductAsset(pathname?: string | null) {
  if (!pathname) return;
  if ((process.env.STORAGE_DRIVER || "") === "vercel-blob" && process.env.BLOB_READ_WRITE_TOKEN) {
    await del(pathname);
  }
}
