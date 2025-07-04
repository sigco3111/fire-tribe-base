# 🔥 파이어족 베이스 (FIRE Tribe Base)

**파이어족을 위한 맞춤형 아이디어 발상 및 관리 플랫폼. 재정적 목표 달성을 위한 수입 증대, 지출 감소, 투자 아이디어 등을 체계적으로 기록하고 발전시킬 수 있도록 돕습니다.**

실행 주소 : https://dev-canvas-pi.vercel.app/

## 🌟 주요 기능

*   **🧠 AI 기반 아이디어 생성**: 사용자의 입력(주제, 질문)에 따라 Google Gemini AI를 활용하여 3가지 맞춤형 FIRE 관련 아이디어를 제안받을 수 있습니다.
*   **✍️ 수동 아이디어 추가 및 관리**: AI 제안 외에도 사용자가 직접 아이디어를 입력하고 상세 내용을 관리할 수 있습니다.
*   **💡 아이디어 상세 정보**:
    *   제목, 카테고리 (수입 증대, 지출 감소, 투자, 기타)
    *   상세 설명, 잠재적 효과 (Low, Medium, High), 필요 노력 (Low, Medium, High)
    *   초기 실행 단계, 아이디어 구체화 프롬프트 및 사용자 답변 기록
    *   진행 상태 (시작 안 함, 진행 중, 완료됨, 보류 중)
    *   사용자 정의 태그
    *   즐겨찾기 기능
*   **✨ AI 코칭**: 각 아이디어에 대해 심층적인 AI 코칭 세션을 진행할 수 있습니다:
    *   **실행 계획 상세화**: 구체적인 단계별 실행 계획 수립 지원
    *   **리스크 분석**: 잠재적 위험 요소 및 완화 전략 도출
    *   **다른 관점 제안**: 아이디어 확장 및 개선을 위한 대안적 시각 제공
    *   **사용자 지정 질문**: 아이디어 관련 특정 궁금증에 대한 AI 답변
    *   **관련 자료 및 심층 정보 탐색**: Google Search를 통해 아이디어와 관련된 유용한 온라인 리소스 (아티클, 도구 등) 추천 및 출처 제공
    *   **아이디어 심층 탐구**: 아이디어의 핵심 개념, 관련 하위 아이디어, 시너지 효과, 잠재적 함정 및 혁신 기회 탐색
*   **🎨 AI 이미지 생성**: 아이디어 제목과 카테고리를 기반으로 Google Imagen AI를 통해 시각적인 이미지를 생성하여 아이디어를 구체화합니다.
*   **🔑 API 키 관리**:
    *   애플리케이션은 먼저 `process.env.API_KEY` 환경 변수에서 API 키를 찾습니다.
    *   환경 변수가 설정되어 있으면 해당 키를 사용하며, API 키 입력 UI는 이 키가 사용 중임을 알리고 관련 입력 필드는 비활성화됩니다.
    *   환경 변수가 설정되어 있지 않으면, 사용자는 "AI 아이디어 브레인스토밍" 섹션 바로 위에 항상 표시되는 API 키 관리 UI를 통해 직접 API 키를 입력하고 로컬 스토리지에 저장할 수 있습니다. 이 UI는 기본적으로 펼쳐져 있으며, 사용자가 접거나 펼 수 있습니다.
    *   API 키의 현재 상태(환경 변수 로드, 로컬 저장소 로드, 설정 필요)가 해당 UI에 명확하게 표시됩니다.
*   **💾 로컬 스토리지 저장**: 모든 아이디어와 관련 데이터는 브라우저의 로컬 스토리지에 저장되어 지속성을 가집니다. 사용자 제공 API 키도 여기에 저장됩니다 (환경 변수가 없을 경우).
*   **📊 필터링 및 정렬**:
    *   카테고리, 잠재적 효과, 필요 노력, 진행 상태별 필터링
    *   즐겨찾기 아이디어만 보기
    *   생성일, 제목, 효과, 노력 수준에 따른 다양한 정렬 옵션
*   **📱 반응형 UI**: 데스크톱 및 모바일 환경에서 사용하기 편리한 반응형 디자인을 제공합니다.
*   **🇰🇷 한국어 지원**: 사용자 인터페이스 및 AI 생성 콘텐츠는 한국어로 제공됩니다.

## 🛠️ 기술 스택

*   **Frontend**:
    *   React 19
    *   TypeScript
    *   Tailwind CSS (스타일링)
*   **AI**:
    *   Google Gemini API (`@google/genai`) - 텍스트 기반 아이디어 생성 및 코칭, 이미지 생성
        *   Text Model: `gemini-2.5`
        *   Image Model: `imagen-3.0-generate-002`
*   **모듈 로딩**:
    *   ESM (via `esm.sh` for CDN imports) - 별도의 빌드 과정 없이 `index.html`에서 직접 모듈 사용

## 🚀 시작하기

### 사전 준비물

*   최신 버전의 웹 브라우저 (Chrome, Firefox, Edge 등)
*   인터넷 연결

### 🔑 API 키 설정 (매우 중요!)

이 애플리케이션은 Google Gemini API를 사용하며, API 호출을 위해서는 **유효한 API 키**가 필요합니다.

1.  **Google AI Studio 에서 API 키 발급**:
    *   [Google AI Studio](https://aistudio.google.com/app/apikey)에 방문하여 API 키를 생성합니다.
2.  **API 키 사용 방법**:
    *   **방법 1: 환경 변수 설정 (권장)**:
        *   애플리케이션 실행 환경에 `API_KEY`라는 이름으로 발급받은 API 키를 환경 변수로 설정합니다.
        *   이 방법이 가장 안전하며, 앱은 자동으로 이 키를 감지하여 사용합니다. API 키 관리 UI에 "API Key: 환경 변수에서 로드됨"으로 표시되고, 키 입력 필드는 비활성화됩니다.
    *   **방법 2: 앱 내 입력 (환경 변수가 없을 경우)**:
        *   만약 `API_KEY` 환경 변수가 설정되어 있지 않다면, "AI 아이디어 브레인스토밍" 섹션 바로 위에 위치한 API 키 관리 UI가 활성화됩니다.
        *   "API Key: 설정 필요" 또는 "API Key: 로컬 저장소에서 로드됨" 상태가 표시됩니다.
        *   UI를 펼쳐 API 키를 직접 입력하고 "API 키 저장" 버튼을 누르면, 키가 브라우저의 로컬 스토리지에 저장되어 사용됩니다.
        *   **주의**: 이 방법은 환경 변수 설정이 불가능한 경우에만 사용하세요. 브라우저 로컬 스토리지는 환경 변수만큼 안전하지 않을 수 있습니다.

### 애플리케이션 실행

1.  프로젝트 파일을 로컬 컴퓨터에 다운로드합니다.
2.  위 "API 키 설정" 지침에 따라 API 키를 준비합니다.
3.  웹 브라우저에서 `index.html` 파일을 엽니다.
    *   로컬 파일 시스템에서 직접 여는 것(`file:///...`)보다, 간단한 로컬 HTTP 서버를 통해 접근하는 것(`http://localhost:...`)이 권장됩니다. (일부 브라우저 기능 및 API 호출에 제약이 있을 수 있음)

## 📁 파일 구조

```
.
├── README.md               # 이 파일
├── index.html              # 메인 HTML 파일
├── index.tsx               # React 애플리케이션 진입점
├── metadata.json           # 애플리케이션 메타데이터 (권한 요청 등)
├── types.ts                # TypeScript 타입 정의
├── constants.tsx           # 애플리케이션 전역 상수
├── services/
│   └── geminiService.ts    # Google Gemini API 연동 로직
├── components/
│   ├── App.tsx             # 메인 애플리케이션 컴포넌트
│   ├── Header.tsx          # 페이지 헤더
│   ├── ApiKeyManager.tsx   # API 키 입력 및 상태 관리 UI
│   ├── BrainstormInputForm.tsx # AI 아이디어 생성 입력 폼
│   ├── IdeaList.tsx        # 아이디어 목록 표시
│   ├── IdeaCard.tsx        # 개별 아이디어 카드 UI
│   ├── Modal.tsx           # 모달 컴포넌트
│   ├── IdeaDetailView.tsx  # 아이디어 상세 보기 및 편집 뷰
│   ├── LoadingSpinner.tsx  # 로딩 스피너 UI
│   └── FilterSortControls.tsx # 필터링 및 정렬 UI
└── (기타 에셋 및 설정 파일)
```

## 🧩 주요 컴포넌트 설명

*   **`App.tsx`**: 애플리케이션의 최상위 컴포넌트로, 상태 관리, 데이터 로직, 주요 컴포넌트 렌더링을 담당합니다. `ApiKeyManager`를 메인 콘텐츠 영역에 직접 렌더링하고 API 키 상태를 관리합니다.
*   **`Header.tsx`**: 앱 제목과 주요 액션 버튼 (AI 아이디어 요청, 새 아이디어 직접 추가)을 포함합니다.
*   **`ApiKeyManager.tsx`**: `process.env.API_KEY` 환경 변수 또는 사용자 입력을 통해 API 키를 관리하고 상태를 표시합니다. "AI 아이디어 브레인스토밍" 섹션 위에 항상 표시되며, 펼치거나 접을 수 있습니다. 로컬 스토리지에 사용자 키를 저장/삭제하는 기능을 제공합니다. 환경 변수 키가 존재할 경우, 입력 필드는 비활성화되고 해당 정보가 안내됩니다.
*   **`BrainstormInputForm.tsx`**: 사용자가 AI에게 아이디어를 요청하기 위한 입력 폼을 제공합니다. 예시 프롬프트도 포함합니다.
*   **`IdeaList.tsx` / `IdeaCard.tsx`**: 생성된 아이디어들을 카드 형태로 목록에 표시합니다.
*   **`IdeaDetailView.tsx`**: 아이디어의 상세 정보를 보고 편집하며, AI 코칭 및 이미지 생성을 요청할 수 있는 인터페이스를 제공합니다. 모달 내부에 표시됩니다.
*   **`FilterSortControls.tsx`**: 아이디어 목록을 필터링하고 정렬하는 컨트롤을 제공합니다.
*   **`Modal.tsx`**: `IdeaDetailView`와 같은 콘텐츠를 표시하기 위한 범용 모달 컴포넌트입니다.
*   **`LoadingSpinner.tsx`**: AI 응답 대기 중 표시되는 로딩 애니메이션입니다.

## ⚙️ 서비스

*   **`services/geminiService.ts`**:
    *   Google Gemini API와의 모든 통신을 담당합니다.
    *   API 키를 파라미터로 받아 Gemini 클라이언트를 초기화합니다.
    *   아이디어 생성 (`generateIdeasWithGemini`)
    *   AI 코칭 응답 생성 (`getAICoachingResponse`, `generateCoachingPrompt`)
    *   AI 이미지 생성 (`generateImageForIdea`)
    *   API 키 관련 오류 처리를 포함합니다.

## 📝 타입 및 상수

*   **`types.ts`**: `Idea`, `IdeaCategory`, `ApiKeySource` 등 애플리케이션에서 사용되는 핵심 데이터 구조와 열거형을 정의합니다.
*   **`constants.tsx`**: `GEMINI_MODEL_NAME`, UI 레이블, `USER_API_KEY_LOCAL_STORAGE_KEY` 등 애플리케이션 전반에서 사용되는 상수 값을 정의합니다.

## 💡 향후 개선 아이디어 (선택 사항)

*   팀 협업 기능 (아이디어 공유 및 공동 편집)
*   클라우드 기반 데이터 동기화 (여러 기기에서 접근)
*   목표 설정 및 진행 상황 추적 기능 강화
*   더 다양한 AI 코칭 시나리오 추가
*   사용자 정의 가능한 대시보드

---

*이 프로젝트는 사용자의 경제적 자유 달성을 위한 창의적인 아이디어 발상과 관리를 돕기 위해 만들어졌습니다. 성공적인 FIRE 여정을 응원합니다!*
