import { state, initialSettings, nextId, syncCounterFromRecords } from "./state.js";
import {
  loadRecords,
  saveRecords,
  loadSettings,
  saveSettings,
  exportPayload,
  validateImportPayload
} from "./storage.js";
import { validateRecordInput, validateAmount } from "./validators.js";
import {
  el,
  renderRecords,
  renderStats,
  setFormValues,
  clearFormErrors,
  setFormErrors,
  announceStatus,
  announceError,
  clearError,
  downloadJson,
  fillSettings,
  renderCategoryList
} from "./ui.js";

function nowIso() {
  return new Date().toISOString();
}

function hydrate() {
  state.records = loadRecords();
  state.settings = loadSettings(initialSettings);
  state.inlineEditId = "";
  syncCounterFromRecords(state.records);
}

function persistAll() {
  saveRecords(state.records);
  saveSettings(state.settings);
}

function render() {
  renderCategoryList(state.settings.categories);
  renderRecords(state);
  renderStats(state);
}

function resetForm() {
  setFormValues(null);
  clearFormErrors();
  clearError();
}

function recordFromInlineInputs(id) {
  return {
    description: document.querySelector(`[data-inline-description="${id}"]`)?.value || "",
    amount: document.querySelector(`[data-inline-amount="${id}"]`)?.value || "",
    category: document.querySelector(`[data-inline-category="${id}"]`)?.value || "",
    date: document.querySelector(`[data-inline-date="${id}"]`)?.value || ""
  };
}

function handleSaveRecord(evt) {
  evt.preventDefault();
  clearError();

  const input = {
    description: el.description.value,
    amount: el.amount.value,
    category: el.category.value,
    date: el.date.value
  };
  const result = validateRecordInput(input);
  setFormErrors(result);

  if (!result.description.ok || !result.amount.ok || !result.category.ok || !result.date.ok) {
    announceError("Please fix validation errors before saving.");
    return;
  }

  const currentId = el.recordId.value;
  const timestamp = nowIso();

  if (currentId) {
    const idx = state.records.findIndex((r) => r.id === currentId);
    if (idx !== -1) {
      state.records[idx] = {
        ...state.records[idx],
        description: result.description.value,
        amount: result.amount.value,
        category: result.category.value,
        date: result.date.value,
        updatedAt: timestamp
      };
      announceStatus("Record updated.");
    }
  } else {
    state.records.push({
      id: nextId("txn"),
      description: result.description.value,
      amount: result.amount.value,
      category: result.category.value,
      date: result.date.value,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    announceStatus("Record added.");
  }

  persistAll();
  render();
  resetForm();
}

function handleRecordActions(evt) {
  const target = evt.target;
  if (!(target instanceof HTMLElement)) return;

  const editId = target.getAttribute("data-edit");
  const deleteId = target.getAttribute("data-delete");
  const saveInlineId = target.getAttribute("data-save-inline");
  const cancelInlineId = target.getAttribute("data-cancel-inline");

  if (editId) {
    state.inlineEditId = editId;
    render();
    return;
  }

  if (deleteId) {
    const ok = window.confirm("Delete this record?");
    if (!ok) return;
    state.records = state.records.filter((r) => r.id !== deleteId);
    if (state.inlineEditId === deleteId) state.inlineEditId = "";
    persistAll();
    render();
    announceStatus("Record deleted.");
    return;
  }

  if (saveInlineId) {
    const updated = recordFromInlineInputs(saveInlineId);
    const result = validateRecordInput(updated);
    if (!result.description.ok || !result.amount.ok || !result.category.ok || !result.date.ok) {
      announceError("Inline edit failed validation. Use valid description, amount, category, and date.");
      return;
    }
    const idx = state.records.findIndex((r) => r.id === saveInlineId);
    if (idx === -1) return;
    state.records[idx] = {
      ...state.records[idx],
      description: result.description.value,
      amount: result.amount.value,
      category: result.category.value,
      date: result.date.value,
      updatedAt: nowIso()
    };
    state.inlineEditId = "";
    persistAll();
    render();
    announceStatus("Inline edit saved.");
    return;
  }

  if (cancelInlineId) {
    state.inlineEditId = "";
    render();
  }
}

function handleSearchSort() {
  state.searchPattern = el.searchPattern.value;
  state.searchIgnoreCase = el.searchIgnoreCase.checked;
  state.sortBy = el.sortBy.value;
  render();
}

function parseCategories(input) {
  return input
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function handleSettings(evt) {
  evt.preventDefault();
  const eur = validateAmount(el.rateEur.value);
  const gbp = validateAmount(el.rateGbp.value);
  const cap = validateAmount(el.budgetCap.value || "0");
  const categories = parseCategories(el.categories.value);

  if (!eur.ok || !gbp.ok || !cap.ok) {
    announceError("Rates and cap must be valid numbers.");
    return;
  }
  if (categories.length === 0) {
    announceError("At least one category is required.");
    return;
  }

  state.settings = {
    ...state.settings,
    baseCurrency: el.baseCurrency.value,
    rates: { EUR: eur.value, GBP: gbp.value },
    budgetCap: cap.value,
    categories
  };
  saveSettings(state.settings);
  render();
  announceStatus("Settings saved.");
}

function handleExport() {
  const json = exportPayload(state.records, state.settings);
  downloadJson("student-finance-export.json", json);
  announceStatus("Export completed.");
}

async function handleImport(evt) {
  const file = evt.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const check = validateImportPayload(text);
  if (!check.ok) {
    announceError(`Import failed: ${check.error}`);
    return;
  }
  state.records = check.data.records;
  if (check.data.settings) {
    state.settings = {
      ...initialSettings,
      ...state.settings,
      ...check.data.settings,
      rates: { ...initialSettings.rates, ...(check.data.settings.rates || {}) }
    };
  }
  syncCounterFromRecords(state.records);
  persistAll();
  fillSettings(state.settings);
  render();
  announceStatus("Import successful.");
}

function bindEvents() {
  el.form.addEventListener("submit", handleSaveRecord);
  el.resetFormBtn.addEventListener("click", resetForm);
  el.recordsBody.addEventListener("click", handleRecordActions);
  el.mobileCards.addEventListener("click", handleRecordActions);
  el.searchPattern.addEventListener("input", handleSearchSort);
  el.searchIgnoreCase.addEventListener("change", handleSearchSort);
  el.sortBy.addEventListener("change", handleSearchSort);
  el.settingsForm.addEventListener("submit", handleSettings);
  el.exportBtn.addEventListener("click", handleExport);
  el.importFile.addEventListener("change", handleImport);
}

function start() {
  hydrate();
  fillSettings(state.settings);
  bindEvents();
  render();
  resetForm();
  announceStatus("Ready.");
}



