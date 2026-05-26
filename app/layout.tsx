import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DYM Tech Store | 전자기기 전문 쇼핑몰",
  description: "동영엠텍 스타일의 B2B/B2C 전자기기 제품 판매, 견적문의, 관리자 상품관리 테스트 쇼핑몰",
  openGraph: {
    title: "DYM Tech Store",
    description: "Prisma + PostgreSQL + 이미지 업로드 기반 전자기기 쇼핑몰 테스트",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
