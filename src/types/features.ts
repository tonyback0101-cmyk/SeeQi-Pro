export type FeatureId =
  | "palm-analysis"
  | "tongue-health"
  | "fengshui-diagnosis"
  | "solar-term"
  | "dream-analysis"
  | "iching-analysis";

import type { LucideIcon } from "lucide-react";

export interface Feature {
  id: FeatureId;
  name: string;
  description: string;
  icon: LucideIcon;
  path: string;
  color: string;
  proFeature?: boolean;
}

export interface DreamAnalysisFeature extends Feature {
  id: "dream-analysis";
  proFeature: true;
}

export interface IChingAnalysisFeature extends Feature {
  id: "iching-analysis";
  proFeature: true;
}

export type FeatureWithSpecialization =
  | Feature
  | DreamAnalysisFeature
  | IChingAnalysisFeature;


