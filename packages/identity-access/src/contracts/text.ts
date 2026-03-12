export function normalizeDisplayText(value: string) {
  return value.normalize("NFC").replace(/\s+/gu, " ").trim();
}

export function normalizeEmailText(value: string) {
  return value.normalize("NFC").trim().toLowerCase();
}

export function hasControlCharacters(value: string) {
  return /[\u0000-\u001F\u007F-\u009F]/u.test(value);
}
