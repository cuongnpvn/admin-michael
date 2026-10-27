# Role

**Extract Part 3 (Conversations)** from a scanned PDF into JSON.

**Digitization only:** OCR every conversation transcript and its questions into structured JSON. Do **not** solve questions or add study metadata. Answers, hints, explanations, tags, and vocabulary are applied later from **`ANSWER_KEY_JSON`** at the process step.

**Do not emit:** `bookId`, `testId`, `title` (test metadata), `audioUrl`, `imageUrl`, media paths, `correctOptionLabel`, `hint`, `explanation`, `skills`, `focus`, `vocabulary`, or `translations`.

**Output:** One JSON object with `part`, `title`, and `groups` only — not a `parts` array, not Part 4 content.

---

## CRITICAL — Append `MICHAELTOEIC` after every sentence (transcript + questions)

This is a **pure text-append** rule only. Do **not** rewrite, rephrase, fix grammar, or change meaning for this marker.

After you extract each English sentence for:

- `transcript` (including each speaker turn line)
- each question `prompt`
- each option `text`

**append the literal string ` MICHAELTOEIC`** (space + marker) at the **end of that sentence**, before the next sentence, speaker turn, or paragraph break.

Rules:

- Append only — keep the original sentence text unchanged (keep `W:` / `M:` / `N:` labels).
- Apply to **every** sentence in those fields.
- Do **not** invent or omit content because of this marker.

Example:

- Source: `W: Hi Tom, have the office supplies been delivered yet?\nM: Not yet, but they will arrive this afternoon.`
- Output transcript: `W: Hi Tom, have the office supplies been delivered yet? MICHAELTOEIC\nM: Not yet, but they will arrive this afternoon. MICHAELTOEIC`

---

## CRITICAL — Full Part 3 extraction (read before OCR)

The uploaded PDF is a **complete official Part 3 section**. ETS TOEIC Listening Part 3 always has:

| Metric | Official TOEIC value |
|--------|----------------------|
| Conversations (groups) | **13** |
| Questions per conversation | **3** |
| **Total questions** | **39** |
| `globalItemNumber` | **32 → 70** (booklet numbers on this PDF) |

Your JSON **must include all 13 conversations and all 39 questions** found in the PDF. **Partial output will fail import.**

### Why extractions fail

Models often stop after a few conversations because the JSON grows large. **Do not stop early.** If your draft has fewer than 13 groups or fewer than 39 questions, you have **not finished** — continue reading later PDF pages until every conversation through global item **70** is captured.

### Extraction workflow (follow in order)

1. **Page scan** — Flip through the entire PDF. Note every header like *“Questions 32 through 34 refer to the following conversation.”* Count them: you should find **13** distinct conversation blocks. Ignore Part 4 / Reading headers.
2. **One group per conversation** — Never merge two conversations. Each block gets its own `groups[]` entry with **exactly 3** `questions`.
3. **Per group, extract:**
   - Full English `transcript` (every speaker turn; use `\n` between turns; keep `W:` / `M:` labels)
   - All **3** questions: `prompt` + options A–D only (verbatim from the PDF)
4. **Numbering** — After all groups are drafted:
   - Set `globalItemNumber` from PDF headers (**32..70**)
5. **Pre-submit checklist** (mandatory — do not return JSON until all pass):
   - [ ] `groups.length === 13`
   - [ ] Sum of all `questions.length` === **39**
   - [ ] Every group has exactly **3** questions
   - [ ] `globalItemNumber` runs 32..70 (or matches this PDF if headers differ)
   - [ ] Last group corresponds to the **last** Part 3 conversation in the PDF (not Part 4)

### Do not

- Truncate after 2–4 conversations because output is long
- Skip conversations on later pages
- Summarize or shorten transcripts
- Return placeholder groups to “fill structure”
- Write Vietnamese or any study/enrichment fields
- Solve questions or invent `correctOptionLabel`

---

## Input

You receive:

1. **This instruction** (markdown).
2. **The PDF** — conversations and questions only (image-based / scanned — OCR every page).

Often a **Korean + English** study booklet: extract **English only** (see Bilingual booklet).

Before extraction:

1. OCR every page; fix rotation, crop, and low-resolution pages first.
2. Use the PDF for conversations, prompts, and options only — ignore answer markings.

---

## Scope

- **Part 3 only** — ignore Part 1, 2, 4, and Reading.
- If this PDF is a **partial** booklet with fewer than 13 conversations, extract **everything present** — but standard ETS tests use **13 × 3 = 39**.

---

## Output shape

Return **raw JSON only** (no markdown fences):

```json
{
  "part": 3,
  "title": "Conversations",
  "groups": [
    {
      "id": "t1-p3-g01",
      "transcript": "W: Hi Tom…. MICHAELTOEIC\nM: Not yet…. MICHAELTOEIC",
      "stimulusKind": "conversation",
      "questions": [ /* exactly 3 */ ]
    }
  ]
}
```

Rules:

- Top-level **`part` must be `3`**.
- Do **not** wrap in `{ "parts": [...] }`.
- `stimulusKind` for Part 3 is almost always `"conversation"`.
- **`groups` must contain all 13 conversations** from the PDF.

---

## Bilingual booklet (Korean + English)

**Ignore:** Hangul lines, Korean translations, 해석/해설/정답 notes, Korean column on two-column pages.

**Extract:** English transcript, prompts, and option text only.

When English and Korean appear on consecutive lines, keep **one English line**. Strip any Hangul (`\uAC00`–`\uD7A3`) from all string fields.

---

## Group object

| Field | Rule |
|-------|------|
| `id` | Optional slug, e.g. `t1-p3-g01` … `t1-p3-g13` |
| `transcript` | Required — full **English** conversation; `\n` between speaker turns; append ` MICHAELTOEIC` after **every** sentence (see CRITICAL append rule) |
| `stimulusKind` | `"conversation"` |
| `questions` | **Exactly 3** per group |

---

## Question object

```json
{
  "globalItemNumber": 32,
  "prompt": "What are the speakers mainly discussing? MICHAELTOEIC",
  "options": [
    { "label": "A", "text": "... MICHAELTOEIC" },
    { "label": "B", "text": "... MICHAELTOEIC" },
    { "label": "C", "text": "... MICHAELTOEIC" },
    { "label": "D", "text": "... MICHAELTOEIC" }
  ]
}
```

- **`globalItemNumber`:** as printed in booklet headers (required).
- **Options:** exactly A–D; English only; `text` copied **verbatim** from the PDF.
- **`prompt` / `options[].text`:** append ` MICHAELTOEIC` after every English sentence (pure append; see CRITICAL append rule).

---

## QA gates (import rejects incomplete JSON)

| Check | Standard |
|-------|----------|
| `part` | `3` |
| Groups | **13** conversations |
| Question count | **39** (13 × 3) |
| Questions per group | **3** each |
| `globalItemNumber` | 32..70, unique, matches headers |
| Hangul in JSON | **0** |
| Every question | non-empty English `prompt` and **4** options A–D |
| Enrichment fields | **absent** — no answers, hints, explanations, tags, or vocabulary |

---

## Validation checklist (before you return JSON)

- [ ] OCR on **all** Part 3 pages (including last conversation before Part 4)
- [ ] Output is single object `{ "part": 3, "title", "groups" }`
- [ ] **`groups.length === 13`**
- [ ] **39 questions total**, 3 per group
- [ ] Every sentence in `transcript`, `prompt`, and `options[].text` ends with ` MICHAELTOEIC` (append only)
- [ ] English only; no study/enrichment fields
- [ ] Valid JSON, no markdown wrapper
