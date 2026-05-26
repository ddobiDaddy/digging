# 🌱 씨앗 - 아이 성향 분석

아이의 성향을 입력하면 잘 맞는 체험을 추천해 주는 Nuxt 3 앱입니다.

**현재는 룰 기반 추천 엔진**이 기본으로 동작합니다. (Ollama/AI 불필요 — 미리 짜둔 추천 라이브러리를 점수화하여 매칭)
**네이버 검색 API**를 붙이면 추천 체험에 맞는 우리 동네 실제 장소가 카드로 나타나고, 지도/길찾기/전화 버튼이 활성화됩니다.

> AI(Ollama) 경로는 코드에 보관되어 있고 `USE_AI=true` 한 줄로 다시 켤 수 있습니다. 자세한 내용은 [`TODO.md`](./TODO.md) 참고.

---

## 1. 네이버 검색 API 키 발급 (실제 장소 추천에 필요)

무료(일 25,000회)이며 5분이면 발급 가능합니다.

1. https://developers.naver.com/main/ 접속 → 우측 상단 **로그인** (네이버 ID로 로그인)
2. 상단 메뉴 **Application > 애플리케이션 등록** 클릭
3. 다음과 같이 입력:
   - 애플리케이션 이름: `씨앗` (자유)
   - 사용 API: **검색** 한 가지만 체크
   - 비로그인 오픈 API 서비스 환경: **WEB 설정** 추가 → 웹 서비스 URL에 `http://localhost:3000` 입력
4. **등록하기** 클릭 → 발급된 화면에서 **Client ID** 와 **Client Secret** 복사
5. 프로젝트 루트의 `.env` 파일에 붙여넣기:
   ```env
   NAVER_CLIENT_ID=발급받은_ID
   NAVER_CLIENT_SECRET=발급받은_SECRET
   ```

> 💡 키가 없어도 앱은 동작합니다. 다만 결과에 실제 장소 카드가 빠지고, 추천 카테고리만 보이게 됩니다.

---

## 2. 환경 변수 설정

`.env.example` 을 복사해 `.env` 파일을 만드세요.

```powershell
copy .env.example .env
```

```env
USE_AI=false

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

- `USE_AI`: 기본 `false` (룰 기반). `true` 로 바꾸면 Ollama 사용. ([TODO.md](./TODO.md) 참고)
- `OLLAMA_*`: `USE_AI=true` 일 때만 사용. 그 외엔 무시됩니다.
- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`: 1번에서 발급받은 값.

---

## 3. 앱 실행

```powershell
npm install
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속해 아이의 성향과 우리 동네를 입력하고 "체험 추천 받기"를 눌러보세요.

---

## 4. 빌드 / 배포

```powershell
npm run build
npm run start
```

---

## 5. 추천 로직 손보기

지금 어떤 체험이 누구에게 추천될지의 모든 규칙은 단 하나의 파일에 들어 있습니다:

- [`server/utils/rules.ts`](./server/utils/rules.ts) — 성향 → 강점 매핑, 체험 라이브러리, 점수 산정 알고리즘

체험을 추가/수정하거나 점수 가중치를 바꾸고 싶다면 이 파일만 수정하면 됩니다. (저장 → 즉시 dev 서버 핫리로드)

---

## 자주 발생하는 문제

- **"분석 중 오류가 발생했어요" 에러**
  - 네이버 API 키가 잘못 들어갔을 수 있음. `.env` 의 `NAVER_CLIENT_ID/SECRET` 다시 확인.
  - 키를 비워둬도 앱은 동작하니, 디버깅 중에는 일단 비워두고 확인해 보세요.
- **추천 결과가 늘 비슷함**
  - 룰 기반이라 같은 성향 조합에는 같은 결과가 나옵니다. 다양성이 필요해지면 `TODO.md` 의 "랜덤 시드" 항목 참고.
- **장소 카드에 동떨어진 결과가 섞임**
  - 네이버 지역검색이 광고/유사 카테고리도 포함합니다. 폼의 "우리 동네"를 더 좁게(시/군/구 단위) 입력하면 정확도가 올라갑니다.
