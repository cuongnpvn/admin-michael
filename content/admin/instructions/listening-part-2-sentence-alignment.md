# Role

Align one official TOEIC **Listening Part 2 question-response audio** to the **spoken lines**.

The audio is a narrator reading one question (or statement), then three short responses. There is no conversation between two people.

Return start/end times only. Do **not** transcribe, translate, invent, split, merge, drop, or reorder lines.

Return **only** valid JSON matching the API response schema — no markdown fences.

---

## Input

You receive:

1. **This instruction** (markdown).
2. **The question MP3** — one Part 2 item (e.g. question 7).
3. **`SENTENCE_EXPORT_JSON`** — the exact spoken lines already stored in the CMS, in playback order: the question first, then response A, response B, and response C.

```text
SENTENCE_EXPORT_JSON:
{
  "questionId": "test-1-p2-q007",
  "sentences": [
    { "index": 0, "english": "Where is the conference being held?" },
    { "index": 1, "english": "A three-day vacation." },
    { "index": 2, "english": "At the Riverview Hotel." },
    { "index": 3, "english": "In the supply cabinet." }
  ]
}
```

Rules:

- Copy `questionId` exactly.
- One output row per input `sentences[]` row. Same `index`. Same `english` verbatim.
- Index 0 is the question. The following rows are the responses, in order.
- Each row is one complete spoken line. Do **not** split a line into smaller sentences.
- There are **no** speaker labels (`W:` / `M:`).

---

## Cover the full spoken line

`startSec` is the first audible word of that line. `endSec` is the last audible word. Do **not** start in the middle of the line.

**Must include** every word of the stored `english`, including a short opening such as `Well,` or `Oh,` when that word is part of the stored line.

The question line includes the full question, not only the last few words.

---

## What to ignore in the audio (do not mark)

1. **Item number** — “Number 7.” / “Number seven.”
2. **Spoken letter labels** between the question and the responses, if they are spoken (`A`, `B`, `C`). The clip starts at the first word of the stored line and ends at its last word, not on the letter.
3. Any silence or tone between lines. Do not extend a clip across the next line.

Only mark the stored lines.

---

## Split rule — one CMS line, NOT a new sentence split

- Do **not** split the question and a response into one mark.
- Do **not** split one stored line into two marks.
- Do **not** invent extra lines that are not in `sentences[]`.
- `sentences.length` is the required `segments.length`.

---

## Output

```json
{
  "questionId": "test-1-p2-q007",
  "segments": [
    {
      "index": 0,
      "english": "Where is the conference being held?",
      "startSec": 2.15,
      "endSec": 4.4
    },
    {
      "index": 1,
      "english": "A three-day vacation.",
      "startSec": 5.55,
      "endSec": 7.1
    }
  ]
}
```

Rules:

- `segments.length` must equal `sentences.length`
- `startSec < endSec` (seconds; decimals OK)
- monotonic: `endSec[i] <= startSec[i + 1]`
- all times `>= 0`
- the question usually starts **after** the item number (often not `0.00`)
- pad slightly: start −0.15s, end +0.20s, without overlapping the next line
