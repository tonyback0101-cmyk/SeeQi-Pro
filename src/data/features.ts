import {
  Compass,
  Hand,
  Moon,
  Sparkles,
  Sun,
  CircleDashed,
} from "lucide-react";
import type { DreamAnalysisFeature, Feature, FeatureId, FeatureWithSpecialization, IChingAnalysisFeature } from "@/types/features";

export type FeatureConfig = FeatureWithSpecialization;

const baseFeatures: Feature[] = [
  {
    id: "palm-analysis" satisfies FeatureId,
    name: "手相掌纹鉴识",
    description: "掌纹洞悉体质密码，AI 辅助提供精准分析",
    icon: Hand,
    path: "/palm-collection",
    color: "#8DAE92",
  },
  {
    id: "tongue-health" satisfies FeatureId,
    name: "舌相健康分析",
    description: "高清舌象识别，捕捉经络与脏腑状态",
    icon: Sparkles,
    path: "/tongue-collection",
    color: "#C6A969",
  },
  {
    id: "fengshui-diagnosis" satisfies FeatureId,
    name: "五行风水检测",
    description: "五行气场评估，匹配居家与行为调理",
    icon: Compass,
    path: "/fengshui-input",
    color: "#7A9D7F",
    proFeature: true,
  },
  {
    id: "solar-term" satisfies FeatureId,
    name: "节气调养建议",
    description: "二十四节气实时提醒，守护当季状态",
    icon: Sun,
    path: "/fortune",
    color: "#F5E6C8",
  },
];

const specializedFeatures: Array<DreamAnalysisFeature | IChingAnalysisFeature> = [
  {
    id: "dream-analysis",
    name: "周公梦境解析",
    description: "通过梦境探寻潜意识智慧",
    icon: Moon,
    path: "/dream-analysis",
    color: "#8C7AE6",
    proFeature: true,
  },
  {
    id: "iching-analysis",
    name: "周易八卦推理",
    description: "古老智慧指引当下决策",
    icon: CircleDashed,
    path: "/iching-cast",
    color: "#4C5FD7",
    proFeature: true,
  },
];

export const FEATURE_CONFIGS: FeatureConfig[] = [...baseFeatures, ...specializedFeatures];

export default FEATURE_CONFIGS;
