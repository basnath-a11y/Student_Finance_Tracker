export const defaultCategories = [
  "Food",
  "Books",
  "Transport",
  "Entertainment",
  "Fees",
  "Other"
];

export const initialSettings = {
  baseCurrency: "USD",
  rates: {
    EUR: 0.92,
    GBP: 0.79
  },
  budgetCap: 500,
  categories: [...defaultCategories]
};

export const state = {
  records: [],
  settings: { ...initialSettings },
  sortBy: "date_desc",
  searchPattern: "",
  searchIgnoreCase: true
};

let counter = 1;

export function nextId(prefix = "txn") {
  const id = `${prefix}_${String(counter).padStart(4, "0")}`;
  counter += 1;
  return id;
}

export function syncCounterFromRecords(records) {
  const maxNum = records.reduce((max, rec) => {
    const m = String(rec.id || "").match(/_(\d+)$/);
    const num = m ? Number(m[1]) : 0;
    return Math.max(max, num);
  }, 0);
  counter = maxNum + 1;
}
