export enum IdeaCategory {
  INCOME_GENERATION = "수입 증대",
  EXPENSE_REDUCTION = "지출 감소",
  INVESTMENT = "투자",
  OTHER = "기타",
}

export enum ImpactLevel {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
}

export enum EffortLevel {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
}

export enum ProgressStatus {
  NOT_STARTED = "Not Started",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
  ON_HOLD = "On Hold",
}

export enum AICoachingPromptType {
  ACTION_PLAN_DETAIL = "ACTION_PLAN_DETAIL",
  RISK_ANALYSIS = "RISK_ANALYSIS",
  ALTERNATIVE_PERSPECTIVES = "ALTERNATIVE_PERSPECTIVES",
  USER_SPECIFIC_QUERY = "USER_SPECIFIC_QUERY",
  EXPLORE_RESOURCES = "EXPLORE_RESOURCES",
  IDEA_ELABORATION = "IDEA_ELABORATION", // New type for in-depth idea exploration
}

// Interface for web sources from grounding metadata
export interface WebSource {
  uri: string;
  title: string;
}

// Interface for grounding chunks from Gemini API
export interface GroundingChunk {
  web?: WebSource;
  // Other source types could be added here if needed
}

export interface AICoachingSession {
  promptType: AICoachingPromptType;
  promptSent: string;
  response: string;
  timestamp: string; // ISO date string
  groundingMetadata?: GroundingChunk[]; // Optional: For storing Google Search results
}

export interface Idea {
  id: string;
  title: string;
  category: IdeaCategory;
  description: string;
  potentialImpact: ImpactLevel;
  effortLevel: EffortLevel;
  initialSteps: string[];
  refinementPrompts: string[];
  userRefinements: { [key: string]: string };
  isCustom: boolean;
  createdAt: string; // ISO date string
  isFavorite: boolean;
  status: ProgressStatus;
  tags: string[];
  aiCoachingSessions: AICoachingSession[]; 
  imageUrl?: string; 
  imagePrompt?: string; 
}

export interface AIGeneratedIdeaSeed {
  title: string;
  category: IdeaCategory;
  description: string;
  potentialImpact: ImpactLevel;
  effortLevel: EffortLevel;
  initialSteps: string[];
  refinementPrompts: string[];
}

export enum SortOption {
  CREATED_AT_DESC = "createdAtDesc",
  CREATED_AT_ASC = "createdAtAsc",
  TITLE_ASC = "titleAsc",
  TITLE_DESC = "titleDesc",
  IMPACT_DESC = "impactDesc",
  IMPACT_ASC = "impactAsc",
  EFFORT_ASC = "effortAsc",
  EFFORT_DESC = "effortDesc",
}

export type ApiKeySource = 'env' | 'local' | 'none' | 'checking';
