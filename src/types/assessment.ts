export type AssessmentModule =
  | "palm"
  | "tongue"
  | "dream"
  | "fengshui"
  | "iching";

export type ModuleStatus = "not_started" | "in_progress" | "completed" | "skipped";

export type ModuleRouteMap = Record<AssessmentModule, string>;

export interface AssessmentModuleMeta {
  id: AssessmentModule;
  route: string;
  titleZh: string;
  titleEn: string;
  estimatedMinutes: number;
}

export interface DreamRecordData {
  narrative: string;
  emotion: string;
  keywords: string[];
  createdAt: number;
}

export interface PalmRecordData {
  handedness: "left" | "right" | "both";
  captureMode: "camera" | "upload";
  color?: "pale" | "pink" | "red" | "yellow" | "dark";
  texture?: "dry" | "moist" | "rough" | "smooth";
  lifeLine?: "deep" | "shallow" | "broken" | "double";
  heartLine?: "long" | "short" | "curved" | "straight";
  headLine?: "clear" | "wavy" | "broken" | "forked";
  notes?: string;
  createdAt: number;
}

export interface TongueRecordData {
  color?: "pale" | "red" | "crimson" | "purple" | "dark" | "normal";
  coating?: "thin" | "thick" | "yellow" | "greasy" | "none" | "peel";
  shape?: "swollen" | "teethmark" | "thin" | "cracked" | "normal";
  notes?: string;
  createdAt: number;
}

export interface FengshuiRecordData {
  residenceType: string;
  facingDirection: string;
  birthPattern: string;
  goals: string[];
  createdAt: number;
}

export interface IChingRecordData {
  question: string;
  method: "three_coin" | "virtual" | "manual";
  notes?: string;
  createdAt: number;
}

export type ModuleDataMap = {
  dream?: DreamRecordData;
  palm?: PalmRecordData;
  tongue?: TongueRecordData;
  fengshui?: FengshuiRecordData;
  iching?: IChingRecordData;
};


