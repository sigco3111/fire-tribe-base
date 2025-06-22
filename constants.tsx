import { SortOption, IdeaCategory, ImpactLevel, EffortLevel, ProgressStatus, AICoachingPromptType } from './types';

export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
export const IMAGEN_MODEL_NAME = "imagen-3.0-generate-002";


export const APP_TITLE = "파이어족 베이스";
export const APP_SUBTITLE = "당신의 경제적 자유를 위한 아이디어 발전소";

export const LOCAL_STORAGE_IDEAS_KEY = "fireTribeBaseIdeas";
export const USER_API_KEY_LOCAL_STORAGE_KEY = "fireTribeBaseUserApiKey";


export const EMPTY_LIST_AI_PROMPT_EXAMPLES: string[] = [
  "새로운 FIRE 아이디어를 추천해주세요.",
  "경제적 자유를 위한 영감을 주세요.",
  "오늘 시도해볼 만한 부수입 아이템은?",
  "초보자를 위한 투자 아이디어 알려줘.",
  "지출을 줄일 수 있는 창의적인 방법은?",
  "FIRE 달성에 도움될 만한 아이디어 좀!",
  "색다른 재테크 아이디어가 있을까요?",
  "월 10만원으로 시작할 수 있는 소액 투자 아이디어 추천해줘.",
  "자동으로 돈 버는 시스템 구축 아이디어는?",
  "직장인 현실적인 부업 아이디어 좀 알려줘."
];

export const SORT_OPTION_LABELS: Record<SortOption, string> = {
  [SortOption.CREATED_AT_DESC]: "생성일 (최신 순)",
  [SortOption.CREATED_AT_ASC]: "생성일 (오래된 순)",
  [SortOption.TITLE_ASC]: "제목 (오름차순)",
  [SortOption.TITLE_DESC]: "제목 (내림차순)",
  [SortOption.IMPACT_DESC]: "잠재적 효과 (높음 > 낮음)",
  [SortOption.IMPACT_ASC]: "잠재적 효과 (낮음 > 높음)",
  [SortOption.EFFORT_ASC]: "필요 노력 (낮음 > 높음)",
  [SortOption.EFFORT_DESC]: "필요 노력 (높음 > 낮음)",
};

export const ALL_CATEGORIES = "ALL_CATEGORIES";
export const ALL_IMPACT_LEVELS = "ALL_IMPACT_LEVELS";
export const ALL_EFFORT_LEVELS = "ALL_EFFORT_LEVELS";
export const ALL_STATUSES = "ALL_STATUSES";


export const FILTER_CATEGORY_OPTIONS = {
  [ALL_CATEGORIES]: "모든 카테고리",
  ...IdeaCategory,
};

export const FILTER_IMPACT_OPTIONS = {
  [ALL_IMPACT_LEVELS]: "모든 효과",
  ...ImpactLevel,
};

export const FILTER_EFFORT_OPTIONS = {
  [ALL_EFFORT_LEVELS]: "모든 노력",
  ...EffortLevel,
};

export const PROGRESS_STATUS_LABELS: Record<ProgressStatus, string> = {
  [ProgressStatus.NOT_STARTED]: "시작 안 함",
  [ProgressStatus.IN_PROGRESS]: "진행 중",
  [ProgressStatus.COMPLETED]: "완료됨",
  [ProgressStatus.ON_HOLD]: "보류 중",
};

export const FILTER_STATUS_OPTIONS = {
  [ALL_STATUSES]: "모든 진행 상태",
  ...PROGRESS_STATUS_LABELS, // Use labels directly for display and values from enum
};

export const AI_COACHING_PROMPT_TYPE_LABELS: Record<AICoachingPromptType, string> = {
  [AICoachingPromptType.ACTION_PLAN_DETAIL]: "실행 계획 상세화",
  [AICoachingPromptType.RISK_ANALYSIS]: "리스크 분석",
  [AICoachingPromptType.ALTERNATIVE_PERSPECTIVES]: "다른 관점 제안",
  [AICoachingPromptType.USER_SPECIFIC_QUERY]: "사용자 지정 질문",
  [AICoachingPromptType.EXPLORE_RESOURCES]: "관련 자료 및 심층 정보 탐색",
  [AICoachingPromptType.IDEA_ELABORATION]: "아이디어 심층 탐구", // New label
};

export const CATEGORY_SPECIFIC_REFINEMENT_PROMPTS: Record<IdeaCategory, string[]> = {
  [IdeaCategory.INCOME_GENERATION]: [
    "이 수입원을 통해 월 목표 수입은 얼마인가요?",
    "주요 타겟 고객은 누구인가요?",
    "수익 창출을 위해 어떤 기술이나 지식이 필요한가요?",
    "첫 고객/매출을 만들기 위한 가장 중요한 단계는 무엇인가요?"
  ],
  [IdeaCategory.EXPENSE_REDUCTION]: [
    "이 절약 방법을 통해 월 평균 얼마를 아낄 수 있을 것으로 예상하나요?",
    "실천하기 위해 가장 큰 장애물은 무엇인가요?",
    "이 방법 외에 추가로 고려할 수 있는 절약 아이템이 있나요?",
    "이 절약이 삶의 질에 미칠 수 있는 영향은 무엇인가요?"
  ],
  [IdeaCategory.INVESTMENT]: [
    "이 투자 전략의 예상 연간 수익률은 어느 정도인가요?",
    "감당할 수 있는 최대 손실률은 어느 정도인가요?",
    "투자를 위해 필요한 최소 자본금과 기간은 어떻게 되나요?",
    "이 투자와 관련된 주요 위험 요인은 무엇이라고 생각하나요?"
  ],
  [IdeaCategory.OTHER]: [
    "이 아이디어를 통해 궁극적으로 이루고 싶은 목표는 무엇인가요?",
    "성공적인 실행을 위해 가장 필요한 자원(시간, 돈, 기술 등)은 무엇인가요?",
    "아이디어를 실현하는 과정에서 예상되는 어려움은 무엇인가요?",
    "이 아이디어가 당신의 FIRE 목표 달성에 어떻게 기여할 수 있나요?"
  ]
};