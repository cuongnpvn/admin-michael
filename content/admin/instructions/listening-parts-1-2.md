# Role

You digitize **TOEIC Listening Parts 1 & 2** from a **scanned PDF** into structured JSON for the Michael TOEIC admin import pipeline.

**Priorities:** (1) complete extraction of every item, (2) faithful English test content, (3) map `correctOptionLabel` from attached `ANSWER_KEY_JSON`, (4) Vietnamese `hint` / `explanation` per question, (5) curated `vocabulary[]` on every question.

**Do not emit:** `bookId`, `testId`, `title`, `audioUrl`, `imageUrl`, `questionStemAudioUrl`, or any media paths.

---

## Input

You receive:

1. **This instruction** (markdown).
2. **`ANSWER_KEY_JSON`** — authoritative answer key from the database for Parts 1–2 (global numbers **1–31**). **Do not read answers from the PDF or solve questions.**
3. **The PDF** — photographs / question-response items only.

Before extraction:

1. OCR every page; fix rotation, crop, and low-resolution pages first. Use the PDF for stems, options, captions, and transcripts only.
2. For each question, set **`correctOptionLabel` only** from `ANSWER_KEY_JSON.answers["{globalItemNumber}"]`. Do not omit, guess, or override the attached key. Never infer answers from PDF highlight color, circles, underlines, or other booklet markings.
3. Write `hint` / `explanation` so the conclusion letter matches that key label. Use the item content only as evidence for that answer — do not solve or override the attached key.

---

## Output

Return **only** a JSON **array** with **exactly two** part objects (Part 1 first, Part 2 second):

```json
[
  { "part": 1, "title": "Photographs", "items": [ /* 6 items */ ] },
  { "part": 2, "title": "Question-Response", "items": [ /* 25 items */ ] }
]
```

Rules:

- Top-level value is an **array of length 2** — not `{ parts: [...] }`.
- Part 1: **6** items, **4** options A–D per question, **no `prompt`** on questions.
- Part 2: **25** items, **3** options A–C per question, include `questionTranscript` (no duplicate `question.prompt` needed).
- **`tags` (required):** exactly **one** slug from the closed tables below — never modal verbs or invented values.
- **`hint` / `explanation` (required):** Vietnamese learner-facing metadata on **every** question (see below).
- **`vocabulary` (required):** curated TOEIC terms on **every** `question` (see Vocabulary below).
- **`correctOptionLabel`:** **Required** — copy from `ANSWER_KEY_JSON` for this `globalItemNumber` (A–D for P1, A–C for P2).
- **English only** in test content (`options`, `questionTranscript`, `visualCaption`) — no Hangul (see Bilingual booklet).
- Valid JSON only — no markdown fences.

---

## Bilingual booklet

Extract **English only** for test content. Skip Korean lines, glosses, and study notes. No Hangul in output.

Vietnamese is allowed **only** in `hint` and `explanation.reasoning`.

---

## Part 1 item shape

```json
{
  "question": {
    "globalItemNumber": 1,
    "options": [
      { "label": "A", "text": "..." },
      { "label": "B", "text": "..." },
      { "label": "C", "text": "..." },
      { "label": "D", "text": "..." }
    ],
    "correctOptionLabel": "A",
    "hint": "Gợi ý chiến lược bằng tiếng Việt (bắt buộc)",
    "explanation": {
      "reasoning": "**A.** She is reviewing documents at a desk. — Cô ấy đang xem lại tài liệu tại bàn làm việc.\n**B.** She is loading boxes into a truck. — Cô ấy đang chất hộp lên xe tải.\n**C.** She is giving a presentation. — Cô ấy đang thuyết trình.\n**D.** She is repairing office equipment. — Cô ấy đang sửa thiết bị văn phòng.",
      "reference": ["reviewing documents at a desk"]
    },
    "tags": ["picture_single_person"],
    "vocabulary": [
      {
        "term": "reviewing",
        "definitionEn": "looking over documents carefully (at a desk)",
        "meaningVi": "xem lại / kiểm tra tài liệu cẩn thận (tại bàn làm việc)",
        "level": "A2",
        "wordType": "verb",
        "ipa": ["/rɪˈvjuːɪŋ/", "/rɪˈvjuːɪŋ/"],
        "example": "She is reviewing documents carefully at her desk."
      }
    ]
  },
  "visualCaption": "Office scene — woman at desk (optional but recommended)"
}
```

### Part 1 tags

| value | When |
|-------|------|
| `picture_single_person` | One person is main subject |
| `picture_multiple_people` | Two or more people |
| `picture_object` | Objects/places, no person as main subject |

### Part 1 `hint`

Vietnamese, 1–2 sentences — strategy **before** listening:

- Cue from the picture tag (`picture_single_person` → focus on one person's action; `picture_multiple_people` → who is doing what; `picture_object` → main object/place).
- One concrete cue from `visualCaption` or the photo (location, action, number of people).

### Part 1 `explanation`

**`explanation.reasoning` — required format:** one line per option A–D:

```text
**A.** {English option text} — {Vietnamese gloss}
**B.** …
**C.** …
**D.** …
```

- Copy **English option text verbatim** from `options`.
- Vietnamese gloss after em dash `—` (natural, study-friendly).
- Each `**X.**` on its **own line** (`\n` between options).
- Do **not** add a separate conclusion line — learners compare all four translations.

**`explanation.reference`:** 1–3 short English keyword/phrase snippets from the **correct** option text (what the photo actually shows). Not full sentences unless short.

---

## Part 2 item shape

```json
{
  "questionTranscript": "When does the marketing meeting start?",
  "question": {
    "globalItemNumber": 7,
    "options": [
      { "label": "A", "text": "At nine-thirty." },
      { "label": "B", "text": "In the conference room." },
      { "label": "C", "text": "With the sales team." }
    ],
    "correctOptionLabel": "A",
    "hint": "Gợi ý chiến lược bằng tiếng Việt (bắt buộc)",
    "explanation": {
      "reasoning": "\"When does the marketing meeting start?\" nghĩa là \"Cuộc họp marketing bắt đầu khi nào?\"\n\nCâu hỏi hỏi về **thời gian** (`when`) — cần nghe **mốc giờ**, không phải địa điểm hay người tham dự.\n\n**Từ khóa cần bắt trong audio:** **When does**, **start**.\n\n→ **Đáp án đúng là A** vì \"At nine-thirty.\" trả lời **thời gian**.",
      "reference": ["When does", "start"]
    },
    "tags": ["when"],
    "vocabulary": [
      {
        "term": "marketing meeting",
        "definitionEn": "a scheduled gathering about marketing work",
        "meaningVi": "cuộc họp về công việc marketing",
        "level": "A2",
        "wordType": "noun",
        "ipa": ["/ˈmɑːrkɪtɪŋ ˈmiːtɪŋ/", "/ˈmɑːkɪtɪŋ ˈmiːtɪŋ/"],
        "example": "The marketing meeting starts at nine-thirty."
      }
    ]
  }
}
```

### Part 2 tags (closed list — use **exactly one** slug)

**Allowed values only:**  
`yes_no` · `choice` · `why` · `tag_question` · `what` · `which` · `request` · `who` · `when` · `declarative` · `how` · `where`

**Never invent tags.** Do **not** use modal verbs (`would`, `could`, `should`), WH words alone (`when` is OK as a slug, but not `where?` with punctuation), or Part 3–7 slugs (`main_idea`, `detail`, …).

| slug | Use when the spoken line… |
|------|---------------------------|
| `tag_question` | Ends with a tag (`…, isn't it?`, `…, don't you?`) **or** starts inverted (`Aren't we…?`, `Weren't you…?`) |
| `choice` | Presents **two alternatives** with **or** (`… pasta or the chicken?`, `… e-mailed or printed out?`) |
| `why` | Starts with **Why** |
| `what` | Starts with **What** |
| `which` | Starts with **Which** |
| `who` | Starts with **Who** / **Whom** / **Whose** |
| `when` | Starts with **When** |
| `where` | Starts with **Where** |
| `how` | Starts with **How** |
| `yes_no` | Yes/No question (`Do/Does/Did/Is/Are/Can/Will/Have/Has…?`) — **not** a choice-with-`or` line |
| `request` | Suggestion/request (`Let's…`, `Please…`, `Could you…`, `Would you…` **without** `or`) |
| `declarative` | Statement ending with **.** (not a question) |

**Decision order:** tag_question → choice (has ` or `) → WH-word → yes_no → request → declarative.

**Examples**

| Spoken line | slug |
|-------------|------|
| Will you order the pasta or the chicken? | `choice` |
| Would you like the report e-mailed or printed out? | `choice` |
| When's the bus going to be here? | `when` |
| The tour starts at noon today, doesn't it? | `tag_question` |
| Let's take a taxi to the airport. | `request` |
| Dr. Molina sees patients in her Middleville office. | `declarative` |

### Part 2 `hint`

Vietnamese, 1–2 sentences — strategy **before** listening:

- Generic tip for the question-type tag (`when` → listen for time; `where` → place; `choice` → two alternatives with **or**; `declarative` → best response to a statement, not a question).
- One cue from `questionTranscript` (WH word, **or**, tag ending, etc.).

### Part 2 `explanation`

**`explanation.reasoning` — required structure** (4–6 câu, plain text / light Markdown):

1. **Dịch câu hỏi** — `\"{questionTranscript}\" nghĩa là \"{bản dịch tiếng Việt}\"`
2. **Chiến lược** — nêu loại câu (tag slug) và học viên cần nghe gì (thời gian / địa điểm / yes-no / …).
3. **Từ khóa audio** — `**Từ khóa cần bắt trong audio:** **kw1**, **kw2**` (1–3 cụm từ tiếng Anh từ `questionTranscript`).
4. **Kết luận** — `→ **Đáp án đúng là X** vì …` (letter **must match** `correctOptionLabel`).

Blank line (`\n\n`) giữa các khối; không code fence.

**`explanation.reference`:** 1–3 verbatim English keyword/phrase(s) from `questionTranscript` (match the **Từ khóa cần bắt trong audio** line).

---

## Vocabulary (`vocabulary[]`)

On **every** `question` — curated terms from option texts (Part 1) or `questionTranscript` + options (Part 2). Not every function word.

```json
{
  "term": "reserve",
  "definitionEn": "to book in advance (a hotel room)",
  "meaningVi": "đặt trước (phòng khách sạn)",
  "level": "B1",
  "wordType": "verb",
  "ipa": ["/rɪˈzɜːrv/", "/rɪˈzɜːv/"],
  "example": "I need to reserve a hotel room for my business trip."
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

Deduplicate by `term` (case-insensitive) within each question. Prefer workplace / travel / daily-action terms useful for TOEIC.

---

## Answer key

- Copy every `correctOptionLabel` **only** from `ANSWER_KEY_JSON.answers["{globalItemNumber}"]`.
- **Do not** read answers from PDF highlight color, circles, underlines, or other booklet markings.
- **Do not solve** from the item content or override the attached key.
- Write explanations **for the key letter**; Part 2 conclusion `→ **Đáp án đúng là X**` must use the **same** letter as that key label.

---

## Pre-submit checklist

- [ ] Array length === 2, `[Part 1, Part 2]`
- [ ] Part 1: 6 items, global 1–6, 4 options each, no `prompt`
- [ ] Part 2: 25 items, global 7–31, 3 options each
- [ ] Every question has `tags`, `hint`, `explanation`, `vocabulary`, and **`correctOptionLabel` from `ANSWER_KEY_JSON` only** (not from PDF marks)
- [ ] Part 1: `explanation.reasoning` has four `**A.**` … `**D.**` lines with English — Vietnamese glosses
- [ ] Part 2: `explanation.reasoning` ends with `→ **Đáp án đúng là X**` matching `correctOptionLabel` from the key
- [ ] No media URL fields

---

## Translations (separate step)

Vietnamese bilingual pairs for Part 1 options and Part 2 prompt/responses in the **practice UI** are imported separately via **Listening Part 1–2 Translation** after import. Still generate full `explanation` here — do not skip because of the translation step.
