# Role

**Re-generate content vocabulary** for one TOEIC exam unit (listening group / reading question / passage set).

Use this when vocabulary was already produced during digitize / Part 7 process and you need to **overwrite** it (e.g. improve quality or add `example`).

Given English source text — transcript/script **or** passage(s) — plus questions and answer options, produce curated `vocabulary[]` for study use.

Return **only** valid JSON matching the API response schema — no markdown fences.

---

## Input

You receive:

1. **This instruction** (markdown).
2. **`CONTENT_VOCABULARY_EXPORT_JSON`** — one or more units with English source + questions/options (join keys included).

Focus on **content**, not inventing IDs — copy join keys (`questionId`, `groupId`, `setQuestionId`) exactly from the input.

### Attachment (where `vocabulary[]` belongs)

| Part | Attach `vocabulary[]` on | Source covers |
|------|--------------------------|---------------|
| Listening 1–2 | Each `question` (`questionId`) | Options; Part 2 also spoken question / transcript |
| Listening 3–4 | Each `group` (`groupId` + anchor `questionId`) | Transcript + that group's questions/options |
| Reading 5 | Each `question` (`questionId`) | Prompt + options |
| Reading 6–7 | Each passage set (anchor `questionId`) | Passages + questions/options (and answers when present) |

---

## Output shape

Return a JSON array (or `{ "units": [...] }`) with **one object per input unit**, same order, same join keys:

```json
[
  {
    "questionId": "test-1-p05-q101",
    "vocabulary": [
      {
        "term": "submitted",
        "definitionEn": "handed in formally (a report)",
        "meaningVi": "được nộp (báo cáo)",
        "level": "B1",
        "wordType": "verb",
        "ipa": ["/səbˈmɪtɪd/", "/səbˈmɪtɪd/"],
        "example": "The report will be submitted tomorrow."
      }
    ]
  }
]
```

Listening 3–4 example (include both keys from input):

```json
[
  {
    "groupId": "test-1-p03-g01",
    "questionId": "test-1-p03-q032",
    "vocabulary": [ ... ]
  }
]
```

---

## Word object

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
| `term` | Form as it appears in the source (or clear lemma when surface is inflected) |
| `definitionEn` | Meaning **closest to this context**; avoid a general dictionary gloss when context is clear |
| `meaningVi` | Vietnamese translation of `definitionEn` (same sense — do not invent a different meaning) |
| `level` | CEFR: `A1`, `A2`, `B1`, `B2`, or `C1` |
| `wordType` | Compact POS: `noun`, `verb`, `adj`, `adv`, `phr.v`, `prep`, `conj`, `pron`, … |
| `ipa` | Exactly **two** strings: **US first**, then UK (slash-wrapped IPA) |
| `example` | Short English sentence using the term in the **same word form / POS** as in the source. Inspired by the reference sentence where the term appears (transcript, passage, prompt, or option) — **re-phrase** that sentence simply; do not invent a new unrelated context. Keep the TOEIC sense from `definitionEn`. |

### Example guidance

- If the reference uses the term as a **noun**, the example should also use it as a noun (same for verb, adj, …).
- Prefer a light rephrase of the source sentence over a dictionary-style invented sentence.
- Keep examples short and learner-friendly (one clear sentence).

---

## Curation

- Prefer business / workplace / travel / finance terms that help TOEIC learners.
- Deduplicate by `term` (case-insensitive) within the same `vocabulary[]`.
- Skip pure proper names unless they are common study words (e.g. job titles used as nouns).
- Skip pure function words (`the`, `a`, `is`, …).
- Omit when the unit truly has no learnable content vocabulary (rare) — otherwise include at least a few useful terms.
- Copy join keys **exactly** from the input unit.
