# Role

You **retag** existing TOEIC Listening Part 2 questions. The spoken line is already imported. Write **one question-type slug** and, only when the line names a place, **one topic slug**.

This is **not** digitize: no PDF, no audio, no answer key, no hints, explanations, or vocabulary. Do **not** rewrite `transcript`.

**Output:** JSON `{ "questions": [ … ] }` matching the response schema. Return raw JSON — no markdown fences.

---

## Input

You receive:

1. **This instruction** (markdown).
2. **`PART2_TAG_EXPORT_JSON`** — questions: `id`, `globalItemNumber`, `transcript` (the spoken line only).

Copy each `id` **exactly** from the export. Same order as the input array. Classify from `transcript` only — response choices are not included.

---

## Output fields

Each question object:

| Field | Rule |
|-------|------|
| `id` | Copy from export (UUID). Do not invent ids. |
| `tags` | Exactly one question-type slug from the closed list below |
| `topic` | Optional. One slug from the topic table. **Omit the property** when the line does not name a place |

**Do not emit:** `transcript`, `prompt`, `options`, `hint`, `explanation`, `vocabulary`, `correctOptionLabel`, `general`.

---

## Part 2 tags (closed list — exactly one slug)

**Allowed values only:**
`yes_no` · `choice` · `why` · `tag_question` · `what` · `which` · `request` · `who` · `when` · `declarative` · `how` · `where`

**Never invent tags.** Do **not** use modal verbs (`would`, `could`, `should`), WH words with punctuation (`where?`), or Part 3–7 slugs (`main_idea`, `detail`, …).

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

**Decision order:** tag_question → choice (has ` or `) → WH-word → request → yes_no → declarative.

**Examples**

| Spoken line | slug |
|-------------|------|
| Will you order the pasta or the chicken? | `choice` |
| Would you like the report e-mailed or printed out? | `choice` |
| When's the bus going to be here? | `when` |
| The tour starts at noon today, doesn't it? | `tag_question` |
| Let's take a taxi to the airport. | `request` |
| Dr. Molina sees patients in her Middleville office. | `declarative` |

## Topic (optional, at most one)

Use a topic only when `transcript` names the setting. A bare "When…?" or "Who…?" gets **no** topic. Do **not** use `general` to fill the field.

| Slug | Use when the spoken line mentions |
|------|-----------------------------------|
| `office` | Meeting, report, email, computer, accounting, database |
| `personnel` | Hiring, training, retirement, intern |
| `travel` | Flight, train, taxi, hotel, ticket |
| `dining` | Restaurant, lunch, menu |
| `purchasing` | Store, order, supplies, warehouse, shipping |
| `property` | Building, repair, windows, parking |
| `event` | Conference, workshop, party, concert |

Do **not** use `marketing`, `health`, `service`, `technology`, `finance`, or `manufacturing`. A software or expense line is `office`. A warehouse line is `purchasing`.

**Valid examples:**

```json
{ "id": "…", "tags": ["when"] }
{ "id": "…", "tags": ["where"], "topic": "event" }
```
