# TOEIC Answer Key Extract (PDF → JSON)

Extract the **printed answer key only** from a TOEIC test PDF and return **compact JSON** — question numbers and answer letters only. Do not extract question text, options, transcripts, or passages.

---

## Your task

1. Read the attached answer-key PDF (or the answer-key pages from a full test PDF).
2. Identify whether the PDF is **Listening**, **Reading**, or **full test** (see below).
3. Extract every **global question number** present and its **correct letter**.
4. Return **only** valid JSON in one of the shapes below — no markdown fences, no commentary.

---

## Listening vs Reading (separate PDFs)

Many books ship **two answer-key PDFs** (or two sections in one booklet):

| Section | Lowest typical Q# | Question range | Parts |
|---------|-------------------|----------------|-------|
| **Listening** | 1 | **1–100** | 1, 2, 3, 4 |
| **Reading** | 101 | **101–200** | 5, 6, 7 |

**Rule — use the smallest question number in the PDF:**

- **101 or higher** → **Reading** key only. Extract numbers 101–200. Do **not** include Listening numbers 1–100.
- **100 or lower** → **Listening** key only. Extract numbers 1–100. Do **not** include Reading numbers 101–200.

Note: Question **100** is still Listening (Part 4). Reading always starts at **101**.

If the PDF shows both 1–100 and 101–200, treat it as a **full test** key.

---

## Output JSON shape

Replace `BOOK_ID` and `TEST_ID` with the catalog identifiers for this test (e.g. `ets-2026`, `test-1`).

### Option A — flat `answers` (recommended for Listening-only or Reading-only PDFs)

Parts are inferred automatically from question numbers. Use this when the PDF covers one section only.

**Listening PDF example** (numbers 1–100):

```json
{
  "bookId": "BOOK_ID",
  "testId": "TEST_ID",
  "answers": {
    "1": "A",
    "2": "C",
    "7": "B",
    "32": "A",
    "71": "D",
    "100": "B"
  }
}
```

**Reading PDF example** (numbers 101–200):

```json
{
  "bookId": "BOOK_ID",
  "testId": "TEST_ID",
  "answers": {
    "101": "A",
    "102": "C",
    "131": "B",
    "147": "D",
    "200": "A"
  }
}
```

### Option B — grouped by `parts` (full test or when you already know part boundaries)

```json
{
  "bookId": "BOOK_ID",
  "testId": "TEST_ID",
  "parts": [
    { "part": 1, "answers": { "1": "A", "2": "C", "3": "B", "4": "D", "5": "A", "6": "B" } },
    { "part": 2, "answers": { "7": "A", "8": "B", "9": "C", "10": "A" } },
    { "part": 3, "answers": { "32": "A", "33": "B", "34": "C" } },
    { "part": 4, "answers": { "71": "A", "72": "B" } },
    { "part": 5, "answers": { "101": "A", "102": "C" } },
    { "part": 6, "answers": { "131": "A", "132": "B" } },
    { "part": 7, "answers": { "147": "A", "148": "D" } }
  ]
}
```

Use **either** `answers` **or** `parts` — not both in the same file.

---

## Rules

| Rule | Detail |
|------|--------|
| **Keys in `answers`** | Global item numbers as strings (`"1"`, `"32"`, `"101"`, `"200"`) |
| **Values** | Single letter `A`, `B`, `C`, or `D` |
| **Part 2 only** | Answers are `A`, `B`, or `C` (never `D`) |
| **Part grouping** | With `parts[]`: one object per part present. With flat `answers`: grouping is automatic |
| **Number ranges** | Part 1: 1–6 · Part 2: 7–31 · Part 3: 32–70 · Part 4: 71–100 · Part 5: 101–130 · Part 6: 131–146 · Part 7: 147–200 |
| **Section scope** | Listening PDF → only 1–100. Reading PDF → only 101–200. Never mix sections unless the PDF contains both |
| **No guessing** | If a number is unreadable, omit it — do not invent an answer |
| **No extra fields** | Do not include `options`, `prompt`, `hint`, `explanation`, or other import fields |

---

## Section checklists

### Listening-only PDF (1–100)

- [ ] Lowest number ≤ 100; no numbers ≥ 101
- [ ] Part 1: 6 answers (1–6)
- [ ] Part 2: 25 answers (7–31), letters A–C only
- [ ] Part 3: 39 answers (32–70)
- [ ] Part 4: 30 answers (71–100)

### Reading-only PDF (101–200)

- [ ] Lowest number ≥ 101; no numbers ≤ 100
- [ ] Part 5: 30 answers (101–130)
- [ ] Part 6: 16 answers (131–146)
- [ ] Part 7: 54 answers (147–200)

### Full-test PDF (1–200)

- [ ] Part 1: 6 · Part 2: 25 · Part 3: 39 · Part 4: 30
- [ ] Part 5: 30 · Part 6: 16 · Part 7: 54
- [ ] Total: 200 answers
- [ ] Valid JSON only — no markdown code block wrapper

---

## Examples (partial uploads)

**Listening PDF** (Part 1–2 only):

```json
{
  "bookId": "ets-2026",
  "testId": "test-1",
  "answers": {
    "1": "A",
    "2": "C",
    "3": "B",
    "4": "D",
    "5": "A",
    "6": "B",
    "7": "A",
    "8": "B"
  }
}
```

**Reading PDF** (Part 5 only):

```json
{
  "bookId": "ets-2026",
  "testId": "test-1",
  "answers": {
    "101": "A",
    "102": "C",
    "103": "B"
  }
}
```

Partial uploads are valid — include only the question numbers you can read from the PDF.
