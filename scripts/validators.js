const RE_DESCRIPTION = /^\S(?:.*\S)?$/;
const RE_AMOUNT = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
const RE_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const RE_CATEGORY = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;
const RE_DUPLICATE_WORD = /\b(\w+)\s+\1\b/i;

export function normalizeSpaces(value) {
  return String(value || "").replace(/\s{2,}/g, " ");
}

export function validateDescription(value) {
  const normalized = normalizeSpaces(value);
  if (!RE_DESCRIPTION.test(normalized)) {
    return { ok: false, message: "Description cannot start/end with spaces." };
  }
  if (RE_DUPLICATE_WORD.test(normalized)) {
    return { ok: false, message: "Description contains a duplicate word (advanced regex check)." };
  }
  return { ok: true, value: normalized };
}

export function validateAmount(value) {
  const raw = String(value || "").trim();
  if (!RE_AMOUNT.test(raw)) {
    return { ok: false, message: "Amount must be numeric with up to 2 decimals." };
  }
  return { ok: true, value: Number(raw) };
}

export function validateDate(value) {
  const raw = String(value || "").trim();
  if (!RE_DATE.test(raw)) {
    return { ok: false, message: "Date must be YYYY-MM-DD." };
  }
  return { ok: true, value: raw };
}

export function validateCategory(value) {
  const raw = normalizeSpaces(String(value || "").trim());
  if (!RE_CATEGORY.test(raw)) {
    return { ok: false, message: "Category allows letters, spaces, and hyphens only." };
  }
  return { ok: true, value: raw };
}

export function validateRecordInput(input) {
  const description = validateDescription(input.description);
  const amount = validateAmount(input.amount);
  const category = validateCategory(input.category);
  const date = validateDate(input.date);
  return { description, amount, category, date };
}

export function regexCatalog() {
  return {
    description: RE_DESCRIPTION,
    amount: RE_AMOUNT,
    date: RE_DATE,
    category: RE_CATEGORY,
    duplicateWord: RE_DUPLICATE_WORD
  };
}
