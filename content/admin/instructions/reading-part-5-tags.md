# Role

You **retag** existing TOEIC Reading Part 5 questions. Stems and options are already imported English text. Write **English enum slugs only** for grammar tagging.

This is **not** digitize: no PDF, no OCR, no answer key, no hints, explanations, or vocabulary. Do **not** rewrite `prompt` or options.

**Output:** JSON `{ "questions": [ … ] }` matching the response schema. Return raw JSON — no markdown fences.

---

## Input

You receive:

1. **This instruction** (markdown).
2. **`PART5_TAG_EXPORT_JSON`** — already-imported questions: `id`, `globalItemNumber`, `prompt`, `options` (`label` / `text`).

Copy each `id` **exactly** from the export. Same order as the input array.

---

## Output fields

Each question object:

| Field | Rule |
|-------|------|
| `id` | Copy from export (UUID). Do not invent ids. |
| `skills` | 1–3 grammar English slugs from the Skill table |
| `focus` | Exactly one grammar focus slug |
| `topic` | Optional 0–1 topic slug when office/business context is obvious; **omit** the property when unclear |

JSON uses English **`value` slugs only**. Vietnamese names (`chip_vi`, e.g. “Câu bị động”) belong in the product UI, never in this output.

**Do not emit:** `prompt`, `options`, `tags`, `hint`, `explanation`, `vocabulary`, `correctOptionLabel`.

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

## Skill — grammar (pick 1–3)

| Slug | Use when |
|------|----------|
| `preposition` | Prepositions or fixed prep phrases |
| `word_form` | Choose N/V/Adj/Adv form |
| `verb_tense` | Verb tense or aspect |
| `sv_agreement` | Subject–verb agreement |
| `conjunction` | Clause links (not if-clauses) |
| `conditional` | If-clauses, unless |
| `article` | a / an / the / zero article |
| `comparison` | -er/more, -est/most |
| `modal` | can, must, should, may |
| `collocation` | Fixed phrase |
| `phrasal_verb` | call off, look into, etc. |
| `vocabulary` | Meaning choice, not word form |
| `pronoun` | Pronouns or possessives |
| `verb_pattern` | gerund/infinitive patterns |
| `relative_clause` | who, whom, whose, which, that |
| `passive` | be + V-ed / passive voice |
| `quantifier` | much/many, few/little |

**Part 5 decision tree:**

1. Options same POS family? → `word_form`, `verb_tense`, or `verb_pattern`
2. Subject–verb mismatch trap? → `sv_agreement`
3. Options are prepositions? → `preposition`
4. Options are conjunctions (not if-clauses)? → `conjunction`
5. If-clause / unless / provided that? → `conditional`
6. a/an/the options? → `article`
7. -er/more/most options? → `comparison`
8. Modal verbs (can/must/should)? → `modal`
9. Blank after `to`, `will`, modal? → `verb_pattern`
10. Options include who/whom/whose/which/that? → `relative_clause`
11. Passive structure (be + V-ed)? → `passive`
12. Phrasal verb options? → `phrasal_verb`
13. Fixed phrase answer? → `collocation`
14. much/many/few/little? → `quantifier`
15. Meaning-driven (not form)? → `vocabulary`

---

## Focus — grammar (exactly one)

| Slug | Use when |
|------|----------|
| `time` | Dates, schedules, temporal prepositions |
| `location` | Spatial prepositions |
| `number` | Amounts, prices, counts |
| `purpose` | so that, goal/reason |
| `contrast` | despite, rather than, concession |
| `phrase` | Multi-word answer unit |
| `pos` | Specific part-of-speech slot |
| `semantics` | Meaning/nuance choice |

---

## Forbidden

- Comprehension skills: `main_idea`, `detail`, `infer`, `vocab_context`, `not_stated`, `compare`, `insert`, `organization`, `reference`, `speaker`, `place`, `problem`, `request`, `next`, `intent`, `graphic`
- Comprehension-only focus: `who`, `what`, `why`, `how` (grammar `time` / `location` / `number` are allowed)
- Vietnamese strings, invented slugs, a flat `tags` array
- Rewriting the stem or options

**Valid examples:**

```json
{ "id": "…", "skills": ["preposition"], "focus": "time" }
{ "id": "…", "skills": ["preposition"], "focus": "time", "topic": "event" }
{ "id": "…", "skills": ["conditional", "passive"], "focus": "contrast" }
```
