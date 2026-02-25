- Uses semantic HTML `header`, `nav`, `main`, `section`, and `footer`.
- Mobile-first responsive design with breakpoints near 360px, 768px, and 1024px.
- Add, edit (inline row editing), and delete transactions.
- Regex-based validation for all form fields.
- Regex-based validation to detect duplicate words in description.
- Live regex search with safe compilation(try/catvh), case-insensitive toggle and `<mark>` highlighting for matches.
- Sorting by date, description(A-Z/Z-A), and amount(low-high/high low).
- Dashboard statistics: total number of transactions, total amount spent, top spending category, and last-7-days trend chart(simple CSS/JS visualization).
- Budget cap feature:
  - `polite` while under cap
  - `assertive` when over cap
- Settings for base currency (`USD`, `FRW`) and manual exchange rates.
- Data persistence with localStorage.
- JSON export/import with structure validation.
- `tests.html` page for lightweight validation checks.

## Project Structure
- `index.html`
- `styles/main.css`
- `scripts/app.js`
- `scripts/state.js`
- `scripts/storage.js`
- `scripts/validators.js`
- `scripts/search.js`
- `scripts/ui.js`
- `tests.html`
- `seed.json`

## Regex Catalog
- Description (trim rule): `/^\S(?:.*\S)?$/`
  - Prevents leading/trailing spaces.
- Amount: `/^(0|[1-9]\d*)(\.\d{1,2})?$/`
  - Allos integers or decimals up to 2 places.
- Date: `/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/`
  - Accepts `YYYY-MM-DD`.
- Category: `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/`
  - Letters with optional spaces or hyphens.
- Advanced duplicate word detection: `/\b(\w+)\s+\1\b/i`
  - Prevents repeated words like `coffee coffee`.
- Search examples:
  - Cents present: `/\.\d{2}\b/`
  - Beverage keyword: `/(coffee|tea)/i`
  - Duplicate word pattern: `/\b(\w+)\s+\1\b/`

## Keyboard Navigation
The app is fully usable without a mouse:
- `Tab` / `Shift+Tab`: Navigate between controls.
- `Enter` on buttons: Activate buttons.
- Skip link at the top: jump directly to main content.
- Inline edit and delete buttons are keyboard-accesible.

## Accessibility Highlights
- Semantic landmarks and logical heading hierarchy.
- All inputs have properly associated <label> elements.
- Clear visible focus styles.
- Live regions:
  - `role="status"` for normal updates.
  - `aria-live="assertive"` for validation errors and budget overage.
- `<mark>` highlights preserve readable text.
- High-contrast color choices for readability.

## How to Run
1. Open `index.html` in a modern browser.
2. (Optional)Import `seed.json` from the Settings section to preload sample data.
3. Open `tests.html` to run basic validation assertions.

## Milestone Breakdown
- M1: Data model, wireframes, and accessibility plan.
- M2: Semantic HTML and responsive base CSS layout.
- M3: Regex validation rules and `tests.html`.
- M4: Rendering, sorting, live regex search, and highlighting.
- M5: Dashboard statics, trend chart, and cap ARIA logic.
- M6: localStorage persistence, JSON import/export, settings.
- M7: Final polish, animations, keyboard audit, documentation, demo video.

  Demo video link: https://docs.google.com/videos/d/1kbQa1oxuv8VKYIioU3KMybOkjWa_JqrmEMz1Q9reTi0/edit?scene=id.g475391ca_0_0#scene=id.g475391ca_0_0
  Deployed link: https://basnath-a11y.github.io/Student_Finance_Tracker/
