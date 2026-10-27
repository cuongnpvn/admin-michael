# Role

Align one official TOEIC **Listening Part 3 conversation audio** to **speaker turns**.

Return start/end times only. Do **not** transcribe, translate, invent, split, merge, drop, or reorder turns.

Return **only** valid JSON matching the API response schema — no markdown fences.

---

## Input

You receive:

1. **This instruction** (markdown).
2. **The conversation MP3** — one Part 3 group (e.g. questions 32–34).
3. **`TURN_EXPORT_JSON`** — the exact spoken turns already stored in the CMS.

```text
TURN_EXPORT_JSON:
{
  "questionId": "test-1-p3-q032",
  "turns": [
    { "index": 0, "english": "W: Hi Tom, have the office supplies been delivered yet?" },
    { "index": 1, "english": "M: Not yet, but they will arrive this afternoon." }
  ]
}
```

Rules:

- Copy `questionId` exactly.
- One output row per input `turns[]` row. Same `index`. Same `english` verbatim.
- A turn is one speaker line (`W:` / `M:` / `N:` / `A:` / `B:`).
- If one turn has two sentences, still **one** `{startSec, endSec}` covering the whole line.
- Printed labels (`W:` / `M:` / …) are **not spoken** — do not wait for someone to say the letter. Align every **spoken** word on that line.

---

## Cover the full spoken turn (do not skip openings)

`startSec` is the first audible word of that turn. `endSec` is the last audible word. Do **not** start in the middle of the line.

**Must include** (these are spoken and belong in the clip):

- Greetings and vocatives: `Hey, Oliver.` / `Hi Tom,` / `Excuse me, Sarah.`
- Name-calling / address at the start of a turn
- Interjections: `Oh,` / `Well,` / `Yeah,` / `Actually,`
- Every sentence on that same speaker line

**Fail example:** turn english is  
`W: Hey, Oliver. Did you see the focus group results for our new spicy cheddar cheese?`  
and `startSec` begins at “Did you…” — **wrong**. The mark must start at “Hey”.

**Pass example:** the same line — `startSec` at “Hey”, `endSec` after “cheese?” (or the last word on that turn).

---

## What to ignore in the audio (do not mark)

1. **Intro / booklet frame** — anything like:
   - “Questions 32 through 34 refer to the following conversation.”
   - “Now let us begin.” / part-direction speech before the first conversation turn
2. **Closing question block** — after the last conversation turn, ignore:
   - “Now you will hear the questions.”
   - numbered question stems and options A–D
   - any narrator speech about the questions

Only mark the **conversation body** (speakers talking to each other).

---

## Split rule — speaker turn, NOT sentence

- Do **not** split a turn into sentences.
- Do **not** invent extra turns that are not in `turns[]`.
- `turns.length` is the required `segments.length`.

---

## Output

```json
{
  "questionId": "test-1-p3-q032",
  "segments": [
    {
      "index": 0,
      "english": "W: Hi Tom, have the office supplies been delivered yet?",
      "startSec": 12.05,
      "endSec": 16.4
    },
    {
      "index": 1,
      "english": "M: Not yet, but they will arrive this afternoon.",
      "startSec": 16.65,
      "endSec": 21.2
    }
  ]
}
```

Rules:

- `segments.length` must equal `turns.length`
- `startSec < endSec` (seconds; decimals OK)
- monotonic: `endSec[i] <= startSec[i + 1]`
- all times `>= 0`
- first conversation turn usually starts **after** the intro (often not `0.00`)
- last conversation turn ends **before** the question-reading block
- pad slightly: start −0.15s, end +0.20s, without overlapping the next turn
