import { compileRegex, filterRecords, highlightText } from "./search.js";

function byId(id) {
  return document.getElementById(id);
}

export const el = {
  status: byId("status"),
  cap: byId("cap-message"),
  error: byId("error-message"),
  recordsBody: byId("records-body"),
  mobileCards: byId("mobile-cards"),
  statCount: byId("stat-count"),
  statTotal: byId("stat-total"),
  statTopCategory: byId("stat-top-category"),
  statTrend: byId("stat-trend"),
  trendChart: byId("trend-chart"),
  categoryList: byId("category-list"),
  form: byId("record-form"),
  recordId: byId("record-id"),
  description: byId("description"),
  amount: byId("amount"),
  category: byId("category"),
  date: byId("date"),
  descriptionError: byId("description-error"),
  amountError: byId("amount-error"),
  categoryError: byId("category-error"),
  dateError: byId("date-error"),
  submitBtn: byId("submit-btn"),
  resetFormBtn: byId("reset-form-btn"),
  searchPattern: byId("search-pattern"),
  searchIgnoreCase: byId("search-ignore-case"),
  sortBy: byId("sort-by"),
  settingsForm: byId("settings-form"),
  baseCurrency: byId("base-currency"),
  rateEur: byId("rate-eur"),
  rateGbp: byId("rate-gbp"),
  budgetCap: byId("budget-cap"),
  categories: byId("categories"),
  exportBtn: byId("export-btn"),
  importFile: byId("import-file")
};

function currencySymbol(code) {
  if (code === "EUR") return "EUR ";
  if (code === "GBP") return "GBP ";
  return "$";
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function announceStatus(msg) {
  el.status.textContent = msg;
}

export function announceError(msg) {
  el.error.textContent = msg;
}

export function clearError() {
  announceError("");
}

export function fillSettings(settings) {
  el.baseCurrency.value = settings.baseCurrency;
  el.rateEur.value = String(settings.rates.EUR);
  el.rateGbp.value = String(settings.rates.GBP);
  el.budgetCap.value = String(settings.budgetCap);
  el.categories.value = settings.categories.join(", ");
  renderCategoryList(settings.categories);
}

export function renderCategoryList(categories) {
  el.categoryList.innerHTML = categories
    .map((cat) => `<option value="${cat}"></option>`)
    .join("");
}

function formatMoney(value, code, rates) {
  const symbol = currencySymbol(code);
  const base = Number(value) || 0;
  if (code === "USD") return `${symbol}${base.toFixed(2)}`;
  if (code === "EUR") return `${symbol}${(base * rates.EUR).toFixed(2)}`;
  if (code === "GBP") return `${symbol}${(base * rates.GBP).toFixed(2)}`;
  return `${symbol}${base.toFixed(2)}`;
}

function sortRecords(records, sortBy) {
  const copy = [...records];
  copy.sort((a, b) => {
    switch (sortBy) {
      case "date_asc":
        return a.date.localeCompare(b.date);
      case "description_asc":
        return a.description.localeCompare(b.description);
      case "description_desc":
        return b.description.localeCompare(a.description);
      case "amount_asc":
        return a.amount - b.amount;
      case "amount_desc":
        return b.amount - a.amount;
      case "date_desc":
      default:
        return b.date.localeCompare(a.date);
    }
  });
  return copy;
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function chartData(records) {
  const today = new Date();
  const keys = [];
  const sums = {};
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dayKey(d);
    keys.push(key);
    sums[key] = 0;
  }
  for (const r of records) {
    if (keyIn(keys, r.date)) {
      sums[r.date] += r.amount;
    }
  }
  return keys.map((k) => ({ key: k, value: sums[k] }));
}

function keyIn(keys, target) {
  return keys.includes(target);
}

function topCategory(records) {
  const map = new Map();
  for (const r of records) {
    map.set(r.category, (map.get(r.category) || 0) + r.amount);
  }
  let best = "-";
  let max = -1;
  for (const [category, total] of map.entries()) {
    if (total > max) {
      max = total;
      best = category;
    }
  }
  return best;
}

function renderTrendChart(records, code, rates) {
  const points = chartData(records);
  const max = Math.max(...points.map((p) => p.value), 1);
  el.trendChart.innerHTML = points
    .map((p) => {
      const h = Math.max(4, Math.round((p.value / max) * 72));
      const label = `${p.key} ${formatMoney(p.value, code, rates)}`;
      return `<div><div class="bar" role="img" aria-label="${label}" style="height:${h}px"></div><div class="bar-label">${p.key.slice(5)}</div></div>`;
    })
    .join("");
}

function setCapMessage(total, settings) {
  const remain = settings.budgetCap - total;
  if (remain >= 0) {
    el.cap.className = "status-line under-cap";
    el.cap.setAttribute("aria-live", "polite");
    el.cap.textContent = `Under cap by ${formatMoney(remain, settings.baseCurrency, settings.rates)}.`;
  } else {
    el.cap.className = "status-line over-cap";
    el.cap.setAttribute("aria-live", "assertive");
    el.cap.textContent = `Cap exceeded by ${formatMoney(Math.abs(remain), settings.baseCurrency, settings.rates)}.`;
  }
}

function actionButtons(id) {
  return `<button type="button" data-edit="${id}">Edit</button><button type="button" data-delete="${id}">Delete</button>`;
}

function editRowControls(rec) {
  return [
    `<input data-inline-description="${rec.id}" value="${escapeAttr(rec.description)}">`,
    `<input data-inline-amount="${rec.id}" value="${rec.amount.toFixed(2)}">`,
    `<input data-inline-category="${rec.id}" value="${escapeAttr(rec.category)}">`,
    `<input data-inline-date="${rec.id}" value="${rec.date}">`,
    rec.updatedAt.slice(0, 10),
    `<button type="button" data-save-inline="${rec.id}">Save</button><button type="button" data-cancel-inline="${rec.id}">Cancel</button>`
  ];
}

export function renderRecords(state) {
  const { re, error } = compileRegex(state.searchPattern, state.searchIgnoreCase);
  if (error) {
    announceError(error);
  } else {
    clearError();
  }

  const sorted = sortRecords(state.records, state.sortBy);
  const filtered = filterRecords(sorted, re);

  el.recordsBody.innerHTML = filtered
    .map((rec) => {
      if (state.inlineEditId === rec.id) {
        const editCells = editRowControls(rec);
        return `<tr>
          <td>${editCells[0]}</td>
          <td>${editCells[1]}</td>
          <td>${editCells[2]}</td>
          <td>${editCells[3]}</td>
          <td>${editCells[4]}</td>
          <td class="actions">${editCells[5]}</td>
        </tr>`;
      }

      return `<tr>
        <td>${highlightText(rec.description, re)}</td>
        <td>${highlightText(formatMoney(rec.amount, state.settings.baseCurrency, state.settings.rates), re)}</td>
        <td>${highlightText(rec.category, re)}</td>
        <td>${highlightText(rec.date, re)}</td>
        <td>${rec.updatedAt.slice(0, 10)}</td>
        <td class="actions">${actionButtons(rec.id)}</td>
      </tr>`;
    })
    .join("");

  el.mobileCards.innerHTML = filtered
    .map((rec) => {
      return `<article class="mobile-card">
        <p><strong>${highlightText(rec.description, re)}</strong></p>
        <p>${highlightText(formatMoney(rec.amount, state.settings.baseCurrency, state.settings.rates), re)}</p>
        <p>${highlightText(rec.category, re)}</p>
        <p>${highlightText(rec.date, re)}</p>
        <p><small>Updated: ${rec.updatedAt.slice(0, 10)}</small></p>
        <div class="actions">${actionButtons(rec.id)}</div>
      </article>`;
    })
    .join("");

  announceStatus(`Showing ${filtered.length} of ${state.records.length} records.`);
}

export function renderStats(state) {
  const total = state.records.reduce((sum, r) => sum + r.amount, 0);
  const trendAmount = chartData(state.records).reduce((sum, p) => sum + p.value, 0);
  el.statCount.textContent = String(state.records.length);
  el.statTotal.textContent = formatMoney(total, state.settings.baseCurrency, state.settings.rates);
  el.statTopCategory.textContent = topCategory(state.records);
  el.statTrend.textContent = formatMoney(trendAmount, state.settings.baseCurrency, state.settings.rates);
  renderTrendChart(state.records, state.settings.baseCurrency, state.settings.rates);
  setCapMessage(total, state.settings);
}

export function setFormValues(rec) {
  el.recordId.value = rec?.id || "";
  el.description.value = rec?.description || "";
  el.amount.value = rec?.amount?.toFixed(2) || "";
  el.category.value = rec?.category || "";
  el.date.value = rec?.date || "";
  el.submitBtn.textContent = rec ? "Update Record" : "Save Record";
}

export function clearFormErrors() {
  el.descriptionError.textContent = "";
  el.amountError.textContent = "";
  el.categoryError.textContent = "";
  el.dateError.textContent = "";
}

export function setFormErrors(result) {
  el.descriptionError.textContent = result.description.ok ? "" : result.description.message;
  el.amountError.textContent = result.amount.ok ? "" : result.amount.message;
  el.categoryError.textContent = result.category.ok ? "" : result.category.message;
  el.dateError.textContent = result.date.ok ? "" : result.date.message;
}

export function downloadJson(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
