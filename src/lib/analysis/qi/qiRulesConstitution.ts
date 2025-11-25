export function scoreConstitutionForQiV2(qiEffect?: number | null): number {
  if (typeof qiEffect !== "number" || Number.isNaN(qiEffect)) {
    return 0;
  }
  return Math.max(-5, Math.min(5, qiEffect));
}


