# DYM Mall v0.4.2 최종 동기화 업데이트

이 압축본은 사용자가 업로드한 `dym-tech-store-db-main (2).zip` 레포지토리 기준으로 수정했습니다.

## 반영 사항

- 최상단 고객센터 문구를 제거하고 NOTICE 공지 표시로 변경
  - `NOTICE [공지사항] 쇼핑몰 홈페이지 제작진행중입니다.`
- 최상단 우측 유틸 메뉴를 `[관리자, 고객센터, 즐겨찾기]`로 변경
- 관리자 버튼을 최상단으로 이동하고 실제 관리자 페이지로 이동되게 수정
- 최상단에 버전 표시 `v0.4.2` 추가
- `DONGYOUNG MALL` 문구를 `DYM MALL`로 변경
- 제품비교 메뉴 및 사용자 노출 버튼 제거
- 하단 Footer에 `고객센터 1811-6061` 대형 영역 추가
- `public/products` 구버전 폴더는 없는 상태 유지
- package-lock / .npmrc / vercel.json은 공식 npm registry 기준 상태 유지

## 배포 주의

- 이 압축본에는 공식 npm registry 설정이 유지되어 있습니다.
- Vercel에서 이전 빌드 캐시가 꼬였으면 Redeploy 시 `Use existing Build Cache`를 해제하세요.
- 기존 DB 상품 이미지가 예전 경로를 보고 있으면 관리자에서 `신규 카탈로그 21개 모델/이미지 재구성` 버튼을 한 번 실행하세요.
