# Role

Align one official TOEIC **Listening Part 1 photograph audio** to the **four spoken statements**.

The audio is a narrator reading statements about one picture. There is no conversation and no second speaker.

Return start/end times only. Do **not** transcribe, translate, invent, split, merge, drop, or reorder lines.

Return **only** valid JSON matching the API response schema — no markdown fences.

---

## Input

You receive:

1. **This instruction** (markdown).
2. **The question MP3** — one Part 1 item (e.g. question 1).
3. **`SENTENCE_EXPORT_JSON`** — the exact spoken statements already stored in the CMS, in playback order (A, then B, then C, then D).

```text
SENTENCE_EXPORT_JSON:
{
  "questionId": "test-1-p1-q001",
  "sentences": [
    { "index": 0, "english": "The woman is carrying a tray of food." },
    { "index": 1, "english": "The woman is wearing a jacket." }
  ]
}
```

Rules:

- Copy `questionId` exactly.
- One output row per input `sentences[]` row. Same `index`. Same `english` verbatim.
- Each row is one complete statement. Do **not** split a statement into smaller sentences.
- There are **no** speaker labels (`W:` / `M:` / `A:`).

---

## Cover the full spoken statement

`startSec` is the first audible word of that statement. `endSec` is the last audible word. Do **not** start in the middle of the statement.

**Must include** every word of the stored `english`, including a short opening such as `Well,` if that word is part of the stored line.

---

## What to ignore in the audio (do not mark)

1. **Item number** — “Number 1.” / “Number one.”
2. **Picture direction** — “Look at the picture marked number 1 in your test book.” and any similar booklet frame before the first statement.
3. **Spoken letter labels** between statements, if they are spoken (`A`, `B`, `C`, `D`). The clip starts at the first word of the statement and ends at its last word, not on the letter.

Only mark the four stored statements.

---

## Split rule — one CMS line, NOT a new sentence split

- Do **not** split one stored statement into two marks, even if it contains more than one clause.
- Do **not** merge two statements into one mark.
- Do **not** invent extra lines that are not in `sentences[]`.
- `sentences.length` is the required `segments.length`.

---

## Output

```json
{
  "questionId": "test-1-p1-q001",
  "segments": [
    {
      "index": 0,
      "english": "The woman is carrying a tray of food.",
      "startSec": 4.2,
      "endSec": 6.85
    },
    {
      "index": 1,
      "english": "The woman is wearing a jacket.",
      "startSec": 7.4,
      "endSec": 9.55
    }
  ]
}
```

Rules:

- `segments.length` must equal `sentences.length`
- `startSec < endSec` (seconds; decimals OK)
- monotonic: `endSec[i] <= startSec[i + 1]`
- all times `>= 0`
- the first statement usually starts **after** the number and picture direction (often not `0.00`)
- pad slightly: start −0.15s, end +0.20s, without overlapping the next statement
