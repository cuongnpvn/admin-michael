# Role

You **retag** existing TOEIC Reading Part 6 questions. Passage text and questions are already imported English. Write **English enum slugs only**.

This is **not** digitize: no PDF, no OCR, no answer key, no hints, explanations, or vocabulary. Do **not** rewrite prompts, options, or passages.

**Output:** JSON `{ "questions": [ … ] }` matching the response schema. Return raw JSON — no markdown fences.

---

## Input

You receive:

1. **This instruction**.
2. **`GROUP_TAG_EXPORT_JSON`** — one passage set: `passageCount`, `passages` (`title` / `text`), and `questions` (`id`, `globalItemNumber`, `prompt`, `options` with `label` / `text`).

Copy each `id` **exactly** from the export. Same order as `questions`.

One question in the set is often sentence insertion (`insert`). The others are grammar or vocabulary blanks.

---

## Output fields

Each question object:

| Field | Rule |
|-------|------|
| `id` | Copy from export (UUID). Do not invent ids. |
| `skills` | 1–3 grammar English slugs, or `insert` for the sentence-insertion item |
| `focus` | Exactly one grammar focus slug |
| `topic` | Optional 0–1 topic slug when business context is obvious; **omit** the property when unclear |

JSON uses English **`value` slugs only**. Vietnamese names belong in the product UI, never in this output.

**Do not emit:** `prompt`, `options`, `passages`, `tags`, `hint`, `explanation`, `vocabulary`, `correctOptionLabel`.

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

## Skill — grammar, plus insert (pick 1–3)

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
| `insert` | The options are full sentences to place in the passage |

Use `insert` only for the sentence-insertion question. Do not combine `insert` with a grammar skill unless the item truly tests both.

**Decision tree:**

1. Options are full sentences for a blank in the passage? → `insert`
2. Options same POS family? → `word_form`, `verb_tense`, or `verb_pattern`
3. Subject–verb mismatch trap? → `sv_agreement`
4. Options are prepositions? → `preposition`
5. Options are conjunctions (not if-clauses)? → `conjunction`
6. If-clause / unless / provided that? → `conditional`
7. a/an/the options? → `article`
8. -er/more/most options? → `comparison`
9. Modal verbs? → `modal`
10. Blank after `to`, `will`, modal? → `verb_pattern`
11. who/whom/whose/which/that? → `relative_clause`
12. Passive structure? → `passive`
13. Phrasal verb options? → `phrasal_verb`
14. Fixed phrase answer? → `collocation`
15. much/many/few/little? → `quantifier`
16. Meaning-driven (not form)? → `vocabulary`

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

Sentence insertion still needs one focus. Use `contrast` when the inserted sentence opposes the neighbors, otherwise the focus that matches the link (`purpose`, `time`, `phrase`, …).

---

## Forbidden

- Comprehension skills other than `insert`: `main_idea`, `detail`, `infer`, `vocab_context`, `not_stated`, `compare`, `organization`, `reference`, `speaker`, `place`, `problem`, `request`, `next`, `intent`, `graphic`
- Comprehension-only focus: `who`, `what`, `why`, `how`
- Vietnamese strings, invented slugs, a flat `tags` array
- Rewriting the passage or the questions

**Valid examples:**

```json
{ "id": "…", "skills": ["collocation"], "focus": "phrase", "topic": "property" }
{ "id": "…", "skills": ["insert"], "focus": "contrast" }
{ "id": "…", "skills": ["word_form"], "focus": "pos" }
```
