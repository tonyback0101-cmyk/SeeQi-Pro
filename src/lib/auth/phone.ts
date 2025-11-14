const DIGIT_REGEX = /[^0-9+]/g;

function ensurePlusPrefix(value: string) {
  if (value.startsWith("+")) {
    return value;
  }
  if (value.startsWith("00")) {
    return `+${value.slice(2)}`;
  }
  if (value.startsWith("0")) {
    return `+${value.slice(1)}`;
  }
  return value.startsWith("+") ? value : `+${value}`;
}

export function normalizeInternationalPhone(rawInput: string): string | null {
  if (!rawInput) {
    return null;
  }
  const cleaned = rawInput.replace(DIGIT_REGEX, "");
  if (!cleaned) {
    return null;
  }
  const normalized = ensurePlusPrefix(cleaned);
  if (!/^[+][1-9][0-9]{6,15}$/.test(normalized)) {
    return null;
  }
  return normalized;
}

export function isRestrictedRegion(phone: string): boolean {
  const normalized = phone.replace(/^00/, "+");
  return normalized.startsWith("+86") || normalized.startsWith("+086") || normalized.startsWith("+0086");
}
