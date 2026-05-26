import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasBlobStoreId: Boolean(process.env.BLOB_STORE_ID),
    storageDriver: process.env.STORAGE_DRIVER || "not-set",
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasDirectUrl: Boolean(process.env.DIRECT_URL),
    nodeEnv: process.env.NODE_ENV || "unknown"
  });
}
