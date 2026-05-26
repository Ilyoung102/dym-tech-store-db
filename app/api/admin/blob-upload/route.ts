import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type UploadPayload = {
  productId?: string;
  type?: string;
  isMain?: boolean;
  alt?: string;
};

function parsePayload(clientPayload?: string | null): UploadPayload {
  if (!clientPayload) return {};
  try {
    const parsed = JSON.parse(clientPayload) as UploadPayload;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/admin/blob-upload",
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    storageDriver: process.env.STORAGE_DRIVER || "not-set",
    message: "Blob client upload token route is reachable. POST is used by @vercel/blob/client upload()."
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "BLOB_TOKEN_MISSING", message: "BLOB_READ_WRITE_TOKEN 환경변수가 현재 배포에 없습니다. Blob Store가 이 Vercel 프로젝트와 Production/Preview 환경에 연결됐는지 확인하세요." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        // 이 함수는 브라우저가 업로드 직전에 토큰을 요청할 때 실행됩니다.
        // 여기서만 관리자 권한을 확인해야 Blob 업로드 완료 콜백이 쿠키 없이 와도 실패하지 않습니다.
        await requireAdmin();

        const payload = parsePayload(clientPayload);
        if (!payload.productId) {
          throw new Error("productId가 누락되었습니다.");
        }

        const product = await prisma.product.findUnique({ where: { id: payload.productId }, select: { id: true } });
        if (!product) {
          throw new Error("상품을 찾을 수 없습니다.");
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maximumSizeInBytes: 20 * 1024 * 1024,
          tokenPayload: JSON.stringify({
            productId: payload.productId,
            type: payload.type || "DETAIL",
            isMain: Boolean(payload.isMain),
            alt: payload.alt || "상품 이미지"
          })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("product image blob upload completed", { pathname: blob.pathname, tokenPayload });
      }
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("blob upload token route failed", error);
    return NextResponse.json(
      { error: "BLOB_CLIENT_UPLOAD_TOKEN_FAILED", message: error instanceof Error ? error.message : "Blob 업로드 토큰 생성 실패" },
      { status: 400 }
    );
  }
}
