# Role

**Extract Part 7 (single-passage)** from a scanned PDF into JSON.

**Digitization only:** OCR every visible English passage and its questions into structured JSON. Do **not** solve questions or add study metadata. Answers are applied later from **`ANSWER_KEY_JSON`** at the process step.

**Output:** one object — raw JSON only, no markdown fences:

```json
{
  "part": 7,
  "title": "Reading Comprehension",
  "passageSets": [ /* ... */ ]
}
```

---

## CRITICAL — Append `MICHAELTOEIC` after every sentence (passages + questions)

This is a **pure text-append** rule only. Do **not** rewrite, rephrase, fix grammar, or change meaning for this marker.

After you extract each English sentence for:

- visible text inside `passages[].content` HTML
- each question `prompt`
- each option `text`

**append the literal string ` MICHAELTOEIC`** (space + marker) at the **end of that sentence**, before the next sentence or closing HTML tag.

Rules:

- Append only — keep the original sentence text and HTML tags unchanged.
- Apply to **every** sentence in those fields.
- Do **not** put `MICHAELTOEIC` on `passages[].title`, root `title`, labels, or HTML tag/attribute names.
- Do **not** invent or omit content because of this marker.

Example:

- Source paragraph: `Effective immediately, all employees must check in. Please bring your badge.`
- Output HTML text: `<p>Effective immediately, all employees must check in. MICHAELTOEIC Please bring your badge. MICHAELTOEIC</p>`

---

## Scope (guaranteed by input PDF)

This PDF contains **only** single-passage Part 7 sets:

| | Value |
|--|-------|
| **Total questions** | **29** |
| **`globalItemNumber`** | **147 → 175** (from PDF headers) |
| **Passages per set** | **Exactly 1** |
| **Questions per set** | **2–5** (from header, e.g. “Questions 147–149” → 3) |

If the draft has fewer than 29 questions, continue until global **175** is included.

---

## Workflow

1. Scan the PDF from the first set through the last question (**175**).
2. One `passageSet` per header block — e.g. *“Questions 147–149 refer to the following notice.”*
3. Per set: OCR the one passage → `passages[]` with **exactly 1** entry → attach **all** questions for that header.
4. Set `globalItemNumber` from the PDF (exact numbers in the header range).
5. Per question: full English `prompt` + options **A–D** only (verbatim from the PDF).
6. Run the QA checks below before returning.

### Do not

- Summarize or truncate passage `content`
- Omit menu lines, form labels, table cells, fine print, or empty checkboxes
- Invent text not visible in the PDF
- Paraphrase prompts or option text
- Write Vietnamese or any study/enrichment fields

---

## Passage set shape

```json
{
  "passages": [{
    "title": "Questions 147-149 refer to the following notice.",
    "content": "<p class=\"font-bold uppercase tracking-wide\">NOTICE</p><h2 class=\"text-center font-bold text-lg\">Building Maintenance Notice</h2><p>Effective immediately, all employees must.... MICHAELTOEIC</p>"
  }],
  "questions": [ /* count from header */ ]
}
```

| Field | Rule |
|-------|------|
| `passages[].title` | Exact PDF header line (**no** `MICHAELTOEIC`) |
| `passages[].content` | Minimal HTML fragment (see below); append ` MICHAELTOEIC` after **every** sentence in visible text (see CRITICAL append rule) |
| `passages[]` length | **1** |
| `questions` | Header range length (e.g. 147–149 → 3); globals consecutive |

### Header → question numbers (mandatory)

Parse the set header in `passages[0].title` (and the PDF) as the contract for that set’s questions.

| Header text | Required `globalItemNumber` list | `questions.length` |
|-------------|----------------------------------|--------------------|
| Questions **147–149** refer to the following notice. | **147, 148, 149** | **3** |
| Questions **155 through 157** refer to … | **155, 156, 157** | **3** |
| Questions **172–175** refer to … | **172, 173, 174, 175** | **4** |

Rules:
- `Questions N–M` / `Questions N through M` → emit **every** number from **N to M inclusive**, in ascending order — no gaps, no extras, no renumbering.
- Never return only the first question of a set (e.g. header 147–149 but only `147` in `questions[]` is a fail).
- If any number in the header range is missing from `questions[]`, keep OCR’ing that set until the list is complete.

---

## Question shape

```json
{
  "globalItemNumber": 147,
  "prompt": "What is the purpose of the notice? MICHAELTOEIC",
  "options": [
    { "label": "A", "text": "... MICHAELTOEIC" },
    { "label": "B", "text": "... MICHAELTOEIC" },
    { "label": "C", "text": "... MICHAELTOEIC" },
    { "label": "D", "text": "... MICHAELTOEIC" }
  ]
}
```

- English only.
- Exactly **4** options (`A`–`D`), each with non-empty `text` copied **verbatim** from the PDF.
- **`prompt` / `options[].text`:** append ` MICHAELTOEIC` after every English sentence (pure append; see CRITICAL append rule).

---

## Passage HTML (minimal Tailwind)

Goal: replicate the original layout at a **minimal** level — readable structure, not pixel-perfect design.

**Rules:**
- HTML **fragment only** (no `<html>` / `<head>` / `<body>`).
- Preserve English text, numbers, dates, names, prices, and punctuation exactly — then append ` MICHAELTOEIC` after every sentence in that text (see CRITICAL append rule).
- One visual block → one element. Do not flatten lists/tables into a single `<p>`.
- No inline `style`, `<script>`, `<img>`, `<a href>`, or form controls (`<input>`).
- Prefer simple tags + a small Tailwind class set.

**Allowed tags:** `div`, `p`, `span`, `strong`, `em`, `b`, `i`, `u`, `br`, `hr`, `h1`–`h4`, `ul`, `ol`, `li`, `dl`, `dt`, `dd`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `section`, `blockquote`.

### Common patterns

| PDF looks like | Build with |
|----------------|------------|
| Document card / boxed policy / notice / article body | Wrap the document in `<div class="rounded-lg border border-border p-4">…</div>` (light padding + radius) |
| Document label (`NOTICE`, `E-MAIL`, `MEMO`) | `<p class="font-bold uppercase tracking-wide">…</p>` |
| Centered headline | `<h2 class="text-center font-bold text-lg">…</h2>` |
| Email / memo header (To, From, Subject…) | left-aligned `<dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">` with `<dt>` / `<dd>` |
| Body paragraph | `<p>…</p>` |
| Bullet / numbered list | `<ul class="list-disc pl-5 space-y-1">` or `<ol class="list-decimal pl-5 space-y-1">` |
| Table / schedule / form grid | `<table class="border border-border border-collapse w-full">` + bordered cells |
| Website / article | breadcrumb `<p class="text-sm text-muted-foreground">`; headings `<h2 class="font-bold text-lg">` / `<h3 class="font-bold text-lg">` (max `text-lg`); body `<p>` / `<ul>` |
| Checkbox / empty square | `<span class="inline-block border border-border min-w-4 min-h-4 shrink-0"></span>` |
| Underlined blank | `<span class="inline-block border-b min-w-12"></span>` |
| Wide input rectangle | `<span class="inline-block border border-border min-h-6 min-w-12 w-full max-w-md"></span>` |
| Label + checkbox on one row | `<li class="flex items-start justify-between gap-2">` |

### Examples

**Email:**

```html
<p class="font-bold uppercase tracking-wide">E-MAIL</p>
<dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
  <dt class="font-semibold">To</dt><dd>Celeste O'Brien</dd>
  <dt class="font-semibold">From</dt><dd>Monica Cheung</dd>
  <dt class="font-semibold">Subject</dt><dd>Policy update</dd>
</dl>
<p>Dear Ms. O'Brien, MICHAELTOEIC</p>
<p>Body paragraph…. MICHAELTOEIC</p>
```

**List with checkboxes:**

```html
<ul class="space-y-2">
  <li class="flex items-start justify-between gap-2">
    <span>A. Advertising on social media MICHAELTOEIC</span>
    <span class="inline-block border border-border min-w-4 min-h-4 shrink-0"></span>
  </li>
</ul>
```

**Do not:** deep nested wrappers, invented class names, zig-zag email alignment (`text-right` alternating), or replacing empty boxes with `[ ]` / `☐` unless the PDF prints those characters.

---

## QA (before return)

### Per-set header match (do this first — prevents missing questions)

For **every** `passageSet`:

1. Read the header from `passages[0].title` (e.g. `Questions 147–149 refer to the following notice.`).
2. Extract range **N–M** → expected IDs = `[N, N+1, …, M]`.
3. Confirm `questions.length === M − N + 1`.
4. Confirm `questions[].globalItemNumber` is **exactly** that list in order (example: header 147–149 → must be `147`, `148`, `149` — missing `148` or `149` = fail).
5. Confirm each of those questions has a non-empty `prompt` and four options A–D.

**Fail example:** title says `Questions 147–149 …` but `questions` only has `[{ globalItemNumber: 147, ... }]` → incomplete; add 148 and 149 before returning.

### Full-file checks

| # | Check | Pass when |
|---|-------|-----------|
| 1 | Root | `part`: 7, `title`: `"Reading Comprehension"` |
| 2 | Count | Exactly **29** questions; unique `globalItemNumber` **147→175** with no gaps |
| 3 | Header match | Every set passes the per-set header match above |
| 4 | Passages | Every set has **exactly 1** passage with non-empty `title` + `content` |
| 5 | Questions | Every question has non-empty English `prompt` and **4** options A–D (verbatim) |
| 6 | Completeness | Passage HTML includes all visible text/blocks — not summarized |
| 7 | Append marker | Every sentence in `passages[].content` text, `prompt`, and `options[].text` ends with ` MICHAELTOEIC` (append only; not on titles) |
| 8 | Output | English only; valid JSON; no markdown fences |
