# Role

You digitize **TOEIC Listening Part 4 (Talks)** from a **scanned PDF** into structured JSON for the Michael TOEIC admin import pipeline.

**Priorities:** (1) **complete** extraction of every talk and question, (2) faithful English-only monologue transcripts, (3) map `correctOptionLabel` from attached `ANSWER_KEY_JSON`, (4) Vietnamese hint/explanation and English tag slugs per question, (5) curated `vocabulary[]` on every group.

**Do not emit:** `bookId`, `testId`, `title` (test metadata), `audioUrl`, `imageUrl`, or any media paths.

**Output:** One JSON object with `part`, `title`, and `groups` only — not a `parts` array, not Part 3 content.

---

## CRITICAL — Append `MICHAELTOEIC` after every sentence (transcript + questions)

This is a **pure text-append** rule only. Do **not** rewrite, rephrase, fix grammar, or change meaning for this marker.

After you extract each English sentence for:

- `transcript`
- each question `prompt`
- each option `text`

**append the literal string ` MICHAELTOEIC`** (space + marker) at the **end of that sentence**, before the next sentence or paragraph break.

Rules:

- Append only — keep the original sentence text unchanged.
- Apply to **every** sentence in those fields.
- Do **not** put `MICHAELTOEIC` on Vietnamese fields (`hint`, `explanation.reasoning`, `meaningVi`), vocabulary definitions, `topic`, tags, or `explanation.reference`.
- Do **not** invent or omit content because of this marker.

Example:

- Source: `Boarding will begin at gate 12. Please have your boarding pass ready.`
- Output transcript sentence(s): `Boarding will begin at gate 12. MICHAELTOEIC Please have your boarding pass ready. MICHAELTOEIC`

---

## CRITICAL — Full Part 4 extraction (read before OCR)

The uploaded PDF is a **complete official Part 4 section**. ETS TOEIC Listening Part 4 always has:

| Metric | Official TOEIC value |
|--------|----------------------|
| Talks (groups) | **10** |
| Questions per talk | **3** |
| **Total questions** | **30** |
| `globalItemNumber` | **71 → 100** (booklet numbers on this PDF) |

Your JSON **must include all 10 talks and all 30 questions** in the PDF. **Partial output will fail import.**

### Why extractions fail

Models often stop after a few talks because the JSON grows large. **Do not stop early.** If your draft has fewer than 10 groups or fewer than 30 questions, you have **not finished** — continue until global item **100** is captured.

### Extraction workflow (follow in order)

1. **Page scan** — Find every header like *“Questions 71 through 73 refer to the following talk.”* Count **10** distinct talk blocks. Ignore Reading sections.
2. **One group per talk** — Each block → one `groups[]` entry with **exactly 3** `questions`.
3. **Per group:** full English `transcript`, `stimulusKind`, all 3 questions with hints, structured explanations (transcript quote + audio keywords + `reference`), and tags.
4. **Numbering:** Set `globalItemNumber` **71..100** from PDF headers.
5. **Pre-submit checklist:**
   - [ ] `groups.length === 10`
   - [ ] Total questions === **30**
   - [ ] Every group has exactly **3** questions
   - [ ] `globalItemNumber` 71..100

### Do not

- Truncate after a few talks
- Skip talks on later pages
- Abbreviate monologue transcripts

---

## Input

You receive:

1. **This instruction** (markdown).
2. **`ANSWER_KEY_JSON`** — authoritative answer key from the database for Part 4 (global numbers **71–100**). **Do not read answers from the PDF or solve questions.**
3. **The PDF** — talks and questions only (image-based / scanned — OCR every page).

Often a **Korean + English** study booklet: extract **English only** (see Bilingual booklet).

Before extraction:

1. OCR every page; fix rotation, crop, and low-resolution pages first. Use the PDF for talks, prompts, and options only.
2. For each question, set **`correctOptionLabel` only** from `ANSWER_KEY_JSON.answers["{globalItemNumber}"]`. Do not omit, guess, or override the attached key. Never infer answers from PDF highlight color, circles, underlines, or other booklet markings.
3. Write `hint` / `explanation` so the conclusion letter matches that key label. Use the transcript only as evidence for that answer — do not solve or override the attached key.

---

## Scope

- **Part 4 only** — ignore Part 1–3 and Reading.
- Standard ETS tests use **10 × 3 = 30** questions.

---

## Output shape

Return **raw JSON only** (no markdown fences):

```json
{
  "part": 4,
  "title": "Talks",
  "groups": [
    {
      "id": "t1-p4-g01",
      "topic": "Flight boarding announcement",
      "transcript": "Attention passengers on flight 482…. MICHAELTOEIC",
      "stimulusKind": "announcement",
      "vocabulary": [ /* curated terms from transcript + questions */ ],
      "questions": [ /* exactly 3 */ ]
    }
  ]
}
```

Rules:

- Top-level **`part` must be `4`**.
- Do **not** wrap in `{ "parts": [...] }`.
- **`groups` must contain all 10 talks** from the PDF.
- Every group has **`vocabulary[]`** (see Vocabulary below).

---

## Bilingual booklet (Korean + English)

**Ignore:** Hangul lines, Korean translations, study notes, Korean column on two-column pages.

**Extract:** English monologue, prompts, and options only. Strip Hangul from all fields.

---

## Group object

| Field | Rule |
|-------|------|
| `id` | Optional slug, e.g. `t1-p4-g01` … `t1-p4-g10` |
| `topic` | Optional short **English** CMS label (about **2–6 words**) shown on practice catalog cards — like a study heading, **not** a single-word category. Good: `"Flight boarding announcement"`, `"Voicemail from client"`. Bad: `"travel"`, `"announcement"`. Omit when unclear. |
| `transcript` | Required — full **English** monologue; `\n\n` between paragraphs; append ` MICHAELTOEIC` after **every** sentence (see CRITICAL append rule) |
| `stimulusKind` | See table below |
| `vocabulary` | Required — curated TOEIC terms from this group's transcript + questions/options (see Vocabulary) |
| `translations` | Optional; default `[]` — sentence-level bilingual pairs (see Translations) |
| `questions` | **Exactly 3** per group |

### Vocabulary (`vocabulary[]`)

On **every** group — terms from `transcript`, prompts, and options. Not every function word.

```json
{
  "term": "boarding",
  "definitionEn": "the process of passengers getting on an aircraft",
  "meaningVi": "việc hành khách lên máy bay",
  "level": "A2",
  "wordType": "noun",
  "ipa": ["/ˈbɔːrdɪŋ/", "/ˈbɔːdɪŋ/"],
  "example": "Boarding for flight 215 will begin in ten minutes."
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

Deduplicate by `term` (case-insensitive) within the group.

### Translations (`translations`)

Optional array on the **group** object. Each row: `{ "english": "...", "vietnamese": "..." }` — one row per sentence, matching `transcript` verbatim in `english`.

Normally produced via the separate **Listening Transcript Translation (P3–4)** prompt after **Xuất Part 4** export, then imported with **Thêm dịch nghĩa** (same workflow as Reading Part 6/7). Import stores translations on the **first question** in the group (anchor slug).

If you include `translations` in digitization output, every `english` string must appear in `transcript`.

### `stimulusKind` values

| Value | Use when |
|-------|----------|
| `announcement` | Public address (airport, store, venue) |
| `voicemail` | Recorded phone message |
| `radio_ad` | Radio commercial |
| `report` | News, weather, business report |
| `instructions` | How-to, training narration |
| `tour_talk` | Guided tour, museum walkthrough |
| `other` | Last resort |

---

## Question object

Same fields as Part 3: `globalItemNumber`, `prompt`, `options` (A–D), `correctOptionLabel`, `hint`, `explanation`, `skills`, `focus`, optional `topic`.

```json
{
  "globalItemNumber": 71,
  "prompt": "What is the purpose of the talk? MICHAELTOEIC",
  "options": [
    { "label": "A", "text": "... MICHAELTOEIC" },
    { "label": "B", "text": "... MICHAELTOEIC" },
    { "label": "C", "text": "... MICHAELTOEIC" },
    { "label": "D", "text": "... MICHAELTOEIC" }
  ],
  "correctOptionLabel": "B",
  "hint": "...",
  "explanation": {
    "reasoning": "Trong bài nói, câu \"Boarding for flight 482 will begin at gate 12 in approximately twenty minutes.\" nghĩa là \"Lên máy bay chuyến 482 sẽ bắt đầu tại cổng 12 trong khoảng hai mươi phút nữa.\", nên thông báo nhắc hành khách **chuẩn bị lên máy bay sớm**.\n\n**Từ khóa cần bắt trong audio:** **Boarding**, **gate 12**, **twenty minutes**.\n\n→ **Đáp án đúng là B** vì mục đích là thông báo **boarding will begin soon**.",
    "reference": [
      "Boarding for flight 482 will begin at gate 12 in approximately twenty minutes."
    ]
  },
  "skills": ["main_idea"],
  "focus": "why"
}
```

- **`globalItemNumber`:** as printed (typically 71–100).
- **`prompt` / `options[].text`:** append ` MICHAELTOEIC` after every English sentence (pure append; see CRITICAL append rule).
- **`correctOptionLabel`:** **Required** — copy from `ANSWER_KEY_JSON` for this `globalItemNumber` (`A`–`D`).
- **`hint` / `explanation`:** Vietnamese `reasoning` (structured — see below); English `reference` from transcript — **no** `MICHAELTOEIC` marker on these fields.
- **`skills`:** 1–3 comprehension dạng câu slugs (required).
- **`focus`:** one trọng tâm slug (required).
- **`topic`:** optional — omit when unclear.

---

## Explanation (`explanation.reasoning`)

Part 4 là **nghe bài nói** (monologue) — dùng mẫu trích transcript + từ khóa audio + kết luận (4–8 câu, ~80–150 từ). Mỗi bullet `-` trên **một dòng riêng**; `\n\n` giữa các khối. Không code fence.

### Block order

1. **Mở đầu + trích transcript** — chọn **một** mẫu:
   - **Ý chính / mục đích** (`main_idea`, `intent`, `why`): `Đoạn talk nói về **{chủ đề/mục đích}** nên …` hoặc `Thông báo nói về **…** nên …` (tóm tắt ngắn nội dung bài nói rồi nối lý do chọn đáp án).
   - **Chi tiết / câu cụ thể** (hầu hết câu còn lại): `Trong bài nói, câu "{english quote}" nghĩa là "{bản dịch tiếng Việt}", nên …` — cũng có thể mở bằng *Từ bài nói,* / *Trong đoạn talk,*.
2. **Từ khóa cần bắt trong audio** — dòng riêng: `**Từ khóa cần bắt trong audio:** **keyword 1**, **keyword 2**` — 1–3 cụm tiếng Anh (số, ngày, tên riêng) học viên **phải nghe được** trong audio để suy ra đáp án; bọc mỗi cụm trong `**…**`.
3. **Đáp án sai (tùy chọn)** — `- **A** sai vì …` cho 1–2 distractor quan trọng.
4. **Kết luận** — `→ **Đáp án đúng là C** vì …` (letter **must match** `correctOptionLabel`).

### `explanation.reference`

- **Nguyên văn** từ/cụm từ tiếng Anh từ `transcript` — **không** phải cả câu; chỉ cụm audio học viên cần bắt để suy ra đáp án.
- **1–3 phần tử** — mỗi phần tử là một keyword/phrase; khớp với các cụm trong dòng `**Từ khóa cần bắt trong audio:**`.
- Review mode sẽ **highlight** từng cụm trên transcript khi học viên mở giải thích.

### Example `reasoning` — mục đích / ý chính

```text
Đoạn talk nói về **thông báo lên máy bay sắp bắt đầu** — nhắc hành khách chuyến 482 tập trung tại **gate 12** trong **twenty minutes**, nên mục đích là báo hành khách chuẩn bị boarding.

**Từ khóa cần bắt trong audio:** **Boarding**, **gate 12**, **twenty minutes**.

→ **Đáp án đúng là B** vì thông báo nhắc **boarding will begin soon**.
```

`reference`: `["Boarding", "gate 12", "twenty minutes"]`

### Example `reasoning` — chi tiết

```text
Trong bài nói, câu "Passengers with small children may board first at gate 12." nghĩa là "Hành khách có trẻ nhỏ có thể lên máy bay trước tại cổng 12.", nên nhóm được ưu tiên lên trước là **passengers traveling with children**.

**Từ khóa cần bắt trong audio:** **small children**, **board first**.

- **C** sai vì không nhắc hành khách business class.

→ **Đáp án đúng là A** vì **small children** được **board first**.
```

`reference`: `["small children", "board first"]`

---

### Dạng câu (`skills`)

`main_idea`, `detail`, `infer`, `vocab_context`, `not_stated`, `speaker`, `place`, `problem`, `request`, `next`, `intent`, `graphic`, `reference`

### Trọng tâm (`focus`)

`who`, `what`, `why`, `how`, `time`, `number`, `location`

---

## Answer key

- Copy every `correctOptionLabel` **only** from `ANSWER_KEY_JSON.answers["{globalItemNumber}"]`.
- **Do not** read answers from PDF highlight color, circles, underlines, or other booklet markings.
- **Do not solve** from the transcript or override the attached key.
- Write explanations **for the key letter**; conclusion `→ **Đáp án đúng là X**` must use the **same** letter as that key label.

---

## QA gates (import rejects incomplete JSON)

| Check | Standard |
|-------|----------|
| `part` | `4` |
| Groups | **10** talks |
| Question count | **30** (10 × 3) |
| `globalItemNumber` | 71..100 |
| Every question | `hint`, `explanation`, `skills`, `focus` |
| Explanation match | `→ **Đáp án đúng là X**` letter matches `correctOptionLabel` |
| Evidence quote | `explanation.reference` = 1–3 verbatim keyword/phrase(s) from transcript (match audio keywords line) |
| Audio keywords | `reasoning` includes `**Từ khóa cần bắt trong audio:**` line |

---

## Validation checklist (before you return JSON)

- [ ] OCR on **all** Part 4 pages
- [ ] **`groups.length === 10`**
- [ ] **30 questions total**, 3 per group
- [ ] Every sentence in `transcript`, `prompt`, and `options[].text` ends with ` MICHAELTOEIC` (append only)
- [ ] Every group has non-empty `vocabulary[]` with context-aware definitions, US/UK `ipa`, and `example`
- [ ] `explanation.reasoning`: mở đầu trích transcript (mẫu *Đoạn talk nói về…* hoặc *câu "…" nghĩa là…*) → **Từ khóa cần bắt trong audio** → (tùy chọn) distractor bullets → `→ **Đáp án đúng là X**` (letter matches `correctOptionLabel`)
- [ ] `explanation.reference`: 1–3 verbatim English keyword/phrase(s) from transcript
- [ ] If `translations` present: every `english` row appears in `transcript`; order follows transcript
- [ ] Valid JSON, no markdown wrapper
