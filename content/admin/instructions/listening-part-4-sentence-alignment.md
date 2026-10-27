# Role

Align one official TOEIC **Listening Part 4 talk audio** to **spoken sentences**.

The audio is a **monologue**: one speaker giving a talk, announcement, speech, recorded message, or news report. There are no conversation turns.

Return start/end times only. Do **not** transcribe, translate, invent, split, merge, drop, or reorder sentences.

Return **only** valid JSON matching the API response schema — no markdown fences.

---

## Input

You receive:

1. **This instruction** (markdown).
2. **The talk MP3** — one Part 4 group (e.g. questions 71–73).
3. **`SENTENCE_EXPORT_JSON`** — the exact spoken sentences already stored in the CMS.

```text
SENTENCE_EXPORT_JSON:
{
  "questionId": "test-1-p4-q071",
  "sentences": [
    { "index": 0, "english": "Attention passengers on flight 482 to Singapore." },
    { "index": 1, "english": "Boarding will begin in twenty minutes at Gate 12." }
  ]
}
```

Rules:

- Copy `questionId` exactly.
- One output row per input `sentences[]` row. Same `index`. Same `english` verbatim.
- A sentence is one spoken sentence of the talk. There are **no** speaker labels (`W:` / `M:`).
- Do **not** wait for a second speaker. One person continues through every sentence.

---

## Cover the full spoken sentence (do not skip openings)

`startSec` is the first audible word of that sentence. `endSec` is the last audible word. Do **not** start in the middle of the sentence.

**Must include** (these are spoken and belong in the clip):

- Openings and vocatives: `Good morning.` / `Hello everyone.` / `Attention passengers.`
- Name-calling / address at the start of a sentence
- Interjections: `Well,` / `Now,` / `First,` / `Finally,`
- Every word on that sentence

**Fail example:** sentence english is  
`Good morning. Thank you for joining today's briefing.`  
treated as two marks, or `startSec` begins at “Thank you…” when the stored sentence starts at “Good morning” — **wrong**.

**Pass example:** stored sentence is  
`Attention passengers on flight 482 to Singapore.`  
— `startSec` at “Attention”, `endSec` after “Singapore.”

---

## What to ignore in the audio (do not mark)

1. **Intro / booklet frame** — anything like:
   - “Questions 71 through 73 refer to the following talk.”
   - “Questions 71 through 73 refer to the following announcement.”
   - “Questions 71 through 73 refer to the following speech.”
   - “Now let us begin.” / part-direction speech before the first talk sentence
2. **Closing question block** — after the last talk sentence, ignore:
   - “Now you will hear the questions.”
   - numbered question stems and options A–D
   - any narrator speech about the questions

Only mark the **talk body** (the one speaker delivering the talk).

---

## Split rule — sentence, NOT paragraph, NOT speaker turn

- Do **not** merge sentences into a paragraph mark.
- Do **not** wait for a speaker change; there is only one speaker.
- Do **not** invent extra sentences that are not in `sentences[]`.
- `sentences.length` is the required `segments.length`.

---

## Output

```json
{
  "questionId": "test-1-p4-q071",
  "segments": [
    {
      "index": 0,
      "english": "Attention passengers on flight 482 to Singapore.",
      "startSec": 12.05,
      "endSec": 16.4
    },
    {
      "index": 1,
      "english": "Boarding will begin in twenty minutes at Gate 12.",
      "startSec": 16.65,
      "endSec": 21.2
    }
  ]
}
```

Rules:

- `segments.length` must equal `sentences.length`
- `startSec < endSec` (seconds; decimals OK)
- monotonic: `endSec[i] <= startSec[i + 1]`
- all times `>= 0`
- first talk sentence usually starts **after** the intro (often not `0.00`)
- last talk sentence ends **before** the question-reading block
- pad slightly: start −0.15s, end +0.20s, without overlapping the next sentence
