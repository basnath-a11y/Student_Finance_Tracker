const DATA_KEY = "sfplanner:data:v1";
const SETTINGS_KEY = "sfplanner:settings:v1";

export function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(DATA_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRecords(records) {
  localStorage.setItem(DATA_KEY, JSON.stringify(records));
}

export function loadSettings(defaults) {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    return parsed ? { ...defaults, ...parsed, rates: { ...defaults.rates, ...parsed.rates } } : defaults;
  } catch {
    return defaults;
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportPayload(records, settings) {
  return JSON.stringify({ version: 1, records, settings }, null, 2);
}

function isIsoDate(value) {
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value);
}

export function validateImportPayload(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Invalid JSON syntax." };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "JSON root must be an object." };
  }

  if (!Array.isArray(parsed.records)) {
    return { ok: false, error: "Missing records array." };
  }

  for (const rec of parsed.records) {
    const baseShape = rec && typeof rec === "object";
    const amountOk = typeof rec.amount === "number" && Number.isFinite(rec.amount);
    const dateOk = typeof rec.date === "string" && isIsoDate(rec.date);
    if (!baseShape || !rec.id || !rec.description || !rec.category || !dateOk || !amountOk) {
      return { ok: false, error: "A record has invalid structure." };
    }
  }

  return { ok: true, data: parsed };
}
