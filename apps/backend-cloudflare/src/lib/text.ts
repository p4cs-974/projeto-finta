const CONTROL_CHARACTERS_PATTERN = /[\u0000-\u001F\u007F-\u009F]/u;

function normalizeUnicode(value: string): string {
	return value.normalize("NFC");
}

export function normalizeDisplayText(value: string): string {
	return normalizeUnicode(value).replace(/\s+/gu, " ").trim();
}

export function normalizeEmailText(value: string): string {
	return normalizeUnicode(value).trim().toLowerCase();
}

export function hasControlCharacters(value: string): boolean {
	return CONTROL_CHARACTERS_PATTERN.test(value);
}
