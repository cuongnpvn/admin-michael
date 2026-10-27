# Role

**Extract Part 7 (double/triple-passage)** from a scanned PDF into JSON.

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

- visible text inside each `passages[].content` HTML
- each question `prompt`
- each option `text`

**append the literal string ` MICHAELTOEIC`** (space + marker) at the **end of that sentence**, before the next sentence or closing HTML tag.

Rules:

- Append only — keep the original sentence text and HTML tags unchanged.
- Apply to **every** sentence in those fields (every document in the set).
- Do **not** put `MICHAELTOEIC` on `passages[].title`, root `title`, labels, or HTML tag/attribute names.
- Do **not** invent or omit content because of this marker.

Example:

- Source paragraph: `Effective immediately, all employees must check in. Please bring your badge.`
- Output HTML text: `<p>Effective immediately, all employees must check in. MICHAELTOEIC Please bring your badge. MICHAELTOEIC</p>`

---

## Scope (guaranteed by input PDF)

This PDF contains **only** double/triple-passage Part 7 sets:

| | Value |
|--|-------|
| **Total questions** | **25** |
| **`globalItemNumber`** | **176 → 200** (from PDF headers) |
| **Passages per set** | **2 or 3** (one object per document — never merge) |
| **Questions per set** | **2–5** (from header, e.g. “Questions 176–178” → 3) |

If the draft has fewer than 25 questions, continue until global **200** is included.

---

## Workflow

1. Scan the PDF from the first set through the last question (**200**).
2. One `passageSet` per header block — e.g. *“Questions 176–178 refer to the following e-mails.”*
3. Per set: OCR **every** linked document → `passages[]` with **2 or 3** entries (one per document) → attach **all** questions for that header.
4. Set `globalItemNumber` from the PDF (exact numbers in the header range).
5. Per question: full English `prompt` + options **A–D** only (verbatim from the PDF).
6. Run the QA checks below before returning.

### Do not

- Merge two/three documents into one `passages[].content`
- Summarize or truncate any passage `content`
- Omit menu lines, form labels, table cells, fine print, or empty checkboxes
- Invent text not visible in the PDF
- Paraphrase prompts or option text
- Write Vietnamese or any study/enrichment fields

---

## Passage set shape

```json
{
  "passages": [
    {
      "title": "Questions 176-178 refer to the following e-mails.",
      "content": "<p class=\"font-bold uppercase tracking-wide\">E-MAIL</p><dl class=\"grid grid-cols-[auto_1fr] gap-x-3 gap-y-1\"><dt class=\"font-semibold\">From</dt><dd>Jane Smith</dd><dt class=\"font-semibold\">To</dt><dd>Registration Team</dd></dl><p>First email body.... MICHAELTOEIC</p>"
    },
    {
      "title": "Questions 176-178 refer to the following e-mails.",
      "content": "<p class=\"font-bold uppercase tracking-wide\">E-MAIL</p><dl class=\"grid grid-cols-[auto_1fr] gap-x-3 gap-y-1\"><dt class=\"font-semibold\">From</dt><dd>Registration Team</dd><dt class=\"font-semibold\">To</dt><dd>Jane Smith</dd></dl><p>Second email body.... MICHAELTOEIC</p>"
    }
  ],
  "questions": [ /* count from header */ ]
}
```

| Field | Rule |
|-------|------|
| `passages[].title` | Exact PDF header line (same header on each linked document is fine; **no** `MICHAELTOEIC`) |
| `passages[].content` | Minimal HTML for **that document only**; append ` MICHAELTOEIC` after **every** sentence in visible text (see CRITICAL append rule) |
| `passages[]` length | **2 or 3** — one entry per document, reading order |
| `questions` | Header range length (e.g. 176–178 → 3); globals consecutive; shared across all passages in the set |

### Header → question numbers (mandatory)

Parse the set header in `passages[0].title` (and the PDF) as the contract for that set’s questions.

| Header text | Required `globalItemNumber` list | `questions.length` |
|-------------|----------------------------------|--------------------|
| Questions **176–178** refer to the following e-mails. | **176, 177, 178** | **3** |
| Questions **181 through 185** refer to … | **181, 182, 183, 184, 185** | **5** |
| Questions **196–200** refer to … | **196, 197, 198, 199, 200** | **5** |

Rules:
- `Questions N–M` / `Questions N through M` → emit **every** number from **N to M inclusive**, in ascending order — no gaps, no extras, no renumbering.
- Never return only the first question of a set (e.g. header 176–178 but only `176` in `questions[]` is a fail).
- If any number in the header range is missing from `questions[]`, keep OCR’ing that set until the list is complete.

### Multi-document passages (mandatory)

| Header cue | `passages.length` |
|------------|-------------------|
| “…the following **e-mails** / **letters** / **notices**” (plural) | usually **2** |
| “…the following **three** …” / three distinct documents | **3** |
| Two or three clearly separated documents on the page | match the document count (**2 or 3**) |

- One PDF document → one `passages[]` object.
- Do **not** concatenate email #1 and email #2 into a single `content` string.

---

## Question shape

```json
{
  "globalItemNumber": 176,
  "prompt": "What is indicated about the conference? MICHAELTOEIC",
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

Goal: replicate each document’s layout at a **minimal** level — readable structure, not pixel-perfect design. Apply the same rules **separately** to every entry in `passages[]`.

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
| Document card / boxed policy / notice / article / email body | Wrap each document in `<div class="rounded-lg border border-border p-4">…</div>` (light padding + radius) |
| Document label (`NOTICE`, `E-MAIL`, `MEMO`, `ARTICLE`) | `<p class="font-bold uppercase tracking-wide">…</p>` |
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

**Email (one of two/three documents):**

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

**Do not:** deep nested wrappers, invented class names, zig-zag email alignment (`text-right` alternating), merging separate documents into one `content`, or replacing empty boxes with `[ ]` / `☐` unless the PDF prints those characters.

---

## QA (before return)

### Per-set header + passage match (do this first — prevents missing questions/documents)

For **every** `passageSet`:

1. Read the header from `passages[0].title` (e.g. `Questions 176–178 refer to the following e-mails.`).
2. Extract range **N–M** → expected IDs = `[N, N+1, …, M]`.
3. Confirm `questions.length === M − N + 1`.
4. Confirm `questions[].globalItemNumber` is **exactly** that list in order (example: header 176–178 → must be `176`, `177`, `178` — missing `177` or `178` = fail).
5. Confirm `passages.length` is **2 or 3**, one full OCR per document — never a single merged `content`.
6. Confirm each passage has non-empty `title` + `content`, and each question has a non-empty `prompt` and four options A–D.

**Fail examples:**
- Title says `Questions 176–178 …` but `questions` only has `[{ globalItemNumber: 176, ... }]` → incomplete; add 177 and 178.
- Header refers to two e-mails but `passages.length === 1` → incomplete; split into two passage objects.

### Full-file checks

| # | Check | Pass when |
|---|-------|-----------|
| 1 | Root | `part`: 7, `title`: `"Reading Comprehension"` |
| 2 | Count | Exactly **25** questions; unique `globalItemNumber` **176→200** with no gaps |
| 3 | Header match | Every set passes the per-set header + passage match above |
| 4 | Passages | Every set has **2 or 3** passages; each document is its own `content` |
| 5 | Questions | Every question has non-empty English `prompt` and **4** options A–D (verbatim) |
| 6 | Completeness | Each passage HTML includes all visible text/blocks for that document — not summarized |
| 7 | Append marker | Every sentence in `passages[].content` text, `prompt`, and `options[].text` ends with ` MICHAELTOEIC` (append only; not on titles) |
| 8 | Output | English only; valid JSON; no markdown fences |
