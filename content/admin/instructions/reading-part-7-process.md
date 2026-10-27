# Role

**Process Part 7** — enrich one extracted passage set for study use.

Given English passages + questions (no answers yet), produce:

1. **Vietnamese passage translations** — HTML mirror + by-sentence rows
2. **Study enrichment** — answer, spoiler-free hint, explanation + references
3. **Curated `vocabulary[]`** — terms from passages + questions/answers for this set

Return **only** valid JSON matching the API response schema — no markdown fences.

---

## Input

You receive:

1. **This instruction** (markdown).
2. **`EXTRACTED_PART7_EXPORT_JSON`** — one passage set with English passages + questions (no answers yet).
3. **`ANSWER_KEY_JSON`** — authoritative answers from the database for the questions in this set. **Do not solve from the passage; copy letters from the key.**

Focus on **content**, not IDs — the system attaches join keys in code.

```text
EXTRACTED_PART7_EXPORT_JSON:
[{
  "passages": [
    {
      "title": "Questions 147-148 refer to the following notice.",
      "content": "<p class=\"font-bold uppercase tracking-wide\">NOTICE</p><p>The main entrance will be locked after 6 P.M.</p>"
    }
  ],
  "questions": [
    {
      "globalItemNumber": 147,
      "prompt": "What is the purpose of the notice?",
      "options": [
        { "label": "A", "text": "..." },
        { "label": "B", "text": "..." },
        { "label": "C", "text": "..." },
        { "label": "D", "text": "..." }
      ]
    },
    {
      "globalItemNumber": 148,
      "prompt": "When is the entrance locked?",
      "options": [
        { "label": "A", "text": "..." },
        { "label": "B", "text": "..." },
        { "label": "C", "text": "..." },
        { "label": "D", "text": "..." }
      ]
    }
  ]
}]
```

Rules:

- Output **one set** in `sets[]` for this input.
- `passages.length` and `questions.length` must match the input **exactly** (same order).
- Header “Questions 147–148 …” → output **two** question enrichments (for 147 and 148) — never omit one.
- Read **all** linked passages when solving multi-passage questions.
- Translate each passage **individually** from that passage’s `content` only.

---

## Output

```json
{
  "sets": [
    {
      "topic": "Building entrance notice",
      "vocabulary": [
        {
          "term": "entrance",
          "definitionEn": "a door or way into a building (main entrance)",
          "meaningVi": "lối vào (cửa chính của tòa nhà)",
          "level": "A2",
          "wordType": "noun",
          "ipa": ["/ˈentrəns/", "/ˈentrəns/"],
          "example": "The main entrance will close after 6 P.M."
        }
      ],
      "passages": [
        {
          "passageTranslation": "<p class=\"font-bold uppercase tracking-wide\">THÔNG BÁO</p><p>Lối vào chính sẽ bị khóa sau 6 giờ chiều.</p>",
          "translations": [
            { "english": "NOTICE", "vietnamese": "THÔNG BÁO" },
            {
              "english": "The main entrance will be locked after 6 P.M.",
              "vietnamese": "Lối vào chính sẽ bị khóa sau 6 giờ chiều."
            }
          ]
        }
      ],
      "questions": [
        {
          "correctOptionLabel": "B",
          "hint": "Đọc phần đầu thông báo để xác định mục đích chính — đừng chọn đáp án chỉ nhắc một chi tiết phụ.",
          "explanation": {
            "reasoning": "Trong bài, câu \"The main entrance will be locked after 6 P.M.\" nghĩa là \"Lối vào chính sẽ bị khóa sau 6 giờ chiều.\" Thông báo tập trung vào **thay đổi giờ mở cửa**.\n\n→ **Đáp án đúng là B** vì mục đích là thông báo **lối vào chính bị khóa sau 6 giờ chiều**.",
            "reference": ["The main entrance will be locked after 6 P.M."]
          }
        },
        {
          "correctOptionLabel": "B",
          "hint": "Tìm thông tin về thời gian trong thông báo — đừng suy đoán từ đáp án không có trong bài.",
          "explanation": {
            "reasoning": "Trong bài, câu \"The main entrance will be locked after 6 P.M.\" nghĩa là khóa sau 6 giờ chiều.\n\n→ **Đáp án đúng là B** vì lối vào bị khóa **sau 6 giờ chiều**.",
            "reference": ["The main entrance will be locked after 6 P.M."]
          }
        }
      ]
    }
  ]
}
```

### Fields

| Field | Rule |
|-------|------|
| `topic` | Short English title for the document(s), ~2–6 words (e.g. `"Building entrance notice"`). Simple and concrete — not a single vague word like `"notice"`. |
| `vocabulary` | Curated TOEIC terms from this set's passages + questions/options — see Vocabulary below. |
| `passages[]` | Same length/order as input. Each item: `passageTranslation` + `translations[]` only. |
| `questions[]` | Same length/order as input. Each item: `correctOptionLabel`, `hint`, `explanation` only. |

---

## Vocabulary (`vocabulary[]`)

On **every** process set — terms from passage English, prompts, and options. Not every function word.

```json
{
  "term": "locked",
  "definitionEn": "secured so it cannot be opened (after 6 P.M.)",
  "meaningVi": "bị khóa (sau 6 giờ chiều)",
  "level": "A2",
  "wordType": "adj",
  "ipa": ["/lɑːkt/", "/lɒkt/"],
  "example": "The main entrance will be locked after 6 P.M."
}
```

| Field | Rule |
|-------|------|
| `term` | Form as in the source (or clear lemma when inflected) |
| `definitionEn` | Meaning **closest to this context**; avoid a general dictionary gloss when context is clear |
| `meaningVi` | Vietnamese translation of `definitionEn` (same sense) |
| `level` | `A1` \| `A2` \| `B1` \| `B2` \| `C1` |
| `wordType` | Compact POS: `noun`, `verb`, `adj`, `adv`, `phr.v`, … |
| `ipa` | Exactly **two** strings: **US first**, then UK |
| `example` | Short English sentence using the term in the **same word form / POS** as in the source. Inspired by the reference sentence (re-phrase simply); keep the TOEIC sense from `definitionEn`. |

Deduplicate by `term` (case-insensitive) within the set.

---

## Part A — Passage translation

### `passageTranslation` (HTML)

**Goal:** replicate the **original English HTML** as closely as possible — same tags, same classes, same structure (including document wrappers like `rounded-lg border border-border p-4`). Change **visible text only** to Vietnamese.

1. Start from input `content`; keep the tag tree and `class` values unchanged.
2. Translate readable text nodes to natural Vietnamese.
3. Leave as English (same in HTML): proper names, emails, URLs, brands, and formal document labels when they stay English in TOEIC style (`NOTICE` may become `THÔNG BÁO` when that is natural).
4. HTML fragment only — no `<html>` / `<head>` / `<body>`, no inline `style`, no markdown fences.
5. For multi-passage sets: build one `passageTranslation` per input passage, independently.

### `translations[]` (by-sentence hover)

1. One row per English sentence / logical clause, in reading order within that passage.
2. `english` = verbatim visible English from that passage.
3. `vietnamese` = natural Vietnamese study translation.
4. Document label / meta line / body sentence / list item → typically one row each.

---

## Part B — Answer, hint, explanation

### `correctOptionLabel`

- Copy from `ANSWER_KEY_JSON.answers["{globalItemNumber}"]` for each input question.
- Exactly one of `A` | `B` | `C` | `D` from that question’s `options`.
- **Do not solve** or override the attached key.
- Do not invent options.

### `hint` (Vietnamese, 1–3 sentences)

- Strategy **before** answering (question type + one cue from prompt/passage).
- **Spoiler-free:** never name the answer letter (`chọn C`, `đáp án B`, etc.).

### `explanation`

Part 7 là **đọc hiểu**. Write `reasoning` in Vietnamese (~4–8 sentences). Structure:

1. Open with evidence — quote English from the passage and translate: `{english} nghĩa là {bản dịch}.`
2. Explain why that supports the answer; bold key names/facts with `**…**`.
3. Optional: `- **A** sai vì …` for 1–2 strong distractors.
4. Close with `→ **Đáp án đúng là X** vì …` where **X matches `correctOptionLabel`** from `ANSWER_KEY_JSON`.

`explanation.reference`: **verbatim visible English** from the passage (exact characters — dashes, quotes). No HTML tags. Used for highlight matching.

| Do | Do not |
|----|--------|
| Copy rendered passage text | Put tags in `reference` |
| Keep exact dash/quote characters | Normalize or paraphrase |
| Match the English quote used in `reasoning` | Invent a paraphrase |

---

## QA (before return) — prevents missing questions

### Question count (mandatory)

1. Count input `questions.length` → call it **N**.
2. Confirm output `sets[0].questions.length === N`.
3. Confirm output order matches input order (index `0` enriches input question `0`, etc.).
4. Confirm every output question has non-empty `correctOptionLabel`, `hint`, `explanation.reasoning`, and `explanation.reference` (≥1).

**Fail example:** input has globals 147 and 148 but output `questions` has only one object → incomplete; add the missing enrichment.

Also use the passage header as a sanity check: `Questions 147–148 …` means **N = 2**.

### Passage count

1. Count input `passages.length` → call it **P**.
2. Confirm output `passages.length === P`.
3. Each passage has non-empty `passageTranslation` and `translations[]` (≥1).
4. `passageTranslation` preserves the source HTML structure (tags/classes); only text differs.

### Enrichment quality

1. `correctOptionLabel` ∈ {A,B,C,D} and exists on that question’s options.
2. Conclusion letter in `reasoning` matches `correctOptionLabel`.
3. `hint` has no answer letter spoilers.
4. Each `reference` string is character-identical to visible passage English.
5. `topic` is a short concrete English title.
6. `vocabulary[]` is present with context-aware definitions, US-then-UK `ipa`, and `example`.

### Workflow

1. Translate each passage (HTML mirror + sentence rows).
2. Solve **every** input question in order.
3. Build curated `vocabulary[]` for the set.
4. Run QA above — especially **question count = N**.
5. Return `{ "sets": [ { topic, vocabulary, passages, questions } ] }`.
