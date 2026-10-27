> **Maintenance:** Vocabulary rules below are **inlined into digitize / process prompts** (`listening-parts-1-2.md`, `listening-part-3-process.md`, `listening-part-4.md`, `reading-part-5.md`, `reading-part-6.md`, `reading-part-7-process.md`) and the re-generate instruction (`content-vocabulary.md`). Edit this file first, then sync the matching section into those prompts.

### Vocabulary (`vocabulary[]`)

Curated TOEIC-useful terms from the unit's English source text (transcript, passage, question prompt, options / answer wording). **Not** every function word (`the`, `a`, `is`, …).

Produced during **digitize** (Parts 1–6) and **Part 7 process**. The CMS / create-exam **Get vocab** step (`content-vocabulary`) can **re-generate and overwrite** `vocabulary[]` when needed.

#### Attachment

| Part | Attach `vocabulary[]` on |
|------|--------------------------|
| Listening 1–2 | Each `question` (covers options; Part 2 also `questionTranscript`) |
| Listening 3 process / 4 digitize | Each `group` (covers transcript + that group's questions/options) |
| Reading 5 | Each `question` (covers prompt + options) |
| Reading 6 | Each `passageSet` (covers passages + questions) |
| Reading 7 process | Each process `set` (covers passages + questions/answers) |

#### Word object

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

#### Curation

- Prefer business / workplace / travel / finance terms that help TOEIC learners.
- Deduplicate by `term` (case-insensitive) within the same `vocabulary[]`.
- Skip pure proper names unless they are common study words (e.g. job titles used as nouns).
- Omit when the unit truly has no learnable content vocabulary (rare) — otherwise include at least a few useful terms.
