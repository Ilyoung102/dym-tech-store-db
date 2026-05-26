export type SeedProductImage = {
  url: string;
  type?: string;
  isMain?: boolean;
  alt?: string;
};

export type SeedProduct = {
  sku: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  price: number;
  originalPrice: number;
  stockStatus: string;
  deliveryText: string;
  badge: string;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  sortOrder: number;
  images: SeedProductImage[];
  specs: { key: string; value: string; group?: string }[];
};

export const categorySeed = [
  { slug: "smart-kitchen-hub", name: "스마트 키친 허브", description: "스마트 키친 허브 제품군" },
  { slug: "kitchen-tv", name: "주방 TV", description: "주방 TV 제품군" },
  { slug: "door-lock", name: "도어락", description: "도어락 제품군" },
  { slug: "built-in-tv", name: "매입 TV", description: "매입형 TV 제품군" },
  { slug: "bathroom-phone", name: "욕실폰", description: "욕실폰 제품군" },
  { slug: "wireless-ap", name: "무선 AP", description: "무선 AP 제품군" },
  { slug: "kitchen-radio", name: "주방 라디오", description: "주방 라디오 제품군" },
  { slug: "life-info-device", name: "생활 정보기", description: "생활 정보기 제품군" }
] as const;

const CATALOG = (name: string) => `/catalog/${name.toLowerCase()}`;
const INFO = (name: string) => `/info/${name.toLowerCase()}`;

type ProductInput = Omit<SeedProduct, "sortOrder">;

function specs(category: string, model: string): { key: string; value: string; group?: string }[] {
  const common: Record<string, { key: string; value: string; group?: string }[]> = {
    "스마트 키친 허브": [
      { key: "모델명", value: model, group: "기본" },
      { key: "제품군", value: "스마트 키친 허브", group: "기본" },
      { key: "구성", value: "생활정보 / 스마트홈 연동 / 터치 패널", group: "기능" },
      { key: "설치", value: "주방 매립 설치 상담", group: "설치" },
    ],
    "주방 TV": [
      { key: "모델명", value: model, group: "기본" },
      { key: "제품군", value: "주방 TV", group: "기본" },
      { key: "구성", value: "주방 공간용 디스플레이", group: "기능" },
      { key: "설치", value: "주방 벽부/매립 상담", group: "설치" },
    ],
    "도어락": [
      { key: "모델명", value: model, group: "기본" },
      { key: "제품군", value: "도어락", group: "기본" },
      { key: "인증", value: "비밀번호 / 카드 / 모델별 옵션", group: "보안" },
      { key: "설치", value: "현장 문 타입 확인 후 설치", group: "설치" },
    ],
    "매입 TV": [
      { key: "모델명", value: model, group: "기본" },
      { key: "제품군", value: "매입 TV", group: "기본" },
      { key: "구성", value: "매입형 디스플레이", group: "기능" },
      { key: "설치", value: "욕실/공간 매입 설치 상담", group: "설치" },
    ],
    "욕실폰": [
      { key: "모델명", value: model, group: "기본" },
      { key: "제품군", value: "욕실폰", group: "기본" },
      { key: "구성", value: "방수형 인터폰", group: "기능" },
      { key: "설치", value: "벽부 설치", group: "설치" },
    ],
    "무선 AP": [
      { key: "모델명", value: model, group: "기본" },
      { key: "제품군", value: "무선 AP", group: "기본" },
      { key: "구성", value: "무선 네트워크 액세스 포인트", group: "기능" },
      { key: "설치", value: "천장형 / 구축 상담", group: "설치" },
    ],
    "주방 라디오": [
      { key: "모델명", value: model, group: "기본" },
      { key: "제품군", value: "주방 라디오", group: "기본" },
      { key: "구성", value: "주방 생활형 라디오", group: "기능" },
    ],
    "생활 정보기": [
      { key: "모델명", value: model, group: "기본" },
      { key: "제품군", value: "생활 정보기", group: "기본" },
      { key: "구성", value: "생활 정보 / 공지 표시용 디스플레이", group: "기능" },
    ],
  };
  return common[category] ?? [{ key: "모델명", value: model }];
}

function buildImageSet(name: string, productImageFiles: string[], infoImageFiles: string[] = []): SeedProductImage[] {
  const main = productImageFiles.map((file, index) => ({
    url: CATALOG(file),
    type: index === 0 ? "MAIN" : "DETAIL",
    isMain: index === 0,
    alt: `${name} 이미지 ${index + 1}`
  }));
  const info = infoImageFiles.map((file, index) => ({
    url: INFO(file),
    type: "INFO",
    isMain: false,
    alt: `${name} 상세 설명 ${index + 1}`
  }));
  return [...main, ...info];
}

const productsInput: ProductInput[] = [
  {
    sku: "DYM-SKH-DM-N330VS",
    slug: "dm-n330vs",
    name: "DM-N330VS",
    category: "스마트 키친 허브",
    categorySlug: "smart-kitchen-hub",
    description: "DM-N330VS 스마트 키친 허브 모델입니다.",
    price: 498000,
    originalPrice: 548000,
    stockStatus: "재고 있음",
    deliveryText: "대표 모델 / 설치 상담 가능",
    badge: "대표",
    rating: 4.9,
    reviewCount: 18,
    isFeatured: true,
    images: buildImageSet("DM-N330VS", ["dm-n330vs-01.png", "dm-n330vs-02.png", "dm-n330vs_03.png"]),
    specs: specs("스마트 키친 허브", "DM-N330VS")
  },
  {
    sku: "DYM-SKH-DM-N160VS",
    slug: "dm-n160vs",
    name: "DM-N160VS",
    category: "스마트 키친 허브",
    categorySlug: "smart-kitchen-hub",
    description: "DM-N160VS 스마트 키친 허브 모델입니다.",
    price: 458000,
    originalPrice: 498000,
    stockStatus: "재고 있음",
    deliveryText: "설치 상담 가능",
    badge: "추천",
    rating: 4.8,
    reviewCount: 11,
    isFeatured: false,
    images: buildImageSet("DM-N160VS", ["dm-n160vs_01.png", "dm-n160vs_02.png", "dm-n160vs_03.png"]),
    specs: specs("스마트 키친 허브", "DM-N160VS")
  },
  {
    sku: "DYM-SKH-DM-N330",
    slug: "dm-n330",
    name: "DM-N330",
    category: "스마트 키친 허브",
    categorySlug: "smart-kitchen-hub",
    description: "DM-N330 스마트 키친 허브 모델입니다.",
    price: 478000,
    originalPrice: 528000,
    stockStatus: "재고 있음",
    deliveryText: "설치 상담 가능",
    badge: "고급형",
    rating: 4.8,
    reviewCount: 9,
    isFeatured: false,
    images: buildImageSet("DM-N330", ["dm-n330_01.png", "dm-n330_02.png", "dm-n330_03.png"]),
    specs: specs("스마트 키친 허브", "DM-N330")
  },
  {
    sku: "DYM-SKH-DM-N160",
    slug: "dm-n160",
    name: "DM-N160",
    category: "스마트 키친 허브",
    categorySlug: "smart-kitchen-hub",
    description: "DM-N160 스마트 키친 허브 모델입니다.",
    price: 418000,
    originalPrice: 458000,
    stockStatus: "재고 있음",
    deliveryText: "설치 상담 가능",
    badge: "실속형",
    rating: 4.7,
    reviewCount: 7,
    isFeatured: false,
    images: buildImageSet("DM-N160", ["dm-n160_01.png", "dm-n160_02.png", "dm-n160_03.png"]),
    specs: specs("스마트 키친 허브", "DM-N160")
  },
  {
    sku: "DYM-KTV-DM-D5130Q",
    slug: "dm-d5130q",
    name: "DM-D5130Q",
    category: "주방 TV",
    categorySlug: "kitchen-tv",
    description: "DM-D5130Q 주방 TV 모델입니다.",
    price: 329000,
    originalPrice: 359000,
    stockStatus: "재고 있음",
    deliveryText: "대표 모델 / 설치 상담",
    badge: "대표",
    rating: 4.8,
    reviewCount: 15,
    isFeatured: true,
    images: buildImageSet("DM-D5130Q", ["dm-d5130q_01.png", "dm-d5130q_02.png", "dm-d5130q_03.png"]),
    specs: specs("주방 TV", "DM-D5130Q")
  },
  {
    sku: "DYM-KTV-DM-D5110Q",
    slug: "dm-d5110q",
    name: "DM-D5110Q",
    category: "주방 TV",
    categorySlug: "kitchen-tv",
    description: "DM-D5110Q 주방 TV 모델입니다.",
    price: 298000,
    originalPrice: 328000,
    stockStatus: "재고 있음",
    deliveryText: "설치 상담 가능",
    badge: "추천",
    rating: 4.7,
    reviewCount: 13,
    isFeatured: false,
    images: buildImageSet("DM-D5110Q", ["dm-d5110q_01.png", "dm-d5110q_02.png", "dm-d5110q_03.png"]),
    specs: specs("주방 TV", "DM-D5110Q")
  },
  {
    sku: "DYM-KTV-DM-D5102Q",
    slug: "dm-d5102q",
    name: "DM-D5102Q",
    category: "주방 TV",
    categorySlug: "kitchen-tv",
    description: "DM-D5102Q 주방 TV 모델입니다.",
    price: 288000,
    originalPrice: 318000,
    stockStatus: "재고 있음",
    deliveryText: "설치 상담 가능",
    badge: "표준형",
    rating: 4.7,
    reviewCount: 14,
    isFeatured: false,
    images: buildImageSet("DM-D5102Q", ["dm-d5102q_01.png", "dm-d5102q_02.png", "dm-d5102q_03.png"], ["dm-d5102q_info01.jpg", "dm-d5102q_info02.jpg", "dm-d5102q_info03.jpg"]),
    specs: specs("주방 TV", "DM-D5102Q")
  },
  {
    sku: "DYM-KTV-DM-D5102QM",
    slug: "dm-d5102qm",
    name: "DM-D5102QM",
    category: "주방 TV",
    categorySlug: "kitchen-tv",
    description: "DM-D5102QM 주방 TV 모델입니다.",
    price: 309000,
    originalPrice: 339000,
    stockStatus: "재고 있음",
    deliveryText: "설치 상담 가능",
    badge: "옵션형",
    rating: 4.6,
    reviewCount: 8,
    isFeatured: false,
    images: buildImageSet("DM-D5102QM", ["dm-d5102qm_01.png", "dm-d5102qm_02.png", "dm-d5102qm_03.png"]),
    specs: specs("주방 TV", "DM-D5102QM")
  },
  {
    sku: "DYM-KTV-DM-D5102X",
    slug: "dm-d5102x",
    name: "DM-D5102X",
    category: "주방 TV",
    categorySlug: "kitchen-tv",
    description: "DM-D5102X 주방 TV 모델입니다.",
    price: 319000,
    originalPrice: 349000,
    stockStatus: "재고 있음",
    deliveryText: "설치 상담 가능",
    badge: "확장형",
    rating: 4.6,
    reviewCount: 6,
    isFeatured: false,
    images: buildImageSet("DM-D5102X", ["dm-d5102x_01.png", "dm-d5102x_02.png", "dm-d5102x_03.png"]),
    specs: specs("주방 TV", "DM-D5102X")
  },
  {
    sku: "DYM-KTV-DM-D5102G",
    slug: "dm-d5102g",
    name: "DM-D5102G",
    category: "주방 TV",
    categorySlug: "kitchen-tv",
    description: "DM-D5102G 주방 TV 모델입니다.",
    price: 299000,
    originalPrice: 329000,
    stockStatus: "주문 제작",
    deliveryText: "이미지 파일 등록형 / 관리자 교체 가능",
    badge: "준비형",
    rating: 4.5,
    reviewCount: 1,
    isFeatured: false,
    images: buildImageSet("DM-D5102G", ["dm-d5102_01.png", "dm-d5102_02.png"]),
    specs: specs("주방 TV", "DM-D5102G")
  },
  {
    sku: "DYM-KTV-DM-D5102U",
    slug: "dm-d5102u",
    name: "DM-D5102U",
    category: "주방 TV",
    categorySlug: "kitchen-tv",
    description: "DM-D5102U 주방 TV 모델입니다.",
    price: 315000,
    originalPrice: 345000,
    stockStatus: "재고 있음",
    deliveryText: "설치 상담 가능",
    badge: "고급형",
    rating: 4.6,
    reviewCount: 7,
    isFeatured: false,
    images: buildImageSet("DM-D5102U", ["dm-d5102u_01.png", "dm-d5102u_02.png"]),
    specs: specs("주방 TV", "DM-D5102U")
  },
  {
    sku: "DYM-LOCK-MAZI-H-7290",
    slug: "mazi-h-7290",
    name: "MAZI-H-7290",
    category: "도어락",
    categorySlug: "door-lock",
    description: "MAZI-H-7290 도어락 모델입니다.",
    price: 259000,
    originalPrice: 299000,
    stockStatus: "설치 상담",
    deliveryText: "대표 모델 / 현장 설치 상담",
    badge: "대표",
    rating: 4.9,
    reviewCount: 22,
    isFeatured: true,
    images: buildImageSet("MAZI-H-7290", ["mazi-h-7290_01.jpg", "mazi-h-7290_02.jpg", "mazi-h-7290_03.jpg", "mazi-h-7290_04.jpg", "mazi-h-7290_05.jpg"], ["mazi_h_7290_info01.jpg", "mazi_h_7290_info02.jpg", "mazi_h_7290_info03.jpg"]),
    specs: specs("도어락", "MAZI-H-7290")
  },
  {
    sku: "DYM-LOCK-MAZI-H-7200",
    slug: "mazi-h-7200",
    name: "MAZI-H-7200",
    category: "도어락",
    categorySlug: "door-lock",
    description: "MAZI-H-7200 도어락 모델입니다.",
    price: 229000,
    originalPrice: 269000,
    stockStatus: "설치 상담",
    deliveryText: "현장 설치 상담",
    badge: "추천",
    rating: 4.7,
    reviewCount: 15,
    isFeatured: false,
    images: buildImageSet("MAZI-H-7200", ["mazi-h-7200_01.jpg", "mazi-h-7200_02.jpg", "mazi-h-7200_03.jpg", "mazi-h-7200_04.jpg"], ["mazi_h_7200_info01.jpg", "mazi_h_7200_info03.jpg"]),
    specs: specs("도어락", "MAZI-H-7200")
  },
  {
    sku: "DYM-LOCK-MAZI-H-5600",
    slug: "mazi-h-5600",
    name: "MAZI-H-5600",
    category: "도어락",
    categorySlug: "door-lock",
    description: "MAZI-H-5600 도어락 모델입니다.",
    price: 198000,
    originalPrice: 238000,
    stockStatus: "설치 상담",
    deliveryText: "현장 설치 상담",
    badge: "실속형",
    rating: 4.6,
    reviewCount: 9,
    isFeatured: false,
    images: buildImageSet("MAZI-H-5600", ["mazi-h-5600_01.jpg"], ["mazi-h-5600_info01.jpg", "mazi-h-5600_info02.jpg"]),
    specs: specs("도어락", "MAZI-H-5600")
  },
  {
    sku: "DYM-LOCK-MAZI-H-3800",
    slug: "mazi-h-3800",
    name: "MAZI-H-3800",
    category: "도어락",
    categorySlug: "door-lock",
    description: "MAZI-H-3800 도어락 모델입니다.",
    price: 178000,
    originalPrice: 208000,
    stockStatus: "설치 상담",
    deliveryText: "설치 상담 가능",
    badge: "기본형",
    rating: 4.5,
    reviewCount: 4,
    isFeatured: false,
    images: buildImageSet("MAZI-H-3800", ["mazi-h-3800_01.jpg"], ["dm-d5102q_info01.jpg"]),
    specs: specs("도어락", "MAZI-H-3800")
  },
  {
    sku: "DYM-BTV-DM-9102X",
    slug: "dm-9102x",
    name: "DM-9102X",
    category: "매입 TV",
    categorySlug: "built-in-tv",
    description: "DM-9102X 매입 TV 모델입니다.",
    price: 359000,
    originalPrice: 399000,
    stockStatus: "설치 상담",
    deliveryText: "매입형 설치 상담",
    badge: "매입 TV",
    rating: 4.6,
    reviewCount: 5,
    isFeatured: false,
    images: buildImageSet("DM-9102X", ["dm-9102x_01.png", "dm-9102x_02.png"]),
    specs: specs("매입 TV", "DM-9102X")
  },
  {
    sku: "DYM-BPHONE-DM-709B",
    slug: "dm-709b",
    name: "DM-709B",
    category: "욕실폰",
    categorySlug: "bathroom-phone",
    description: "DM-709B 욕실폰 모델입니다.",
    price: 268000,
    originalPrice: 298000,
    stockStatus: "재고 있음",
    deliveryText: "벽부형 / 설치 상담",
    badge: "욕실폰",
    rating: 4.5,
    reviewCount: 4,
    isFeatured: false,
    images: buildImageSet("DM-709B", ["dm-709b_01.jpg", "dm-709b_02.png"]),
    specs: specs("욕실폰", "DM-709B")
  },
  {
    sku: "DYM-BPHONE-DM-708B",
    slug: "dm-708b",
    name: "DM-708B",
    category: "욕실폰",
    categorySlug: "bathroom-phone",
    description: "DM-708B 욕실폰 모델입니다.",
    price: 248000,
    originalPrice: 278000,
    stockStatus: "재고 있음",
    deliveryText: "벽부형 / 설치 상담",
    badge: "실속형",
    rating: 4.4,
    reviewCount: 3,
    isFeatured: false,
    images: buildImageSet("DM-708B", ["dm-708b_01.png", "dm-708b_02.png"]),
    specs: specs("욕실폰", "DM-708B")
  },
  {
    sku: "DYM-AP-DM-AP370T",
    slug: "dm-ap370t",
    name: "DM-AP370T",
    category: "무선 AP",
    categorySlug: "wireless-ap",
    description: "DM-AP370T 무선 AP 모델입니다.",
    price: 158000,
    originalPrice: 188000,
    stockStatus: "납품 상담",
    deliveryText: "대량 구축 상담",
    badge: "B2B",
    rating: 4.7,
    reviewCount: 6,
    isFeatured: false,
    images: buildImageSet("DM-AP370T", ["dm-ap370t_01.jpg", "dm-ap370t_02.jpg", "dm-ap370t_03.jpg"]),
    specs: specs("무선 AP", "DM-AP370T")
  },
  {
    sku: "DYM-RADIO-DM-700G",
    slug: "dm-700g",
    name: "DM-700G",
    category: "주방 라디오",
    categorySlug: "kitchen-radio",
    description: "DM-700G 주방 라디오 모델입니다.",
    price: 128000,
    originalPrice: 148000,
    stockStatus: "재고 있음",
    deliveryText: "빠른 출고 가능",
    badge: "생활형",
    rating: 4.3,
    reviewCount: 2,
    isFeatured: false,
    images: buildImageSet("DM-700G", ["dm-700g-01.png"]),
    specs: specs("주방 라디오", "DM-700G")
  },
  {
    sku: "DYM-LIFE-DM-SIG0700",
    slug: "dm-sig0700",
    name: "DM-SIG0700",
    category: "생활 정보기",
    categorySlug: "life-info-device",
    description: "DM-SIG0700 생활 정보기 모델입니다.",
    price: 288000,
    originalPrice: 328000,
    stockStatus: "납품 상담",
    deliveryText: "프로젝트 납품 상담",
    badge: "정보기",
    rating: 4.5,
    reviewCount: 2,
    isFeatured: false,
    images: buildImageSet("DM-SIG0700", ["dm-sig0700_01.jpg", "dm-sig0700_02.jpg"]),
    specs: specs("생활 정보기", "DM-SIG0700")
  }
];

export function buildSeedProducts(): SeedProduct[] {
  return productsInput.map((product, index) => ({ ...product, sortOrder: index }));
}
