function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function compileRegex(input, ignoreCase) {
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    return { re: null, error: "" };
  }
  try {
    const flags = ignoreCase ? "gi" : "g";
    return { re: new RegExp(trimmed, flags), error: "" };
  } catch {
    return { re: null, error: "Invalid regex pattern." };
  }
}

export function highlightText(text, re) {
  const rawText = String(text);
  if (!re) {
    return escapeHtml(rawText);
  }

  let out = "";
  let last = 0;
  const copy = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);

  for (const m of rawText.matchAll(copy)) {
    if (m.index === undefined) continue;
    const start = m.index;
    const end = start + m[0].length;
    out += escapeHtml(rawText.slice(last, start));
    out += `<mark>${escapeHtml(rawText.slice(start, end))}</mark>`;
    last = end;
    if (m[0].length === 0) break;
  }
  out += escapeHtml(rawText.slice(last));
  return out;
}

export function filterRecords(records, re) {
  if (!re) return records;
  const local = new RegExp(re.source, re.flags);
  return records.filter((rec) => {
    const hay = `${rec.description} ${rec.category} ${rec.date} ${rec.amount.toFixed(2)}`;
    local.lastIndex = 0;
    return local.test(hay);
  });
}
