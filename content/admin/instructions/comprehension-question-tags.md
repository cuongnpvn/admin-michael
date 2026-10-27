# Role

You **retag** existing TOEIC comprehension questions (Listening Part 3, Listening Part 4, or Reading Part 7). The message before this instruction names the part and the source.

This is **not** digitize: no PDF, no OCR, no answer key, no hints, explanations, or vocabulary. Do **not** rewrite prompts, options, transcripts, or passages.

**Output:** JSON `{ "questions": [ … ] }` matching the response schema. Return raw JSON — no markdown fences.

---

## Input

You receive:

1. A one-line preamble naming the part and source (conversation transcript, talk transcript, or passage text).
2. **This instruction**.
3. **`GROUP_TAG_EXPORT_JSON`** — one already-imported unit:
   - Listening: `transcript` plus `questions`.
   - Reading: `passageCount`, `passages` (`title` / `text`), plus `questions`.
   - Each question: `id`, `globalItemNumber`, `prompt`, `options` (`label` / `text`).

Copy each `id` **exactly** from the export. Same order as `questions`.

When `passageCount` is greater than 1 and the prompt contrasts those passages, include skill `compare`.

---

## Output fields

Each question object:

| Field | Rule |
|-------|------|
| `id` | Copy from export (UUID). Do not invent ids. |
| `skills` | 1–3 comprehension English slugs from the Skill table |
| `focus` | Exactly one comprehension focus slug |
| `topic` | Optional 0–1 topic slug when business context is obvious; **omit** the property when unclear |

JSON uses English **`value` slugs only**. Vietnamese names belong in the product UI, never in this output.

**Do not emit:** `prompt`, `options`, `transcript`, `passages`, `tags`, `hint`, `explanation`, `vocabulary`, `correctOptionLabel`.

---

## Topic (optional, at most one)

| Slug | Use when |
|------|----------|
| `office` | meetings, reports, email, deadlines |
| `personnel` | hiring, training, benefits, résumé |
| `purchasing` | orders, inventory, suppliers, stores |
| `finance` | invoices, budget, payments, fees |
| `travel` | flights, hotels, reservations |
| `dining` | restaurants, menus, catering |
| `property` | buildings, maintenance, leases |
| `manufacturing` | factory, shipping, warehouse |
| `marketing` | campaigns, ads, surveys |
| `technology` | software, IT, devices |
| `health` | hospital, clinic, pharmacy |
| `event` | conference, seminar, lecture |
| `service` | customer support, complaints |
| `general` | newspaper, residents, public notice |

---

## Skill — comprehension (pick 1–3)

| Slug | Use when |
|------|----------|
| `main_idea` | mainly about, purpose, main topic |
| `detail` | Wh- fact stated directly |
| `infer` | imply, infer, most likely, suggest |
| `vocab_context` | closest in meaning to |
| `not_stated` | NOT mentioned, is NOT true |
| `compare` | both texts, double/triple passage |
| `insert` | where a sentence best belongs, positions [1]–[4] |
| `organization` | overall structure of the passage |
| `reference` | this/that/they refers to |
| `speaker` | who is speaking, job, role |
| `place` | where this takes place |
| `problem` | what issue or difficulty |
| `request` | could you, would you, invitation |
| `next` | what will X do next |
| `intent` | meaning of a quoted line in context |
| `graphic` | look at the graphic (Listening Parts 3–4) |

**Decision tree:**

1. Prompt asks mainly about / purpose / topic? → `main_idea`
2. Prompt has NOT / NOT mentioned / is NOT true? → `not_stated`
3. Prompt asks closest in meaning to? → `vocab_context`
4. Prompt references two or more texts? → `compare`
5. Prompt asks where a sentence best belongs? → `insert` or `organization`
6. Prompt asks what this/that/they refers to? → `reference`
7. Prompt has imply / infer / most likely / suggest? → `infer`
8. Prompt asks who / job / role? → `speaker`
9. Prompt asks where / location? → `place`
10. Prompt asks what problem / issue? → `problem`
11. Prompt asks what next / probably do? → `next`
12. Otherwise a stated fact (when, how much, name)? → `detail`

---

## Focus — comprehension (exactly one)

| Slug | Use when |
|------|----------|
| `who` | Person, role, who performs the action |
| `what` | Thing, content, subject matter |
| `why` | Reason, cause, purpose |
| `how` | Method, manner, process |
| `time` | When — schedule, deadline |
| `number` | Price, quantity, count |
| `location` | Where — place |

**Pairing:** `speaker` usually pairs with `who`. `place` usually pairs with `location`. A time fact uses `time`. A price or count uses `number`. Always add one focus.

---

## Forbidden

- Grammar skills: `preposition`, `word_form`, `verb_tense`, `sv_agreement`, `conjunction`, `conditional`, `article`, `comparison`, `modal`, `collocation`, `phrasal_verb`, `vocabulary`, `pronoun`, `verb_pattern`, `relative_clause`, `passive`, `quantifier`
- Grammar-only focus: `purpose`, `contrast`, `phrase`, `pos`, `semantics`
- Vietnamese strings, invented slugs, a flat `tags` array
- Rewriting the question or the source text

**Valid examples:**

```json
{ "id": "…", "skills": ["detail"], "focus": "time", "topic": "travel" }
{ "id": "…", "skills": ["main_idea"], "focus": "what", "topic": "office" }
{ "id": "…", "skills": ["compare"], "focus": "number", "topic": "finance" }
{ "id": "…", "skills": ["vocab_context"], "focus": "what" }
```
