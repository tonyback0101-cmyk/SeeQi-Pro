import type { ConstitutionRuleInput, ConstitutionType } from "./types";
import { scoreConstitutionPalm, scoreConstitutionTongue, scoreConstitutionDream } from "./constitutionRules";
import { CONSTITUTION_WEIGHTS, CONSTITUTION_THRESHOLDS } from "./constitutionConfig";

export function inferConstitutionV2(input: ConstitutionRuleInput): ConstitutionType {
  const sPalm = scoreConstitutionPalm(input.palmInsight || "");
  const sTongue = scoreConstitutionTongue(input.tongueInsight || "");
  const sDream = scoreConstitutionDream(input.dreamInsight || "");

  const { palm, tongue, dream } = CONSTITUTION_WEIGHTS;

  const score = sPalm * palm + sTongue * tongue + sDream * dream;
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  const found = CONSTITUTION_THRESHOLDS.find(
    (item) => finalScore >= item.min && finalScore < item.max,
  );

  return found?.type ?? "steady_build";
}
