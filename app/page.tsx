"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { upload as uploadBlob } from "@vercel/blob/client";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Boxes,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  Headphones,
  ImagePlus,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquareText,
  Minus,
  PackageCheck,
  PhoneCall,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Truck,
  Upload,
  User,
  Wrench,
  X,
  Tv2,
  LockKeyhole,
  Wifi,
  Radio,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  CircleHelp
} from "lucide-react";
import type { CartItem, ProductDTO, ProductSectionDTO, ProductSpecDTO } from "@/types/product";
import { buildSeedProducts, categorySeed } from "@/lib/initial-data";

type PageName = "home" | "products" | "detail" | "compare" | "cart" | "quote" | "cases" | "support" | "company" | "admin";
type AdminView = "dashboard" | "products" | "orders" | "quotes" | "support";

type AdminUser = { id: string; email: string; name: string; role: string };
type ProductsResponse = { products: ProductDTO[]; sections: ProductSectionDTO[] };

type Toast = { kind: "ok" | "error" | "info"; message: string } | null;

const fmt = (value: number) => new Intl.NumberFormat("ko-KR").format(value) + "원";
const mainImage = (product: ProductDTO) => product.images.find((image) => image.isMain)?.url || product.images[0]?.url || "";
const discountRate = (product: ProductDTO) => {
  if (!product.originalPrice || product.originalPrice <= product.price) return 0;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
};

type ImageVariant = "thumb" | "detail" | "original";

function toWebpPath(src: string, variant: ImageVariant) {
  if (!src || src.startsWith("http") || src.startsWith("data:") || src.startsWith("blob:")) return src;

  const normalized = src.replaceAll("\\", "/");
  const fileName = normalized.split("/").pop() || "";
  const webpName = fileName.replace(/\.[^.]+$/, ".webp").toLowerCase();

  if (normalized.startsWith("/catalog/original/")) {
    if (variant === "original") return normalized;
    return `/catalog/${variant}/${webpName}`;
  }

  if (normalized.startsWith("/info/original/")) {
    if (variant === "original") return normalized;
    return `/info/${variant === "thumb" ? "thumb" : "detail"}/${webpName}`;
  }

  return normalized;
}

function infoReadableSrc(src?: string) {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("data:") || src.startsWith("blob:")) return src;
  const normalized = src.replaceAll("\\", "/");
  if (normalized.startsWith("/info/original/")) return normalized;
  if (normalized.startsWith("/info/detail/")) {
    return normalized.replace("/info/detail/", "/info/original/").replace(/\.webp$/i, ".jpg");
  }
  if (normalized.startsWith("/info/thumb/")) {
    return normalized.replace("/info/thumb/", "/info/original/").replace(/\.webp$/i, ".jpg");
  }
  return normalized;
}


async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  const maxDimension = 1600;
  const targetBytes = 1.4 * 1024 * 1024;

  if (file.size <= targetBytes && ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch (error) {
    console.warn("이미지 압축 실패, 원본 업로드 시도", error);
    return file;
  }
}

function safeUploadName(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
  return base || "product-image.webp";
}

async function readApiError(response: Response) {
  try {
    const data = await response.json();
    return data?.message || data?.error || response.statusText;
  } catch {
    return response.statusText || `HTTP ${response.status}`;
  }
}

const navItems: Array<[PageName, string]> = [
  ["home", "홈"],
  ["products", "제품"],
  ["compare", "제품비교"],
  ["cases", "시공/납품사례"],
  ["support", "고객지원"],
  ["company", "회사소개"],
  ["admin", "관리자"]
];

function buildStaticCatalog(): ProductsResponse {
  const seedProducts = buildSeedProducts();
  const products: ProductDTO[] = seedProducts.map((product) => ({
    id: product.sku,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    category: product.category,
    categorySlug: product.categorySlug,
    description: product.description,
    shortDesc: product.description.slice(0, 80),
    price: product.price,
    originalPrice: product.originalPrice,
    stockStatus: product.stockStatus,
    deliveryText: product.deliveryText,
    badge: product.badge,
    rating: product.rating,
    reviewCount: product.reviewCount,
    isVisible: true,
    isFeatured: product.isFeatured,
    sortOrder: product.sortOrder,
    specs: product.specs.map((spec, index) => ({
      id: `${product.sku}-spec-${index}`,
      key: spec.key,
      value: spec.value,
      group: spec.group ?? "기본",
      sortOrder: index
    })),
    images: product.images.map((image, index) => ({
      id: `${product.sku}-image-${index}`,
      url: image.url,
      alt: image.alt ?? `${product.name} 이미지 ${index + 1}`,
      type: image.type ?? (index === 0 ? "MAIN" : "DETAIL"),
      sortOrder: index,
      isMain: image.isMain ?? index === 0
    }))
  }));

  const sections: ProductSectionDTO[] = categorySeed.map((category) => {
    const items = products.filter((product) => product.categorySlug === category.slug);
    return {
      title: category.name,
      slug: category.slug,
      description: category.description,
      count: items.length,
      items
    };
  });

  return { products, sections };
}

const STATIC_CATALOG = buildStaticCatalog();

export default function HomePage() {
  const [page, setPage] = useState<PageName>("home");
  const [adminView, setAdminView] = useState<AdminView>("dashboard");
  const [products, setProducts] = useState<ProductDTO[]>(STATIC_CATALOG.products);
  const [sections, setSections] = useState<ProductSectionDTO[]>(STATIC_CATALOG.sections);
  const [selected, setSelected] = useState<ProductDTO | null>(STATIC_CATALOG.products[0] ?? null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [compare, setCompare] = useState<ProductDTO[]>(STATIC_CATALOG.products.slice(0, 2));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [sectionFilter, setSectionFilter] = useState("전체");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  async function loadProducts() {
    setLoading(true);
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      if (!response.ok) throw new Error("상품 목록을 불러오지 못했습니다.");
      const data = (await response.json()) as ProductsResponse;
      setDbReady(true);
      setProducts(data.products);
      setSections(data.sections);
      setSelected((current) => {
        if (!data.products.length) return null;
        if (!current) return data.products[0];
        return data.products.find((product) => product.id === current.id || product.sku === current.sku) || data.products[0];
      });
      setCompare((current) => current.length ? current.map((item) => data.products.find((p) => p.id === item.id || p.sku === item.sku) || item).slice(0, 4) : data.products.slice(0, 2));
    } catch (error) {
      console.error(error);
      setToast({ kind: "error", message: "상품 DB/API 연결을 확인해 주세요." });
    } finally {
      setLoading(false);
    }
  }

  async function loadAdmin() {
    try {
      const response = await fetch("/api/admin/me", { cache: "no-store" });
      const data = (await response.json()) as { admin: AdminUser | null };
      setAdmin(data.admin);
    } catch {
      setAdmin(null);
    }
  }

  useEffect(() => {
    void loadProducts();
    void loadAdmin();
  }, []);

  const categories = useMemo(() => ["전체", ...sections.map((section) => section.title)], [sections]);

  const filteredProducts = useMemo(() => {
    const base = category === "전체" ? products : products.filter((product) => product.category === category);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((product) => [product.name, product.sku, product.category, product.description, ...product.specs.map((spec) => `${spec.key} ${spec.value}`)].join(" ").toLowerCase().includes(q));
  }, [products, category, query]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function gotoDetail(product: ProductDTO) {
    setSelected(product);
    setGalleryIndex(0);
    setPage("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addCart(product: ProductDTO) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    setToast({ kind: "ok", message: "장바구니에 담았습니다." });
  }

  function addCompare(product: ProductDTO) {
    setCompare((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      return [...prev, product].slice(-4);
    });
    setToast({ kind: "info", message: "비교 목록에 추가했습니다." });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header page={page} setPage={setPage} query={query} setQuery={setQuery} cartCount={cart.length} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} />
      {toast && <ToastBox toast={toast} onClose={() => setToast(null)} />}

      <main>
        {loading && <SyncNotice />}

        {page === "home" && (
          <>
            <Hero products={products} gotoDetail={gotoDetail} setPage={setPage} />
            <ProductPreviewShowcase sections={sections} selectedFilter={sectionFilter} setSelectedFilter={setSectionFilter} gotoDetail={gotoDetail} addCart={addCart} addCompare={addCompare} />
            <TrustSection />
            <CasesPage compact />
          </>
        )}

        {page === "products" && (
          <ProductsPage products={filteredProducts} categories={categories} category={category} setCategory={setCategory} gotoDetail={gotoDetail} addCart={addCart} addCompare={addCompare} />
        )}

        {page === "detail" && selected && (
          <DetailPage product={selected} galleryIndex={galleryIndex} setGalleryIndex={setGalleryIndex} setPage={setPage} addCart={addCart} addCompare={addCompare} />
        )}

        {page === "compare" && <ComparePage compare={compare} setPage={setPage} />}
        {page === "cart" && <CartPage cart={cart} setCart={setCart} total={total} setPage={setPage} setToast={setToast} />}
        {page === "quote" && <QuotePage products={products} setToast={setToast} />}
        {page === "cases" && <CasesPage />}
        {page === "support" && <SimpleListPage title="고객지원" desc="공지사항, FAQ, 배송/설치 안내, A/S 접수, 자료실을 통합하는 고객지원 화면" items={["공지사항", "FAQ", "제품구입 안내", "배송/설치 안내", "A/S 접수", "카탈로그 다운로드", "1:1 문의"]} />}
        {page === "company" && <SimpleListPage title="회사소개" desc="기업 개요, 연혁, 인증현황, 특허현황, 찾아오시는 길을 제공하는 기업 홈페이지형 화면" items={["회사 개요", "경영이념", "연혁", "인증현황", "특허현황", "찾아오시는 길"]} />}
        {page === "admin" && (dbReady ? <AdminPage admin={admin} setAdmin={setAdmin} adminView={adminView} setAdminView={setAdminView} products={products} sections={sections} reloadProducts={loadProducts} setToast={setToast} /> : <AdminDbLoading />)}
      </main>

      <button onClick={() => setPage("quote")} className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-4 font-black text-white shadow-2xl shadow-red-300/40">
        <PhoneCall size={18} /> 견적문의
      </button>
      <Footer />
    </div>
  );
}

function Header({ page, setPage, query, setQuery, cartCount, mobileMenu, setMobileMenu }: { page: PageName; setPage: (page: PageName) => void; query: string; setQuery: (value: string) => void; cartCount: number; mobileMenu: boolean; setMobileMenu: (value: boolean) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="border-b border-slate-100 bg-slate-50 text-[12px] text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <div className="font-semibold">고객센터 1811-6061 · 평일 09:00~18:00 · leejeou@dym.co.kr</div>
          <div className="hidden md:block">스마트 키친 허브 · 주방TV · 도어락 · 욕실폰 · 무선 AP</div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <button onClick={() => setPage("home")} className="flex items-center gap-3">
          <img src="/brand/dym-mall-logo.png" alt="동영몰 로고" className="h-11 w-auto rounded-sm object-contain" />
          <div className="hidden text-left sm:block">
            <div className="text-lg font-black tracking-tight">DONGYOUNG MALL</div>
            <div className="text-xs text-slate-500">동영엠텍 전자기기 쇼핑몰 개발/테스트 버전</div>
          </div>
        </button>
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map(([id, label]) => (
            <button key={id} onClick={() => setPage(id)} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${page === id ? "bg-red-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{label}</button>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-44 bg-transparent text-sm outline-none" placeholder="제품명/모델명 검색" />
          </div>
          <button onClick={() => setPage("cart")} className="relative rounded-2xl border border-slate-200 p-2 hover:bg-slate-50">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">{cartCount}</span>}
          </button>
          <button onClick={() => setPage("admin")} className="rounded-2xl border border-slate-200 p-2 hover:bg-slate-50"><User size={20} /></button>
        </div>
        <button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-2xl border border-slate-200 p-2 lg:hidden">{mobileMenu ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {mobileMenu && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="제품명/모델명 검색" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {navItems.map(([id, label]) => <button key={id} onClick={() => { setPage(id); setMobileMenu(false); }} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{label}</button>)}
            <button onClick={() => { setPage("cart"); setMobileMenu(false); }} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white">장바구니 {cartCount}</button>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero({ products, gotoDetail, setPage }: { products: ProductDTO[]; gotoDetail: (product: ProductDTO) => void; setPage: (page: PageName) => void }) {
  const featured = products.filter((product) => product.isFeatured).slice(0, 5);
  const slides = (featured.length ? featured : products.slice(0, 5)).map((product, index) => ({
    product,
    bg: ["/brand/hero/mainimg07.jpg", "/brand/hero/mainimg06.jpg", "/brand/hero/mainimg03.jpg", "/brand/hero/mainimg04.jpg", "/brand/hero/mainimg01.jpg"][index % 5],
    title: [
      "주방을 더 똑똑하게 만드는 스마트 허브",
      "공간의 품격을 높이는 주방TV 솔루션",
      "안전과 편의를 동시에 갖춘 도어락",
      "욕실 공간에도 어울리는 맞춤형 전자기기",
      "공동주택·오피스텔 납품 상담까지 한 번에"
    ][index % 5],
    copy: [
      "스마트 키친 허브, 생활정보, 홈 제어를 한 화면에 담았습니다.",
      "주방 공간과 자연스럽게 어우러지는 디스플레이 라인업을 제안합니다.",
      "대표 모델 안내와 상세 정보 이미지를 함께 제공합니다.",
      "욕실폰, 욕실TV, 매입형 제품까지 카탈로그 중심으로 정리했습니다.",
      "B2B 납품, 견적 문의, 관리자 상품 편집까지 연결됩니다."
    ][index % 5],
    icon: [Tv2, Tv2, LockKeyhole, Smartphone, Wifi][index % 5]
  }));
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    if (!slides.length) return;
    const timer = window.setInterval(() => setHeroIndex((current) => (current + 1) % slides.length), 4500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const current = slides[heroIndex];
  if (!current) {
    return <section className="bg-slate-950 py-20 text-white"><div className="mx-auto max-w-7xl px-4"><EmptyState title="상품 DB가 비어 있습니다." desc="환경변수와 Prisma DB 연결을 확인하세요." /></div></section>;
  }

  const Icon = current.icon;
  return (
    <section className="relative overflow-hidden bg-slate-900">
      <Image src={current.bg} alt="" fill priority sizes="100vw" className="object-cover opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-slate-950/30 to-slate-900/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(255,255,255,0.18),transparent_34%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur-[2px]">
          <div className="grid min-h-[520px] gap-8 px-6 py-8 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-12">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                <Icon size={16} /> 대표 제품 추천
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">{current.title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">{current.copy}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button onClick={() => gotoDetail(current.product)} className="rounded-2xl bg-red-600 px-6 py-4 text-base font-black text-white hover:bg-red-500">대표 제품 보기</button>
                <button onClick={() => { gotoDetail(current.product); setPage("detail"); }} className="rounded-2xl bg-white px-6 py-4 text-base font-black text-slate-950 hover:bg-slate-100">구매 페이지로 이동</button>
                <button onClick={() => setPage("quote")} className="rounded-2xl border border-white/40 px-6 py-4 text-base font-bold text-white hover:bg-white/10">견적 문의</button>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <div className="rounded-2xl bg-white/10 px-4 py-3 font-bold text-white backdrop-blur">{current.product.name}</div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 font-bold text-white backdrop-blur">{current.product.category}</div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 font-bold text-white backdrop-blur">{current.product.deliveryText || "설치 상담 가능"}</div>
              </div>
            </motion.div>
            <motion.div key={current.product.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} className="justify-self-end">
              <div className="rounded-[1.8rem] bg-white/95 p-4 shadow-2xl shadow-black/20">
                <ProductPhoto src={mainImage(current.product)} alt={current.product.name} className="h-[320px] w-full md:h-[360px] md:w-[420px]" variant="detail" large priority />
                <div className="mt-4 grid gap-2 rounded-[1.4rem] bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase text-red-500">Featured Product</div>
                      <div className="text-xl font-black text-slate-950">{current.product.name}</div>
                    </div>
                    <button onClick={() => gotoDetail(current.product)} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">상세보기</button>
                  </div>
                  <div className="text-sm text-slate-600">{current.product.description}</div>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-white/15 bg-white/10 px-6 py-4 backdrop-blur">
            <div className="flex gap-2">
              {slides.map((slide, index) => (
                <button key={slide.product.id} onClick={() => setHeroIndex(index)} className={`h-2.5 rounded-full transition ${heroIndex === index ? "w-8 bg-white" : "w-2.5 bg-white/40"}`} aria-label={`${slide.product.name} 선택`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHeroIndex((heroIndex - 1 + slides.length) % slides.length)} className="rounded-full border border-white/25 bg-white/10 p-2 text-white"><ChevronLeft size={18} /></button>
              <button onClick={() => setHeroIndex((heroIndex + 1) % slides.length)} className="rounded-full border border-white/25 bg-white/10 p-2 text-white"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductPreviewShowcase({ sections, selectedFilter, setSelectedFilter, gotoDetail, addCart, addCompare }: { sections: ProductSectionDTO[]; selectedFilter: string; setSelectedFilter: (value: string) => void; gotoDetail: (product: ProductDTO) => void; addCart: (product: ProductDTO) => void; addCompare: (product: ProductDTO) => void }) {
  const totalCount = sections.reduce((sum, section) => sum + section.items.length, 0);
  const visible = selectedFilter === "전체" ? sections : sections.filter((section) => section.title === selectedFilter);
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700"><Boxes size={14} /> 판매 제품 프리뷰</div><h2 className="text-2xl font-black md:text-3xl">카테고리별 제품 진열</h2><p className="mt-2 max-w-3xl text-slate-500">업로드한 실제 제품 모델 이미지 기준으로 카테고리를 재정리했습니다. 필터는 가로형으로 유지하고, 각 카테고리 섹션에서 제품을 빠르게 탐색할 수 있습니다.</p></div>
        <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">총 {totalCount}개 DB 상품 슬롯</div>
      </div>
      <div className="sticky top-[69px] z-30 mb-6 rounded-[1.5rem] border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["전체", ...sections.map((section) => section.title)].map((label) => {
            const count = label === "전체" ? totalCount : sections.find((section) => section.title === label)?.items.length || 0;
            return <button key={label} onClick={() => setSelectedFilter(label)} className={`whitespace-nowrap rounded-2xl border px-4 py-2 text-sm font-black transition ${selectedFilter === label ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-red-400 hover:bg-red-50 hover:text-cyan-800"}`}>{label} <span className="ml-1 text-xs opacity-75">({count})</span></button>;
          })}
        </div>
      </div>
      <div className="grid gap-8">
        {visible.map((section) => <ProductSection key={section.slug} section={section} setSelectedFilter={setSelectedFilter} gotoDetail={gotoDetail} addCart={addCart} addCompare={addCompare} />)}
      </div>
    </section>
  );
}

function ProductSection({ section, setSelectedFilter, gotoDetail, addCart, addCompare }: { section: ProductSectionDTO; setSelectedFilter: (value: string) => void; gotoDetail: (product: ProductDTO) => void; addCart: (product: ProductDTO) => void; addCompare: (product: ProductDTO) => void }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-end">
        <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-black md:text-2xl">{section.title}</h3><span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">{section.count}개</span>{section.count === 15 && <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">3 × 5</span>}</div><p className="mt-2 text-sm text-slate-500">{section.description} · 관리자에서 사진/설명/spec/금액 수정 가능</p></div>
        <button onClick={() => setSelectedFilter(section.title)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black hover:bg-slate-50">이 제품군만 보기</button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((product, index) => <ProductSquare key={product.id} product={product} index={index} count={section.items.length} gotoDetail={gotoDetail} addCart={addCart} addCompare={addCompare} />)}
      </div>
    </div>
  );
}

function ProductSquare({ product, index, count, gotoDetail, addCart, addCompare }: { product: ProductDTO; index: number; count: number; gotoDetail: (product: ProductDTO) => void; addCart: (product: ProductDTO) => void; addCompare: (product: ProductDTO) => void }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <button onClick={() => gotoDetail(product)} className="block w-full text-left">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          <ProductPhoto src={mainImage(product)} alt={product.name} className="h-full w-full rounded-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/78 via-slate-950/12 to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-red-600 px-2 py-1 text-[10px] font-black text-slate-950">{product.category}</span><span className="rounded-full bg-white/95 px-2 py-1 text-[10px] font-black text-slate-900">{String(index + 1).padStart(2, "0")}/{count}</span></div>
          {discountRate(product) > 0 && <div className="absolute right-3 top-3 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-black text-white">{discountRate(product)}%</div>}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white"><div className="text-[11px] font-bold text-cyan-200">{product.sku}</div><div className="mt-1 line-clamp-2 text-base font-black leading-5">{product.name}</div><div className="mt-2 flex items-end justify-between gap-2"><div>{product.originalPrice && <div className="text-xs text-slate-200 line-through">{fmt(product.originalPrice)}</div>}<div className="text-lg font-black">{fmt(product.price)}</div></div><div className="rounded-xl bg-white/15 px-2 py-1 text-[10px] font-black backdrop-blur">DB 상품</div></div></div>
        </div>
      </button>
      <div className="grid grid-cols-3 gap-2 bg-white p-3"><button onClick={() => addCart(product)} className="col-span-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">장바구니</button><button onClick={() => addCompare(product)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black">비교</button></div>
    </div>
  );
}

function ProductsPage({ products, categories, category, setCategory, gotoDetail, addCart, addCompare }: { products: ProductDTO[]; categories: string[]; category: string; setCategory: (value: string) => void; gotoDetail: (product: ProductDTO) => void; addCart: (product: ProductDTO) => void; addCompare: (product: ProductDTO) => void }) {
  return <section className="mx-auto max-w-7xl px-4 py-10"><PageTitle title="상품 목록" desc="DB에서 불러온 상품입니다. 관리자 편집 후 다시 불러오면 변경 사항이 반영됩니다." /><div className="mt-6 flex gap-3 overflow-x-auto pb-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-2xl border px-4 py-2 text-sm font-bold ${category === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]"><aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24"><div className="flex items-center gap-2 font-black"><SlidersHorizontal size={18} /> 필터</div><Filter label="가격대" values={["10만원 이하", "10~30만원", "30만원 이상", "100만원 이상"]} /><Filter label="상품 상태" values={["재고 있음", "무료배송", "설치상담", "납품상담"]} /></aside><div><div className="mb-4 flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4"><span className="text-sm font-bold text-slate-600">총 {products.length}개 제품</span><select className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"><option>인기순</option><option>최신순</option><option>가격 낮은순</option></select></div><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} gotoDetail={gotoDetail} addCart={addCart} addCompare={addCompare} />)}</div></div></div></section>;
}

function ProductCard({ product, gotoDetail, addCart, addCompare }: { product: ProductDTO; gotoDetail: (product: ProductDTO) => void; addCart: (product: ProductDTO) => void; addCompare: (product: ProductDTO) => void }) {
  return <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><button onClick={() => gotoDetail(product)} className="w-full text-left"><div className="relative"><ProductPhoto src={mainImage(product)} alt={product.name} className="h-52 w-full" />{product.badge && <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2 py-1 text-xs font-black text-slate-950">{product.badge}</span>}{discountRate(product) > 0 && <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-2 py-1 text-xs font-black text-white">{discountRate(product)}%</span>}</div><div className="mt-4 flex items-center gap-2 text-xs text-slate-400"><span>{product.sku}</span><span>·</span><span className="font-bold text-amber-500">★ {product.rating}</span><span>({product.reviewCount})</span></div><div className="mt-2 text-lg font-black">{product.name}</div><p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{product.description}</p><div className="mt-3 flex flex-wrap gap-1.5">{product.specs.slice(0, 3).map((spec) => <span key={`${product.id}-${spec.key}`} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{spec.value}</span>)}</div><div className="mt-4 flex items-end justify-between gap-2"><div>{product.originalPrice && <div className="text-xs text-slate-400 line-through">{fmt(product.originalPrice)}</div>}<div className="text-xl font-black">{fmt(product.price)}</div></div><div className="text-right text-xs font-bold text-emerald-600">{product.stockStatus}<br/><span className="text-slate-400">{product.deliveryText}</span></div></div></button><div className="mt-4 grid grid-cols-3 gap-2"><button onClick={() => addCart(product)} className="col-span-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white">장바구니</button><button onClick={() => addCompare(product)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold">비교</button></div></div>;
}

function DetailPage({ product, galleryIndex, setGalleryIndex, setPage, addCart, addCompare }: { product: ProductDTO; galleryIndex: number; setGalleryIndex: (index: number) => void; setPage: (page: PageName) => void; addCart: (product: ProductDTO) => void; addCompare: (product: ProductDTO) => void }) {
  const galleryImages = product.images.filter((item) => item.type !== "INFO");
  const infoImages = product.images.filter((item) => item.type === "INFO");
  const activeImages = galleryImages.length ? galleryImages : product.images;
  const image = activeImages[galleryIndex]?.url || mainImage(product);
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <button onClick={() => setPage("products")} className="mb-5 text-sm font-bold text-slate-500 hover:text-slate-900">← 상품 목록으로</button>
      <div className="grid gap-8 lg:grid-cols-[1fr_430px]">
        <div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <ProductPhoto src={image} alt={product.name} className="h-[460px] w-full" variant="detail" large priority />
            <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-5">
              {activeImages.map((item, index) => (
                <button key={item.id || item.url} onClick={() => setGalleryIndex(index)} className={`overflow-hidden rounded-2xl border-2 ${galleryIndex === index ? "border-red-500" : "border-transparent"}`}>
                  <ProductPhoto src={item.url} alt={item.alt || product.name} className="h-24 w-full" />
                </button>
              ))}
              <div className="flex h-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-red-300 bg-red-50 text-xs font-black text-red-700"><Upload size={22} /> 관리자 교체</div>
            </div>
          </div>
          <SpecTable product={product} infoImages={infoImages} />
        </div>
        <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/80 lg:sticky lg:top-24">
          <div className="flex flex-wrap items-center gap-2">
            {product.badge && <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">{product.badge}</span>}
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{product.stockStatus}</span>
          </div>
          <div className="mt-4 text-xs font-bold text-slate-400">상품코드 {product.sku}</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{product.name}</h1>
          <p className="mt-3 text-slate-500">{product.description}</p>
          <div className="mt-4 flex items-center gap-2 text-sm"><span className="font-black text-amber-500">★ {product.rating}</span><span className="text-slate-400">리뷰 {product.reviewCount}개</span></div>
          <div className="mt-5 flex items-end gap-3"><div className="text-3xl font-black">{fmt(product.price)}</div>{discountRate(product) > 0 && <div className="mb-1 text-sm font-bold text-rose-500">{discountRate(product)}% 할인</div>}</div>
          {product.originalPrice && <div className="mt-1 text-sm text-slate-400 line-through">정가 {fmt(product.originalPrice)}</div>}
          <div className="mt-5 grid gap-3">
            <InfoLine icon={Truck} label="배송" value={product.deliveryText || "배송 상담"} />
            <InfoLine icon={Wrench} label="설치" value="설치 옵션 선택 / 현장 실측 가능" />
            <InfoLine icon={Headphones} label="상담" value="B2B 납품·A/S 상담 가능" />
          </div>
          <div className="mt-6 grid gap-3">
            <button onClick={() => addCart(product)} className="rounded-2xl bg-slate-950 px-5 py-4 text-base font-black text-white">장바구니 담기</button>
            <button className="rounded-2xl bg-red-600 px-5 py-4 text-base font-black text-white"><CreditCard className="mr-2 inline" size={18} /> 바로 구매</button>
            <button onClick={() => setPage("quote")} className="rounded-2xl border border-slate-200 px-5 py-4 text-base font-black">견적 문의</button>
            <button onClick={() => addCompare(product)} className="rounded-2xl px-5 py-4 font-bold hover:bg-slate-50">제품 비교 추가</button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function SpecTable({ product, infoImages }: { product: ProductDTO; infoImages: ProductDTO["images"] }) {
  return (
    <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black">제품 상세 정보</h2>
      <p className="mt-2 text-slate-500">업로드한 제품 스펙 및 상세 안내 이미지를 기준으로 구성했습니다.</p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <tbody>
            {product.specs.map((spec) => (
              <tr key={spec.id || spec.key} className="border-b border-slate-100 last:border-0">
                <th className="w-40 bg-slate-50 px-4 py-3 text-left font-black text-slate-700">{spec.key}</th>
                <td className="px-4 py-3 text-slate-600">{spec.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {["카탈로그 PDF", "제품 매뉴얼 PDF", "인증서 PDF"].map((item) => (
          <button key={item} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold">
            <FileText size={18} /> {item}
          </button>
        ))}
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-black">상세 설명 이미지</h3>
        <p className="mt-2 text-sm text-slate-500">INFO 이미지는 글자 식별이 중요하므로 썸네일이 아니라 원본 비율 그대로 표시합니다.</p>
        {infoImages.length ? (
          <div className="mt-4 grid gap-6">
            {infoImages.map((image) => {
              const src = infoReadableSrc(image.url);
              return (
                <figure key={image.id || image.url} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-sm">
                  <img
                    src={src}
                    alt={image.alt || `${product.name} 상세`}
                    loading="lazy"
                    decoding="async"
                    className="block h-auto w-full rounded-[1.2rem] object-contain"
                  />
                </figure>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm font-bold text-slate-500">[이미지 파일 필요]</div>
        )}
      </div>
    </div>
  );
}

function ComparePage({ compare, setPage }: { compare: ProductDTO[]; setPage: (page: PageName) => void }) {
  const rows = ["가격", "카테고리", "재고", "배송", "주요 스펙", "주요 기능"];
  return <section className="mx-auto max-w-7xl px-4 py-10"><PageTitle title="제품 비교" desc="비교 목록에 담은 제품을 이미지와 스펙 중심으로 비교합니다." /><div className="mt-6 overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-sm"><table className="min-w-[860px] w-full text-sm"><thead><tr><th className="bg-slate-50 p-4 text-left font-black">비교 항목</th>{compare.map((product) => <th key={product.id} className="p-4 text-left font-black"><ProductPhoto src={mainImage(product)} alt={product.name} className="mb-3 h-28 w-40" />{product.name}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row} className="border-t border-slate-100"><th className="bg-slate-50 p-4 text-left font-black">{row}</th>{compare.map((product) => <td key={`${product.id}-${row}`} className="p-4 text-slate-600">{row === "가격" ? fmt(product.price) : row === "카테고리" ? product.category : row === "재고" ? product.stockStatus : row === "배송" ? product.deliveryText : row === "주요 스펙" ? product.specs.slice(0, 3).map((spec) => spec.value).join(" / ") : product.description}</td>)}</tr>)}</tbody></table></div><button onClick={() => setPage("products")} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white">비교 제품 추가하기</button></section>;
}

function CartPage({ cart, setCart, total, setPage, setToast }: { cart: CartItem[]; setCart: React.Dispatch<React.SetStateAction<CartItem[]>>; total: number; setPage: (page: PageName) => void; setToast: (toast: Toast) => void }) {
  const [customerName, setCustomerName] = useState("테스트 고객");
  const [phone, setPhone] = useState("010-0000-0000");
  const [address, setAddress] = useState("서울시 테스트 주소");
  const [submitting, setSubmitting] = useState(false);
  const changeQty = (id: string, delta: number) => setCart((prev) => prev.map((item) => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  async function submitOrder() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerName, phone, address, paymentMethod: "MOCK", items: cart.map((item) => ({ productId: item.id, sku: item.sku, name: item.name, price: item.price, quantity: item.qty, imageUrl: mainImage(item) })) }) });
      if (!response.ok) throw new Error("주문 저장 실패");
      setToast({ kind: "ok", message: "주문이 DB에 저장되었습니다." });
      setCart([]);
    } catch (error) { console.error(error); setToast({ kind: "error", message: "주문 저장 실패: DB 연결을 확인하세요." }); } finally { setSubmitting(false); }
  }
  return <section className="mx-auto max-w-7xl px-4 py-10"><PageTitle title="장바구니 / 주문 테스트" desc="장바구니 상품을 Mock 주문으로 PostgreSQL에 저장하는 흐름입니다." />{cart.length === 0 ? <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center"><ShoppingCart className="mx-auto text-slate-300" size={56} /><div className="mt-4 text-xl font-black">장바구니가 비어 있습니다.</div><button onClick={() => setPage("products")} className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white">제품 보러가기</button></div> : <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]"><div className="grid gap-3">{cart.map((item) => <div key={item.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center"><ProductPhoto src={mainImage(item)} alt={item.name} className="h-28 w-32 shrink-0" /><div className="flex-1"><div className="font-black">{item.name}</div><div className="mt-1 text-sm text-slate-500">{item.deliveryText}</div><div className="mt-1 text-xs text-slate-400">{item.sku}</div></div><div className="flex items-center gap-2"><button onClick={() => changeQty(item.id, -1)} className="rounded-xl border p-2"><Minus size={14} /></button><b>{item.qty}</b><button onClick={() => changeQty(item.id, 1)} className="rounded-xl border p-2"><Plus size={14} /></button></div><div className="font-black">{fmt(item.price * item.qty)}</div></div>)}</div><aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-xl font-black">주문 저장 테스트</h3><div className="mt-5 grid gap-3"><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="rounded-2xl border px-4 py-3" placeholder="주문자" /><input value={phone} onChange={(event) => setPhone(event.target.value)} className="rounded-2xl border px-4 py-3" placeholder="연락처" /><input value={address} onChange={(event) => setAddress(event.target.value)} className="rounded-2xl border px-4 py-3" placeholder="주소" /></div><div className="mt-5 grid gap-3 text-sm"><Row k="상품 금액" v={fmt(total)} /><Row k="예상 배송비" v={total > 300000 ? "무료" : "3,000원"} /></div><div className="mt-5 border-t pt-5 text-right text-2xl font-black">{fmt(total + (total > 300000 ? 0 : 3000))}</div><button disabled={submitting} onClick={submitOrder} className="mt-5 w-full rounded-2xl bg-red-600 px-5 py-4 font-black text-slate-950 disabled:opacity-60">{submitting ? "저장 중..." : "Mock 주문 저장"}</button><button onClick={() => setPage("quote")} className="mt-2 w-full rounded-2xl border px-5 py-4 font-black">견적서 요청</button></aside></div>}</section>;
}

function QuotePage({ products, setToast }: { products: ProductDTO[]; setToast: (toast: Toast) => void }) {
  const [form, setForm] = useState({ companyName: "", managerName: "", phone: "", email: "", installPlace: "", desiredProduct: products[0]?.name || "", quantity: 1, supplyType: "개인 구매", message: "", privacyAgreed: false });
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setSubmitting(true);
    try {
      const response = await fetch("/api/quote-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error("견적문의 저장 실패");
      setToast({ kind: "ok", message: "견적문의가 DB에 저장되었습니다." });
      setForm((prev) => ({ ...prev, managerName: "", phone: "", email: "", message: "", privacyAgreed: false }));
    } catch (error) { console.error(error); setToast({ kind: "error", message: "견적문의 저장 실패: 입력값/DB 연결 확인" }); } finally { setSubmitting(false); }
  }
  return <section className="mx-auto max-w-4xl px-4 py-10"><PageTitle title="견적 문의" desc="개인 구매부터 아파트 단지, 건설사, 인테리어 업체, 대리점 납품까지 상담 요청을 DB에 저장합니다." /><form onSubmit={submit} className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-6 grid gap-3 md:grid-cols-3">{products.slice(0, 3).map((product) => <div key={product.id} className="rounded-2xl border border-slate-200 p-3"><ProductPhoto src={mainImage(product)} alt={product.name} className="h-24 w-full" /><div className="mt-2 text-sm font-black">{product.name}</div></div>)}</div><div className="grid gap-4 md:grid-cols-2"><Input label="회사명" value={form.companyName} onChange={(value) => setForm({ ...form, companyName: value })} /><Input required label="담당자명" value={form.managerName} onChange={(value) => setForm({ ...form, managerName: value })} /><Input required label="연락처" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><Input label="이메일" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><Input label="설치 장소" value={form.installPlace} onChange={(value) => setForm({ ...form, installPlace: value })} /><label className="grid gap-1 text-sm font-bold text-slate-700">희망 제품<select value={form.desiredProduct} onChange={(event) => setForm({ ...form, desiredProduct: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">{products.map((product) => <option key={product.id}>{product.name}</option>)}</select></label><label className="grid gap-1 text-sm font-bold text-slate-700">수량<input type="number" min={1} value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" /></label><label className="grid gap-1 text-sm font-bold text-slate-700">납품 형태<select value={form.supplyType} onChange={(event) => setForm({ ...form, supplyType: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"><option>개인 구매</option><option>아파트 단지</option><option>오피스텔</option><option>건설사</option><option>인테리어 업체</option><option>대리점</option></select></label></div><label className="mt-4 grid gap-1 text-sm font-bold text-slate-700">문의 내용<textarea required value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400" placeholder="설치 환경, 수량, 희망 일정 등을 입력하세요." /></label><label className="mt-4 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.privacyAgreed} onChange={(event) => setForm({ ...form, privacyAgreed: event.target.checked })} /> 개인정보 수집 및 이용에 동의합니다.</label><button disabled={submitting} className="mt-5 rounded-2xl bg-slate-950 px-8 py-4 font-black text-white disabled:opacity-60">{submitting ? "저장 중..." : "문의 제출"}</button></form></section>;
}

function AdminPage({ admin, setAdmin, adminView, setAdminView, products, sections, reloadProducts, setToast }: { admin: AdminUser | null; setAdmin: (admin: AdminUser | null) => void; adminView: AdminView; setAdminView: (view: AdminView) => void; products: ProductDTO[]; sections: ProductSectionDTO[]; reloadProducts: () => Promise<void>; setToast: (toast: Toast) => void }) {
  if (!admin) return <AdminLogin setAdmin={setAdmin} setToast={setToast} />;
  const menu: Array<[AdminView, React.ElementType, string]> = [["dashboard", LayoutDashboard, "대시보드"], ["products", Boxes, "상품 관리"], ["orders", ClipboardList, "주문 관리"], ["quotes", MessageSquareText, "견적 문의"], ["support", FileText, "고객지원"]];
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAdmin(null); }
  return <section className="mx-auto max-w-7xl px-4 py-10"><PageTitle title="관리자 페이지" desc="상품명, 설명, spec, 금액, 이미지 업로드를 실제 API/DB로 저장하는 관리자 테스트 화면입니다." /><div className="mt-6 grid gap-6 lg:grid-cols-[250px_1fr]"><aside className="rounded-[2rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-sm"><div className="px-3 py-2 text-sm font-black text-cyan-300">ADMIN · {admin.email}</div><div className="mt-3 grid gap-1">{menu.map(([id, Icon, label]) => <button key={id} onClick={() => setAdminView(id)} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold ${adminView === id ? "bg-red-600 text-slate-950" : "text-slate-300 hover:bg-white/10"}`}><Icon size={18} /> {label}</button>)}<button onClick={logout} className="mt-4 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-300 hover:bg-white/10"><LogOut size={18} /> 로그아웃</button></div></aside><div className="grid gap-5"><div className="grid gap-4 md:grid-cols-4"><AdminStat title="DB 상품" value={`${products.length}개`} /><AdminStat title="제품군" value={`${sections.length}개`} /><AdminStat title="견적/주문" value="API 저장" /><AdminStat title="이미지" value="Blob/Local" /></div>{adminView === "products" ? <AdminProductManager products={products} sections={sections} reloadProducts={reloadProducts} setToast={setToast} /> : <AdminPlaceholder title={menu.find((item) => item[0] === adminView)?.[2] || "관리"} />}</div></div></section>;
}

function AdminLogin({ setAdmin, setToast }: { setAdmin: (admin: AdminUser | null) => void; setToast: (toast: Toast) => void }) {
  const [email, setEmail] = useState("admin@dym.test"); const [password, setPassword] = useState("admin1234"); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); try { const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); if (!response.ok) throw new Error("로그인 실패"); const data = (await response.json()) as { admin: AdminUser }; setAdmin(data.admin); setToast({ kind: "ok", message: "관리자 로그인 완료" }); } catch (error) { console.error(error); setToast({ kind: "error", message: "관리자 로그인 실패" }); } finally { setLoading(false); } }
  return <section className="mx-auto max-w-md px-4 py-16"><div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm"><h1 className="text-3xl font-black">관리자 로그인</h1><p className="mt-2 text-sm text-slate-500">seed 기본 계정은 .env의 ADMIN_EMAIL / ADMIN_PASSWORD 값입니다.</p><form onSubmit={submit} className="mt-6 grid gap-3"><Input label="이메일" value={email} onChange={setEmail} required /><Input label="비밀번호" value={password} onChange={setPassword} required type="password" /><button disabled={loading} className="mt-2 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white disabled:opacity-60">{loading ? "로그인 중..." : "로그인"}</button></form></div></section>;
}

function AdminProductManager({ products, sections, reloadProducts, setToast }: { products: ProductDTO[]; sections: ProductSectionDTO[]; reloadProducts: () => Promise<void>; setToast: (toast: Toast) => void }) {
  const [selectedId, setSelectedId] = useState<string>(products[0]?.id || "");
  const [resetting, setResetting] = useState(false);
  const selected = products.find((product) => product.id === selectedId) || products[0];

  useEffect(() => { if (!selectedId && products[0]) setSelectedId(products[0].id); }, [products, selectedId]);

  async function resetCatalog() {
    if (!confirm("신규 카탈로그 21개 모델과 제품별 매칭 이미지를 다시 구성합니다. 기존 상품 수정 내용과 이미지 배치는 초기값으로 돌아갑니다. 개발 테스트 DB에서만 사용하세요.")) return;
    setResetting(true);
    try {
      const response = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "resetCatalog" })
      });
      if (!response.ok) throw new Error("기본 상품/이미지 구성 실패");
      await reloadProducts();
      setSelectedId("");
      setToast({ kind: "ok", message: "신규 카탈로그 21개 모델과 제품별 이미지 매칭이 다시 생성되었습니다." });
    } catch (error) {
      console.error(error);
      setToast({ kind: "error", message: "기본 상품/이미지 구성 실패: DB 연결과 관리자 로그인을 확인하세요." });
    } finally {
      setResetting(false);
    }
  }

  if (!selected) {
    return <div className="grid gap-4"><EmptyState title="상품이 없습니다." desc="기본 상품/이미지 구성을 먼저 생성하세요." /><button onClick={resetCatalog} disabled={resetting} className="rounded-2xl bg-red-600 px-5 py-4 font-black text-slate-950 disabled:opacity-60">{resetting ? "구성 중..." : "신규 카탈로그 21개 모델/이미지 구성"}</button></div>;
  }

  return <div className="grid gap-5 lg:grid-cols-[360px_1fr]"><div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 grid gap-3"><div className="flex items-center justify-between"><h3 className="text-xl font-black">상품 목록</h3><button onClick={() => void reloadProducts()} className="rounded-xl border px-3 py-2 text-sm font-black"><RefreshCw size={15} className="inline" /> 새로고침</button></div><button onClick={resetCatalog} disabled={resetting} className="rounded-2xl border border-cyan-300 bg-red-50 px-4 py-3 text-sm font-black text-cyan-800 disabled:opacity-60">{resetting ? "기본 구성 적용 중..." : "신규 카탈로그 21개 모델/이미지 재구성"}</button><p className="text-xs leading-5 text-slate-500">첨부한 DYM-Product Image 기준으로 스마트 키친 허브 4개, 주방 TV 7개, 도어락 4개, 욕실TV 1개, 욕실폰 2개, 무선 AP 1개, 주방 라디오 1개, 생활 정보기 1개 모델을 다시 배치합니다.</p></div><div className="grid max-h-[680px] gap-2 overflow-y-auto pr-1">{products.map((product) => <button key={product.id} onClick={() => setSelectedId(product.id)} className={`flex gap-3 rounded-2xl border p-3 text-left transition ${selected.id === product.id ? "border-red-400 bg-red-50" : "border-slate-200 hover:bg-slate-50"}`}><ProductPhoto src={mainImage(product)} alt={product.name} className="h-16 w-16 shrink-0" /><div className="min-w-0"><div className="truncate text-sm font-black">{product.name}</div><div className="mt-1 text-xs text-slate-500">{product.category} · {fmt(product.price)}</div><div className="mt-1 text-xs text-slate-400">{product.sku}</div></div></button>)}</div></div><ProductEditor key={selected.id} product={selected} sections={sections} reloadProducts={reloadProducts} setToast={setToast} /></div>;
}

function ProductEditor({ product, sections, reloadProducts, setToast }: { product: ProductDTO; sections: ProductSectionDTO[]; reloadProducts: () => Promise<void>; setToast: (toast: Toast) => void }) {
  const [form, setForm] = useState({ name: product.name, sku: product.sku, categorySlug: product.categorySlug, description: product.description, price: product.price, originalPrice: product.originalPrice || 0, stockStatus: product.stockStatus, deliveryText: product.deliveryText || "", badge: product.badge || "", isVisible: product.isVisible, isFeatured: product.isFeatured, specsText: product.specs.map((spec) => `${spec.key}=${spec.value}`).join("\n") });
  const [file, setFile] = useState<File | null>(null); const [imageType, setImageType] = useState("DETAIL"); const [isMain, setIsMain] = useState(false); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState(false);
  function parseSpecs(): ProductSpecDTO[] { return form.specsText.split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => { const [key, ...rest] = line.split("="); return { key: key.trim(), value: rest.join("=").trim() || "-", group: "관리자 입력", sortOrder: index }; }); }
  async function save() { setSaving(true); try { const response = await fetch(`/api/admin/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, sku: form.sku, categorySlug: form.categorySlug, description: form.description, price: Number(form.price), originalPrice: Number(form.originalPrice) || null, stockStatus: form.stockStatus, deliveryText: form.deliveryText, badge: form.badge, isVisible: form.isVisible, isFeatured: form.isFeatured, specs: parseSpecs() }) }); if (!response.ok) throw new Error("상품 저장 실패"); await reloadProducts(); setToast({ kind: "ok", message: "상품 정보가 DB에 저장되었습니다." }); } catch (error) { console.error(error); setToast({ kind: "error", message: "상품 저장 실패" }); } finally { setSaving(false); } }
  async function upload() {
    if (!file) {
      setToast({ kind: "error", message: "업로드할 이미지를 선택하세요." });
      return;
    }

    setUploading(true);
    try {
      const preparedFile = await prepareImageForUpload(file);
      const alt = `${product.name} ${imageType}`;
      const pathname = `products/admin/${product.sku}-${Date.now()}-${safeUploadName(preparedFile.name)}`;

      const blob = await uploadBlob(pathname, preparedFile, {
        access: "public",
        handleUploadUrl: "/api/admin/blob-upload",
        clientPayload: JSON.stringify({ productId: product.id, type: imageType, isMain, alt })
      });

      const response = await fetch(`/api/admin/products/${product.id}/images/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url, pathname: blob.pathname, type: imageType, isMain, alt })
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      await reloadProducts();
      setFile(null);
      setToast({ kind: "ok", message: "이미지가 Vercel Blob에 직접 업로드되고 DB에 반영되었습니다." });
    } catch (error) {
      console.error(error);
      setToast({ kind: "error", message: error instanceof Error ? error.message : "이미지 업로드 실패" });
    } finally {
      setUploading(false);
    }
  }
  return <div className="grid gap-5"><div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-xl font-black">상품 정보 편집</h3><p className="mt-1 text-sm text-slate-500">저장 시 Prisma API를 통해 PostgreSQL에 반영됩니다.</p></div><button onClick={save} disabled={saving} className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white disabled:opacity-60"><Save className="mr-2 inline" size={17} />{saving ? "저장 중" : "저장"}</button></div><div className="grid gap-4 md:grid-cols-2"><Input label="상품명" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><Input label="상품코드" value={form.sku} onChange={(value) => setForm({ ...form, sku: value })} /><label className="grid gap-1 text-sm font-bold text-slate-700">카테고리<select value={form.categorySlug} onChange={(event) => setForm({ ...form, categorySlug: event.target.value })} className="rounded-2xl border px-4 py-3">{sections.map((section) => <option key={section.slug} value={section.slug}>{section.title}</option>)}</select></label><Input label="배지" value={form.badge} onChange={(value) => setForm({ ...form, badge: value })} /><Input label="판매가" type="number" value={String(form.price)} onChange={(value) => setForm({ ...form, price: Number(value) })} /><Input label="정가" type="number" value={String(form.originalPrice)} onChange={(value) => setForm({ ...form, originalPrice: Number(value) })} /><Input label="재고 상태" value={form.stockStatus} onChange={(value) => setForm({ ...form, stockStatus: value })} /><Input label="배송/설치 문구" value={form.deliveryText} onChange={(value) => setForm({ ...form, deliveryText: value })} /></div><label className="mt-4 grid gap-1 text-sm font-bold text-slate-700">설명<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-28 rounded-2xl border px-4 py-3" /></label><label className="mt-4 grid gap-1 text-sm font-bold text-slate-700">Spec 입력: 한 줄에 key=value<textarea value={form.specsText} onChange={(event) => setForm({ ...form, specsText: event.target.value })} className="min-h-40 rounded-2xl border px-4 py-3 font-mono text-sm" /></label><div className="mt-4 flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.isVisible} onChange={(event) => setForm({ ...form, isVisible: event.target.checked })} /> 노출</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} /> 추천</label></div></div><div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-xl font-black">이미지 업로드 / 교체</h3><p className="mt-1 text-sm text-slate-500">Vercel에서는 브라우저에서 Blob으로 직접 업로드한 뒤 ProductImage DB에 URL을 저장합니다. 토큰 발급은 고정 API /api/admin/blob-upload 경로를 사용합니다.</p><div className="mt-4 grid gap-3 md:grid-cols-3">{product.images.map((image) => <div key={image.id || image.url} className="rounded-2xl border p-3"><ProductPhoto src={image.url} alt={image.alt || product.name} className="h-36 w-full" /><div className="mt-2 text-xs font-black">{image.type} {image.isMain ? "· 대표" : ""}</div></div>)}</div><div className="mt-5 grid gap-3 md:grid-cols-[1fr_150px_120px_140px]"><input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} className="rounded-2xl border px-4 py-3" /><select value={imageType} onChange={(event) => setImageType(event.target.value)} className="rounded-2xl border px-4 py-3"><option>MAIN</option><option>DETAIL</option><option>INSTALL</option><option>SPEC</option><option>CERT</option><option>INFO</option></select><label className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold"><input type="checkbox" checked={isMain} onChange={(event) => setIsMain(event.target.checked)} /> 대표</label><button onClick={upload} disabled={uploading} className="rounded-2xl bg-red-600 px-5 py-3 font-black text-slate-950 disabled:opacity-60"><Upload className="mr-2 inline" size={17} />{uploading ? "업로드 중" : "업로드"}</button></div></div></div>;
}

function CasesPage({ compact = false }: { compact?: boolean }) { const cards = ["성남 A 아파트 · 주방TV 320세대", "판교 오피스텔 · 무선 AP 180대", "부산 B 주상복합 · 욕실TV폰 패키지"]; return <section className="mx-auto max-w-7xl px-4 py-10"><PageTitle title="시공/납품사례" desc="아파트, 오피스텔, 주택, 사무실 납품 이력을 카드와 갤러리로 관리하는 화면입니다." /><div className="mt-6 grid gap-5 md:grid-cols-3">{cards.map((item, index) => <div key={item} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"><div className="relative h-52 bg-slate-900"><ProductPhoto src={["/brand/hero/mainimg06.jpg", "/brand/hero/mainimg07.jpg", "/brand/hero/mainimg03.jpg"][index]} alt={item} className="h-full w-full rounded-none" /><div className="absolute left-4 top-4 rounded-2xl bg-slate-950/80 p-3 text-cyan-300 backdrop-blur"><PackageCheck size={24} /></div></div><div className="p-5"><div className="text-lg font-black">{item}</div><div className="mt-2 text-xs text-slate-400">시공일 2026.05</div></div></div>)}</div>{compact && <div className="mt-6 text-center text-sm text-slate-500">관리자 시공사례 DB화는 다음 안정화 단계에서 확장합니다.</div>}</section>; }

function TrustSection() { return <section className="bg-white py-12"><div className="mx-auto max-w-7xl px-4"><div className="grid gap-4 md:grid-cols-4"><Trust icon={ShieldCheck} title="DB 상품관리" text="Prisma + PostgreSQL 기반 상품 저장" /><Trust icon={Building2} title="B2B 견적문의" text="견적문의 API 저장 흐름" /><Trust icon={Truck} title="주문 저장" text="Mock 주문을 DB에 저장" /><Trust icon={Wrench} title="이미지 업로드" text="Vercel Blob / Local 어댑터" /></div></div></section>; }
function Trust({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) { return <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"><Icon className="text-red-600" size={28} /><div className="mt-4 font-black">{title}</div><div className="mt-1 text-sm text-slate-500">{text}</div></div>; }
function ProductPhoto({
  src,
  alt,
  className = "",
  large = false,
  variant = "thumb",
  priority = false
}: {
  src?: string;
  alt: string;
  className?: string;
  large?: boolean;
  variant?: ImageVariant;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const optimizedSrc = src ? toWebpPath(src, variant) : "";

  if (failed || !optimizedSrc) {
    return (
      <div className={`relative flex items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-center text-sm font-black text-cyan-300 ${className}`}>
        <div><Camera className="mx-auto mb-2" size={large ? 44 : 26} />[이미지 파일 필요]</div>
      </div>
    );
  }

  const isRemote = optimizedSrc.startsWith("http");
  const sizes = large ? "(max-width: 768px) 100vw, 720px" : "(max-width: 768px) 50vw, 280px";

  return (
    <div className={`relative overflow-hidden rounded-[1.25rem] bg-slate-100 ${className}`}>
      <Image
        src={optimizedSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={isRemote}
        onError={() => setFailed(true)}
        className="object-contain p-2 transition duration-500 hover:scale-105"
      />
    </div>
  );
}
function PageTitle({ title, desc }: { title: string; desc: string }) { return <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-slate-200"><h1 className="text-3xl font-black tracking-tight md:text-4xl">{title}</h1><p className="mt-3 max-w-3xl text-slate-500">{desc}</p></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur"><div className="text-xl font-black text-cyan-200">{value}</div><div className="mt-1 text-xs font-bold text-slate-300">{label}</div></div>; }
function Filter({ label, values }: { label: string; values: string[] }) { return <div className="mt-5 border-t border-slate-100 pt-5"><div className="text-sm font-black">{label}</div><div className="mt-3 grid gap-2">{values.map((value) => <label key={value} className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="rounded" /> {value}</label>)}</div></div>; }
function InfoLine({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm"><Icon size={18} className="text-red-600" /><span className="w-12 font-black text-slate-700">{label}</span><span className="text-slate-500">{value}</span></div>; }
function SimpleListPage({ title, desc, items }: { title: string; desc: string; items: string[] }) { return <section className="mx-auto max-w-7xl px-4 py-10"><PageTitle title={title} desc={desc} /><div className="mt-6 grid gap-4 md:grid-cols-3">{items.map((item) => <div key={item} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><CheckCircle2 className="text-red-600" /><div className="mt-4 text-lg font-black">{item}</div><p className="mt-2 text-sm text-slate-500">운영 데이터와 관리자 등록 정보로 확장되는 섹션입니다.</p></div>)}</div></section>; }
function EmptyState({ title, desc }: { title: string; desc: string }) { return <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center"><ImagePlus className="mx-auto text-slate-300" size={52} /><div className="mt-4 text-xl font-black">{title}</div><p className="mt-2 text-sm text-slate-500">{desc}</p></div>; }
function SyncNotice() {
  return (
    <div className="mx-auto mt-4 max-w-7xl px-4">
      <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 shadow-sm">
        <Loader2 className="animate-spin" size={16} /> 기본 내장 카탈로그를 먼저 표시하고, DB 상품 정보를 백그라운드로 동기화하는 중입니다.
      </div>
    </div>
  );
}

function AdminDbLoading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Loader2 className="mx-auto animate-spin text-red-600" size={42} />
        <div className="mt-4 text-xl font-black">관리자 DB 정보를 동기화하는 중입니다.</div>
        <p className="mt-2 text-sm text-slate-500">홈 화면은 내장 이미지로 즉시 표시되지만, 관리자 편집은 실제 PostgreSQL 상품 ID가 필요합니다.</p>
      </div>
    </section>
  );
}

function LoadingBlock() { return <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24 text-slate-500"><Loader2 className="mr-3 animate-spin" /> 상품 DB를 확인하는 중입니다.</div>; }
function AdminStat({ title, value }: { title: string; value: string }) { return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-bold text-slate-500">{title}</div><div className="mt-2 text-2xl font-black">{value}</div></div>; }
function AdminPlaceholder({ title }: { title: string }) { return <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"><h3 className="text-xl font-black">{title}</h3><p className="mt-2 text-slate-500">이번 버전은 상품 DB/이미지 업로드/주문/견적 저장 흐름에 집중했습니다. 이 메뉴의 상세 CRUD는 다음 안정화 단계에서 확장하면 됩니다.</p></div>; }
function Input({ label, value, onChange, required = false, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) { return <label className="grid gap-1 text-sm font-bold text-slate-700">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400" /></label>; }
function Row({ k, v }: { k: string; v: string }) { return <div className="flex justify-between"><span className="text-slate-500">{k}</span><b>{v}</b></div>; }
function ToastBox({ toast, onClose }: { toast: NonNullable<Toast>; onClose: () => void }) { const color = toast.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : toast.kind === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-red-200 bg-red-50 text-red-800"; return <div className={`fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black shadow-xl ${color}`}><span>{toast.message}</span><button onClick={onClose}><X size={16} /></button></div>; }
function Footer() { return <footer className="mt-12 border-t border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-4 py-10"><div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr]"><div className="lg:pr-8"><img src="/brand/footer-logo.png" alt="동영엠텍" className="h-10 w-auto object-contain" /><div className="mt-4 text-sm leading-7 text-slate-600">(주)동영엠텍 경기도 군포시 당정로 18 ((주)동영엠텍)<br />대표 : 당유상 · 사업자등록번호 : 112-81-40075<br />통신판매업신고번호 : 제2018-경기군포-0434호<br />대표번호 : 1811-6061 · 팩스번호 : 031-477-3407<br />메일 : leejeou@dym.co.kr<br />copyright (c) dongyoungmall.com all rights reserved.</div></div><div className="text-sm leading-7 text-slate-600"><div className="text-base font-black text-slate-950">CS CENTER</div>1811-6061<br />평일 09:00~18:00<br />토요일 휴무</div><div className="text-sm leading-7 text-slate-600"><div className="text-base font-black text-slate-950">고객센터</div>서비스규정<br />자주하는 질문<br />사용설명서<br />설치동영상<br />갤러리<br />공지사항<br />1:1 문의하기</div><div className="text-sm leading-7 text-slate-600"><div className="text-base font-black text-slate-950">은행계좌 안내</div>185-057225-04-017<br />기업은행<br />[예금주 : (주)동영엠텍]</div></div></div></footer>; }
