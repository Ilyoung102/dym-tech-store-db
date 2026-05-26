import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context): Promise<NextResponse> {
  try {
    await requireAdmin();
    const { id } = await context.params;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "BLOB_TOKEN_MISSING", message: "Vercel Blob 저장소를 프로젝트에 연결하고 BLOB_READ_WRITE_TOKEN 환경변수를 설정하세요." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) {
      return NextResponse.json({ error: "PRODUCT_NOT_FOUND", message: "상품을 찾을 수 없습니다." }, { status: 404 });
    }

    const body = (await request.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        let payload: { productId?: string; type?: string; isMain?: boolean; alt?: string } = {};
        try {
          payload = clientPayload ? JSON.parse(clientPayload) : {};
        } catch {
          payload = {};
        }

        if (payload.productId && payload.productId !== id) {
          throw new Error("상품 ID가 일치하지 않습니다.");
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maximumSizeInBytes: 20 * 1024 * 1024,
          tokenPayload: JSON.stringify({ productId: id, type: payload.type || "DETAIL", isMain: Boolean(payload.isMain), alt: payload.alt || "상품 이미지" })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("product image blob upload completed", { pathname: blob.pathname, tokenPayload });
      }
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "BLOB_CLIENT_UPLOAD_TOKEN_FAILED", message: error instanceof Error ? error.message : "Blob 업로드 토큰 생성 실패" },
      { status: 400 }
    );
  }
}
