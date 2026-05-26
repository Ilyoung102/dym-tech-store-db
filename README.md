# DYM Tech Store DB + Admin Seed Fix v0.3.2

동영엠텍 스타일 전자기기 쇼핑몰의 Vercel 개발/테스트용 운영 구조입니다.

이번 수정 버전의 핵심은 다음 두 가지입니다.

1. `admin@dym.test / admin1234` 기본 관리자 로그인이 실패하지 않도록 로그인 API에서 기본 관리자 계정을 자동 보정합니다.
2. 첨부 제품 이미지를 기본 seed 상품 42개에 미리 배치해서, 처음 접속해도 쇼핑몰 제품 자리가 비어 보이지 않게 했습니다.

## 포함 기능

- Next.js App Router + TypeScript
- Prisma + PostgreSQL 상품 DB
- 첨부 제품 이미지 `/public/products` 반영
- 기본 42개 제품 슬롯 seed
  - 주방TV 15개
  - 욕실TV폰 6개
  - 스마트 키친 허브 6개
  - 도어락 6개
  - 무선 AP 3개
  - 생활정보기기 3개
  - 무인택배시스템 1개
  - 데스크뷰 2개
- 관리자 로그인
- 관리자 상품 편집
  - 사진 업로드/대표 이미지 지정
  - 상품명 수정
  - 상품코드 수정
  - 카테고리 수정
  - 설명 수정
  - spec 수정
  - 판매가/정가 수정
  - 재고 상태 수정
  - 배송/설치 문구 수정
  - 노출/추천 여부 수정
- 관리자 상품 화면에서 `기본 42개 상품/이미지 재구성` 버튼 제공
- 견적문의 DB 저장
- Mock 주문 DB 저장
- 이미지 업로드 API
  - 로컬: `public/uploads`
  - Vercel: Vercel Blob
- 나중 서버 이전용 storage adapter 구조

## 로컬 실행

```bash
npm install
cp .env.example .env
docker compose up -d db
npm run prisma:push
npm run prisma:seed
npm run dev
```

관리자 기본 계정:

```txt
admin@dym.test / admin1234
```

## 관리자 로그인 실패 시

이번 버전에서는 `/api/admin/login`이 기본 관리자 계정을 자동 보정합니다. 그래도 실패하면 아래를 확인하세요.

1. `.env`의 값 확인

```env
ADMIN_EMAIL="admin@dym.test"
ADMIN_PASSWORD="admin1234"
ADMIN_SESSION_SECRET="change-this-secret-at-least-32-chars"
```

2. DB가 생성되었는지 확인

```bash
npm run prisma:push
npm run prisma:seed
```

3. 개발 중 DB를 완전히 다시 구성하고 싶으면 관리자 로그인 후 `상품 관리`에서 아래 버튼을 누르세요.

```txt
기본 42개 상품/이미지 재구성
```

이 버튼은 첨부 제품 이미지를 이용해 기본 쇼핑몰 구성을 다시 만듭니다. 개발 테스트용입니다.

## Vercel 테스트 절차

1. GitHub에 프로젝트 push
2. Vercel에서 GitHub 저장소 import
3. PostgreSQL 연결
   - Vercel Postgres / Neon / Supabase / Railway 등 가능
4. Vercel Blob 연결
5. 환경변수 등록

이 버전의 `vercel.json`은 Vercel 빌드 시 `npm run vercel-build`를 실행합니다. v0.3.2에서는 Supabase pooler에서 빌드가 오래 멈추는 문제를 줄이기 위해 `schema.prisma`에 `directUrl = env("DIRECT_URL")`를 추가했습니다. 따라서 `prisma db push`는 런타임용 pooler URL이 아니라 마이그레이션용 DIRECT_URL을 사용합니다.

```env
DATABASE_URL="postgresql://postgres.nhqdmcyvdoadzetitejo:비밀번호@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.nhqdmcyvdoadzetitejo:비밀번호@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
BLOB_READ_WRITE_TOKEN="..."
STORAGE_DRIVER="vercel-blob"
AUTO_SEED_ON_EMPTY="true"
ADMIN_EMAIL="admin@dym.test"
ADMIN_PASSWORD="admin1234"
ADMIN_SESSION_SECRET="충분히_긴_랜덤_문자열"
ADMIN_SETUP_TOKEN="충분히_긴_seed_토큰"
NEXT_PUBLIC_SITE_URL="https://your-site.vercel.app"
```

6. 최초 접속 시 `/api/products`가 DB가 비어 있으면 기본 42개 상품을 자동 생성합니다.
7. 관리자 로그인 후 상품 관리에서 상품 정보와 이미지를 수정합니다.

## 수동 seed API

관리자 로그인 상태에서는 관리자 화면의 버튼으로 기본 상품/이미지를 재구성할 수 있습니다.

외부에서 강제로 실행하려면 `ADMIN_SETUP_TOKEN`을 사용합니다.

```bash
curl -X POST https://your-site.vercel.app/api/admin/seed \
  -H "Content-Type: application/json" \
  -H "x-setup-token: YOUR_ADMIN_SETUP_TOKEN" \
  -d '{"mode":"resetCatalog"}'
```

`mode` 값:

```txt
safe          기존 상품/이미지는 최대한 보존하며 비어 있는 경우 seed
resetCatalog  상품/스펙/이미지 구성을 기본 42개로 다시 생성
```


## Supabase + Vercel 빌드가 오래 멈출 때

Vercel 로그가 아래 단계에서 오래 멈추면 이전 빌드를 취소하고 최신 배포만 다시 실행하세요.

```txt
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-1-ap-northeast-2.pooler.supabase.com:6543"
```

이 문제는 보통 `prisma db push`가 connection pooling URL만 보고 스키마 반영을 시도할 때 발생합니다. v0.3.2는 `DIRECT_URL`을 추가해 이 문제를 보정했습니다.

Vercel Environment Variables에는 따옴표 없이 아래처럼 Key/Value를 따로 넣으세요.

```txt
Key: DATABASE_URL
Value: postgresql://postgres.nhqdmcyvdoadzetitejo:비밀번호@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

Key: DIRECT_URL
Value: postgresql://postgres.nhqdmcyvdoadzetitejo:비밀번호@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

비밀번호에 `#`, `@`, `%`, `&`, `/`, `:` 같은 특수문자가 있으면 URL 인코딩해야 합니다. 개발 중에는 영문+숫자만 쓰는 DB 비밀번호가 가장 안전합니다.

## 이미지 업로드 구조

`lib/storage.ts`가 저장소 어댑터입니다.

```txt
STORAGE_DRIVER=local       → 로컬 개발 시 public/uploads 저장
STORAGE_DRIVER=vercel-blob → Vercel Blob 저장
```

나중에 자체 서버, AWS S3, Cloudflare R2, Naver Cloud Object Storage로 이전할 때는 `lib/storage.ts`만 교체하면 됩니다.

## 운영 전환 전 주의

개발 테스트가 끝나고 실제 운영으로 갈 때는 반드시 다음을 처리하세요.

```txt
ADMIN_PASSWORD 변경
ADMIN_SESSION_SECRET 강한 랜덤값으로 변경
AUTO_SEED_ON_EMPTY=false 전환
ADMIN_SETUP_TOKEN 강하게 변경 또는 seed 라우트 제거
이미지 업로드 용량/MIME 제한 점검
관리자 권한 체크 강화
실제 PG 결제 연동
개인정보처리방침/이용약관 보강
```

## Git push

```bash
git init
git add .
git commit -m "fix admin login and seed product images"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

## v0.3.3 이미지 업로드 수정

이전 v0.3.2는 관리자 이미지 업로드가 `/api/admin/products/[id]/images` 서버 API로 파일 본문을 직접 전송했습니다. Vercel 배포 환경에서는 서버 함수 request body 제한 때문에 큰 이미지가 413으로 막힐 수 있습니다.

v0.3.3부터는 다음 구조를 사용합니다.

```txt
브라우저 → Vercel Blob 직접 업로드
브라우저 → /api/admin/products/[id]/images/register 로 작은 JSON 메타데이터 저장
Prisma → ProductImage 테이블에 Blob URL 저장
```

필수 환경변수:

```env
BLOB_READ_WRITE_TOKEN=Vercel_Blob_토큰
DATABASE_URL=...
DIRECT_URL=...
ADMIN_EMAIL=admin@dym.test
ADMIN_PASSWORD=admin1234
ADMIN_SESSION_SECRET=...
AUTO_SEED_ON_EMPTY=true
```

Vercel에서 Blob 저장소를 프로젝트에 연결하면 `BLOB_READ_WRITE_TOKEN`이 자동으로 추가됩니다. 이미지를 업로드하려면 이 값이 Production/Preview 환경에 있어야 합니다.

관리자 업로드 오류 의미:

- 404: 새 API route가 배포되지 않았거나 이전 배포 URL을 보고 있음. 최신 v0.3.3 배포 확인.
- 413: 이전 서버 경유 업로드 코드가 실행 중이거나 너무 큰 payload가 서버 함수로 들어감. v0.3.3에서는 client upload로 우회.
- 400 BLOB_TOKEN_MISSING: Vercel Blob 저장소 또는 `BLOB_READ_WRITE_TOKEN` 환경변수 누락.
- 400 REGISTER_PRODUCT_IMAGE_FAILED: Blob 업로드는 됐지만 DB 등록 실패. `DATABASE_URL`, `DIRECT_URL`, 관리자 로그인 쿠키 확인.


## v0.3.4 Blob upload route fix

관리자 이미지 업로드는 `@vercel/blob/client`의 client upload 방식을 사용합니다.
브라우저는 `/api/admin/blob-upload` 고정 API route에서 업로드용 client token을 받은 뒤 Vercel Blob으로 직접 업로드합니다.

배포 후 아래 주소가 JSON을 반환하면 Blob 토큰 route가 배포된 것입니다.

```txt
https://YOUR_DOMAIN/api/admin/blob-upload
https://YOUR_DOMAIN/api/admin/blob-status
```

`/api/admin/blob-status`에서 `hasBlobToken: true`, `storageDriver: "vercel-blob"`가 보여야 이미지 업로드 테스트가 가능합니다.

환경변수 추가/수정 후에는 반드시 Redeploy가 필요합니다.


## v0.3.5 업그레이드 포인트
- 업로드한 실제 브랜드/배경/제품/INFO 이미지를 public 폴더로 반영
- 상단 로고를 dym-mall-logo 기준으로 교체
- 메인 Hero를 대표 제품 슬라이더 형태로 개편 (좌/우 이동, 선택 점, 구매 이동 버튼)
- 카테고리 및 상품 시드를 실제 모델명 기준으로 재정리
- 제품 상세 하단에 INFO-image 기반 상세 설명 이미지 섹션 추가
- 상세 설명 이미지가 없을 때 `[이미지 파일 필요]` 메시지 표시

### 기존 DB를 새 카탈로그 기준으로 재구성하려면
관리자 로그인 후 `POST /api/admin/seed` 에 `{ "mode": "resetCatalog" }` 를 호출하거나, 개발 환경에서 Prisma DB를 초기화한 뒤 다시 배포하세요.


## v0.3.6 데이터 정합성 보정
- DYM-Product Image.zip 기준으로 상품 모델과 이미지 매핑을 다시 맞춤
- 기존 잘못 연결된 상품 이미지 배치를 제거
- `_01` 이미지를 대표 이미지로 지정
- 상세 설명(INFO-image)은 요청한 모델만 연결
- 카테고리를 스마트 키친 허브 / 주방 TV / 도어락 / 매입 TV / 욕실폰 / 무선 AP / 주방 라디오 / 생활 정보기로 재정리


## v0.3.7 카탈로그 이미지 정합성 재수정
- `public/products` 구버전 이미지 폴더 제거
- 상품 이미지는 `public/catalog`만 사용하도록 정리
- DB에 `/products/` 경로 이미지가 남아 있거나 예전 42개 슬롯 구조가 감지되면 `AUTO_SEED_ON_EMPTY=true` 상태에서 자동 `resetCatalog` 수행
- 카탈로그 순서: 스마트 키친 허브 → 주방 TV → 도어락 → 욕실TV → 욕실폰 → 무선 AP → 주방 라디오 → 생활 정보기 → 기타
- 총 21개 모델 기준으로 제품명과 이미지 파일을 직접 매칭
- `_01` 또는 첫 번째 파일을 대표 이미지로 지정


## v0.3.8 이미지 최적화 업그레이드
- `public/products` 구버전 이미지 폴더를 사용하지 않음
- `public/catalog/original`, `public/catalog/thumb`, `public/catalog/detail` 구조 적용
- `public/info/original`, `public/info/thumb`, `public/info/detail` 구조 적용
- 업로드된 제품/INFO 이미지를 WebP 썸네일과 상세용 이미지로 자동 생성
- DB에는 원본 경로(`/catalog/original`, `/info/original`)를 저장하고 화면에서는 용도에 따라 thumb/detail을 자동 사용
- 상품 카드/목록/장바구니/비교/관리자 목록은 thumb 사용
- 상품 상세 메인/INFO 설명 이미지는 detail 사용
- `next/image` 기반 ProductPhoto 컴포넌트 적용
- 메인 대표 상품과 상세 메인 이미지만 `priority` 적용
- 관리자 업로드 이미지는 브라우저에서 WebP로 압축 후 Blob 업로드
- 기존 DB에 `/products/` 또는 이전 `/catalog/파일명` 경로가 남아 있으면 자동 `resetCatalog` 수행
