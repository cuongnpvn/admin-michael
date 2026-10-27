> **Maintenance:** Tag/hint rules below are **inlined into each part prompt** (`reading-part-5.md`, `reading-part-5-tags.md`, `reading-part-6.md`, `reading-part-6-tags.md`, `reading-part-7-single.md`, `reading-part-7-multi.md`, `comprehension-question-tags.md`, `listening-part-3-process.md`, `listening-part-4.md`) with part-specific dạng câu tables. Edit this file first, then sync the matching section into those prompts. JSON uses English `value` slugs (`skills` / `focus` / `topic`); Vietnamese names belong in `chip_vi` only.

### Hint, explanation, and tags (required for every question)

After extracting each question, **generate** these metadata fields in **Vietnamese** (hints/explanations only — test content stays English).

#### `hint` (Vietnamese, 1–3 sentences)

- Strategy the learner should use **before** answering.
- Combine a generic tip for the **dạng câu** tag(s) + one cue from this question's prompt/options/passage.

#### `explanation` (object, required)

Vietnamese reasoning plus an English quote from the source text:

```json
{
  "reasoning": "…",
  "reference": [
    "Exact English sentence from the transcript or passage.",
    "Optional second sentence when multiple quotes support the answer."
  ]
}
```

- **`reference`**: JSON **array of strings** — each item is one verbatim English sentence from the transcript/passage. One sentence → one-element array. Legacy single-string values are still accepted at import and coerced to an array.

##### `explanation.reasoning` — Reading Part 6 (two formats)

Part 6: chọn **một mẫu** theo câu — **không** ghi tên dạng trong output.

- **Điền từ/cụm** (option ngắn): 1 câu mở đầu → 3 bullet riêng `- Chọn **X** là sai vì ...` (không gộp đáp án sai) → `→ **Đáp án phù hợp nhất là C** vì ...` → kiến thức (**Collocation**, **Từ vựng**, …).
- **Chèn câu** (option là cả câu): *Câu trước* `"..." →` dịch Việt / *Câu sau* `"..." →` dịch Việt → `**→ Đáp án X** "..."` → `→` lý do → **Vì sao các đáp án sai?** + **A.** **B.** **C.** (mỗi đáp án sai một dòng, không gộp)

Part 5: luôn dùng mẫu điền từ/cụm (tách `prompt` tại `-------` nếu cần trích cụm quanh blank).

**Example Part 6 — điền từ/cụm:**

```text
Chỗ trống cần một danh từ để hoàn thành cụm *collocation* *add ___ to your garden*.

- Chọn **A** là sai vì *add years* không phù hợp với ngữ cảnh làm đẹp khu vườn.
- Chọn **B** là sai vì *add space* không thực tế khi nói về việc thêm cây cảnh vào vườn.
- Chọn **D** là sai vì *add moisture* quá cụ thể và không phải lợi ích tổng quát của dịch vụ cảnh quan.

→ **Đáp án phù hợp nhất là C** vì *add beauty* là cụm từ tự nhiên, phù hợp ngữ cảnh quảng cáo dịch vụ cảnh quan.

Câu này cần sử dụng kiến thức của **Collocation**.
```

**Example Part 6 — chèn câu:** (see `reading-part-6.md` Format B)

Blank line (`\n\n`) giữa khối; mỗi `-` trên dòng riêng. Không code fence.

##### `explanation.reasoning` — Listening Parts 3–4

Vietnamese — nghe hiểu hội thoại / bài nói (4–8 câu, ~80–150 từ). Blank line (`\n\n`) giữa khối; mỗi `-` trên dòng riêng. Không code fence.

**Required structure:**

1. **Mở đầu + trích transcript** — Part 3: *Đoạn hội thoại nói về … nên …* (ý chính) hoặc *Trong hội thoại, câu "{english}" nghĩa là "{dịch}", nên …* (chi tiết). Part 4: *Đoạn talk nói về … nên …* / *Thông báo nói về …* hoặc *Trong bài nói, câu "{english}" nghĩa là "{dịch}", nên …*.
2. **Từ khóa audio** — `**Từ khóa cần bắt trong audio:** **kw1**, **kw2**` (1–3 cụm học viên phải nghe được).
3. **Đáp án sai (tùy chọn)** — `- **A** sai vì …` cho 1–2 distractor.
4. **Kết luận** — `→ **Đáp án đúng là C** vì …`

**`reference`:** 1–3 từ/cụm từ tiếng Anh **nguyên văn** từ transcript (khớp dòng **Từ khóa cần bắt trong audio**); không phải cả câu; không thêm nhãn `W:` / `M:` trừ khi là một phần của cụm. Review mode highlight từng cụm trên transcript.

**Example Part 3 — chi tiết:**

```text
Trong hội thoại, câu "We really need those printer cartridges before the client presentation tomorrow." nghĩa là "Chúng ta thực sự cần mực in trước buổi thuyết trình cho khách hàng ngày mai.", nên thời điểm cần hàng là **trước buổi thuyết trình**.

**Từ khóa cần bắt trong audio:** **before the client presentation**, **tomorrow**.

→ **Đáp án đúng là A** vì họ cần hàng **before a presentation**.
```

**Example Part 4 — mục đích:**

```text
Đoạn talk nói về **thông báo lên máy bay sắp bắt đầu** — nhắc hành khách tập trung tại **gate 12** trong **twenty minutes**, nên mục đích là báo hành khách chuẩn bị boarding.

**Từ khóa cần bắt trong audio:** **Boarding**, **gate 12**, **twenty minutes**.

→ **Đáp án đúng là B** vì thông báo nhắc **boarding will begin soon**.
```

##### `explanation.reasoning` — Reading Part 7

Vietnamese — translate the key evidence sentence, highlight attention keywords, explain distractors, conclude (4–8 câu, plain text or light Markdown).

**Required structure:**

1. **Mở đầu + dịch câu chứng cứ** — dùng một trong các mẫu: *Trong bài,* / *Vì* / *Từ bài đọc,* rồi trích câu tiếng Anh và dịch sang tiếng Việt: `{english sentence} nghĩa là {bản dịch tiếng Việt}.`
2. **Chi tiết then chốt** — nêu thêm manh mối từ form, tiêu đề, số liệu nếu cần; bọc **tên riêng, địa điểm, hành động, từ đồng nghĩa/collocation** trong `**…**`.
3. **Đáp án sai (tùy chọn)** — `- **A** sai vì …` cho 1–2 distractor quan trọng.
4. **Kết luận** — dòng bắt đầu bằng `→`, ví dụ: `→ **Đáp án đúng là C** vì …`

**`reference`:** luôn copy nguyên văn câu tiếng Anh trong đoạn văn (khớp với câu dịch ở bước 1). **Table / form / schedule evidence:** join visible cell texts with **spaces** (not `|` or `/`); to highlight an **entire table row**, include **all cells in that row** in one reference string (e.g. `"Delivery charge 350.00"`, not only `"Delivery charge"`).

**Example Part 7:**

```text
Trong bài, câu "Congratulations on your purchase of a Gregerson Pro Phone 13." nghĩa là "Chúc mừng bạn đã mua Gregerson Pro Phone 13." Form điền ghi **Terrence Furuta** tại **PNE Retailers, Winnipeg, Canada** — khớp người nhận thông báo.

- **A** sai vì không có thông tin ông ấy vừa chuyển đến Canada.
- **B** sai vì không có dấu hiệu dịch vụ đặc biệt bị lỗi kích hoạt.

→ **Đáp án đúng là C** vì Mr. Furuta vừa mua **Gregerson Pro Phone 13**.
```

Blank line (`\n\n`) giữa khối; mỗi `-` trên dòng riêng. Không code fence trong JSON output.

#### `tags` (required array — minimum 2 values)

**Required on every question** (Reading Parts 5–7; Listening Parts 3–4). The import schema **rejects** invalid tag sets.

**JSON must use English `value` slugs only** (column 1 below). Vietnamese labels are for hints/UI — do not put Vietnamese in `tags`.

Each question must include:

1. **One to three Dạng câu** (`skill` slugs) — grammar table for P5–6, comprehension table for P3–4/P7; Part 6 also allows `insert`
2. **One Trọng tâm** (`focus` slug) — grammar table for P5–6, comprehension table for P3–4/P7
3. **Zero or one Chủ đề** (`topic` slug) — optional metadata

Typical length = **2–4 tags**. Add a second or third skill only when the question genuinely tests multiple patterns (e.g. conditional + passive).

Schema source: `lib/content/toeic-tags.ts`

---

### Dimension 1 — Chủ đề (`topic`) — optional

Business / situational context. Pick **at most one** when obvious — **never invent** values (`retail`, `medical`, `community` are invalid). Omit topic when unclear.

| value | chip_vi | When / cues |
|-------|---------|-------------|
| `office` | Văn phòng | meeting, report, deadline, email, branch |
| `personnel` | Nhân sự | hiring, résumé, training, benefits, applicant |
| `purchasing` | Mua hàng | order, inventory, supplier, store |
| `finance` | Tài chính | invoice, budget, payment, fee, account |
| `travel` | Du lịch | flight, hotel, reservation, gate, itinerary |
| `dining` | Ẩm thực | restaurant, menu, catering, bistro |
| `property` | Bất động sản | building, maintenance, lease, parking |
| `manufacturing` | Sản xuất | factory, production, shipping, warehouse |
| `marketing` | Marketing | campaign, feedback, promotion, advertisement |
| `technology` | Công nghệ | software, computer, device, IT, digital |
| `health` | Y tế | hospital, clinic, pharmacy, patient |
| `event` | Sự kiện | conference, seminar, lecture, registration |
| `service` | Dịch vụ KH | complaint, refund, customer support |
| `general` | Chủ đề chung | newspaper, residents, public notice |

**Legacy aliases (auto-normalized on import):** `hr`→`personnel`, `shopping`/`retail`→`purchasing`, `facility`→`property`, `production`→`manufacturing`, `medical`→`health`, `community`/`media`/`others`→`general`.

---

### Dimension 2 — Dạng câu (`skill`)

Pick **1–3** dạng câu per question (primary skill first). Use the table that matches the part.

#### Grammar dạng câu — Reading Part 5; Part 6 except sentence insertion

| value | chip_vi | When / cues |
|-------|---------|-------------|
| `preposition` | Giới từ | Options are prepositions or fixed prep phrases |
| `word_form` | Từ loại | Same root, different POS (N/V/Adj/Adv) |
| `verb_tense` | Thì động từ | Verb tense/aspect (past, perfect, future) |
| `sv_agreement` | Hòa hợp CN–ĐT | Subject–verb number agreement |
| `conjunction` | Liên từ | Links clauses (`and`, `but`, `although`) — not if-clauses |
| `conditional` | Câu điều kiện | If-clauses, unless, provided that |
| `article` | Mạo từ | a / an / the / zero article |
| `comparison` | So sánh | -er/more, -est/most, less…than |
| `modal` | Động từ khuyết thiếu | can, must, should, may, might |
| `collocation` | Collocation | Fixed phrase (`status update`, `product line`) |
| `phrasal_verb` | Cụm động từ | call off, look into, fill out |
| `vocabulary` | Từ vựng | Different words, meaning drives answer |
| `pronoun` | Đại từ | Pronouns or possessives |
| `verb_pattern` | Cấu trúc V | `wish to V`, `will V`, gerund/infinitive |
| `relative_clause` | MĐ quan hệ | who, whom, whose, which, that |
| `passive` | Câu bị động | be + V-ed / passive voice |
| `quantifier` | Lượng từ | much/many, few/little, several |

**Part 6 also allows:** `insert` (sentence insertion — one per passage set).

**Part 5–6 decision tree:**

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
15. Full sentence insertion (Part 6 only)? → `insert`
16. Meaning-driven (not form)? → `vocabulary`

#### Comprehension dạng câu — Listening Part 3–4 / Reading Part 7

| value | chip_vi | When / cues |
|-------|---------|-------------|
| `main_idea` | Ý chính | mainly about, purpose, main topic |
| `detail` | Chi tiết | Wh- fact stated directly in text/audio |
| `infer` | Suy luận | imply, infer, most likely, suggest |
| `vocab_context` | Từ vựng ngữ cảnh | closest in meaning to |
| `not_stated` | NOT / không đề cập | NOT mentioned, is NOT true |
| `compare` | So sánh đoạn kép | both texts, double/triple passage |
| `insert` | Chèn câu | best belong, positions [1]–[4] |
| `organization` | Cấu trúc đoạn | overall structure, where sentence belongs |
| `reference` | Tham chiếu | pronoun/antecedent, this/that/they refers to |
| `speaker` | Người nói / vai trò | Who is speaking / job / role |
| `place` | Địa điểm | Where does this take place |
| `problem` | Vấn đề | What issue / difficulty is mentioned |
| `request` | Đề nghị / lời mời | Could you, Would you, invitation |
| `next` | Hành động tiếp | What will X do next |
| `intent` | Ý định người nói | Meaning of quoted line in context |
| `graphic` | Graphic | Look at the graphic (L3–4) |

**Comprehension decision tree:**

1. Prompt asks mainly about / purpose / topic? → `main_idea`
2. Prompt has NOT / NOT mentioned / is NOT true? → `not_stated`
3. Prompt asks closest in meaning to? → `vocab_context`
4. Prompt references two+ texts or both passages? → `compare`
5. Prompt asks where sentence best belongs? → `insert` or `organization`
6. Prompt asks what this/that/they refers to? → `reference`
7. Prompt has imply / infer / most likely / suggest? → `infer`
8. Prompt asks who / job / role? → `speaker`
9. Prompt asks where / location? → `place`
10. Prompt asks what problem / issue? → `problem`
11. Prompt asks what next / probably do? → `next`
12. Otherwise stated fact (when, how much, name)? → `detail`

**Legacy aliases:** `topic`→`main_idea`, `synonym`/`vocab`→`vocab_context`, `not_mentioned`/`not_true`→`not_stated`, `multi_passage`→`compare`, `sentence_insertion`→`insert`, `agreement`→`sv_agreement`, `articles`→`article`, `phrasal`→`phrasal_verb`.

---

### Dimension 3 — Trọng tâm (`focus`)

Pick **one** trọng tâm per question. Must be from the table matching the part.

#### Grammar trọng tâm — Reading Part 5–6

| value | chip_vi | When / cues |
|-------|---------|-------------|
| `time` | Thời gian | Dates, schedules, temporal prepositions |
| `location` | Nơi chốn | Spatial prepositions, place in sentence |
| `number` | Số liệu | Amounts, prices, counts |
| `purpose` | Mục đích | `so that`, in order to, goal linkage |
| `contrast` | Tương phản | `despite`, `rather than`, `but` |
| `phrase` | Cụm cố định | Multi-word answer (with `collocation`) |
| `pos` | Loại từ | Specific POS slot (with `word_form`) |
| `semantics` | Nghĩa từ | Meaning nuance (with `vocabulary`) |

#### Comprehension trọng tâm — Listening Part 3–4 / Reading Part 7

| value | chip_vi | When / cues |
|-------|---------|-------------|
| `who` | Ai (Who) | Person, role, who performs action |
| `what` | Cái gì (What) | Thing, content, subject matter |
| `why` | Vì sao (Why) | Reason, cause, purpose |
| `how` | Cách thức (How) | Method, manner, process |
| `time` | Thời gian | When — schedule, deadline |
| `number` | Số liệu | Price, quantity, count |
| `location` | Nơi chốn | Where — place (pairs with `place` skill) |

**Pairing rules (avoid import rejection):**

- Pick **1–3** dạng câu — add secondary skills only for compound questions (e.g. `conditional` + `passive`).
- Always add **one** trọng tâm even when dạng câu seems specific (`main_idea` + `why`, `detail` + `time`, `infer` + `what`).
- `speaker` skill → trọng tâm usually `who`; `place` skill → `location`; time fact → `time`; price/count → `number`.
- Topic is optional — do not force `general` if context is unclear.

---

### Tag generation workflow

1. Pick **1–3 dạng câu** slugs (grammar or comprehension table — match the part).
2. Pick **one trọng tâm** slug (grammar or comprehension table — match the part).
3. Optionally pick **one chủ đề** slug when context is clear.
4. Verify `tags.length >= 2`, at least one skill and one focus.
5. Write `hint` (Vietnamese): dạng câu strategy + trọng tâm cue + question-specific cue.
6. Write `explanation`: Vietnamese Markdown `reasoning` (Part 5–6 structured format) + English `reference`.

---

### Examples

| Part | tags | Notes |
|------|------|-------|
| Part 5 | `["preposition", "time"]` | No topic — valid |
| Part 5 | `["event", "preposition", "time"]` | Lecture — after which |
| Part 5 | `["conditional", "passive", "contrast"]` | Multi-skill compound |
| Part 5 | `["personnel", "relative_clause", "pos"]` | who/whom blank |
| Part 6 | `["property", "collocation", "phrase"]` | product line in passage |
| Part 6 | `["insert", "contrast"]` | Sentence insertion |
| Part 3 | `["office", "main_idea", "what"]` | Conversation topic |
| Part 7 | `["travel", "detail", "time"]` | Departure time |
| Part 7 | `["vocab_context", "what"]` | closest in meaning |
| Part 7 | `["not_stated", "what"]` | NOT mentioned |
| Part 7 | `["compare", "number", "finance"]` | Double passage — conflicting dates |
| Part 7 | `["reference", "what"]` | Pronoun antecedent |

**Invalid (rejected on import):**

- `["preposition"]` — missing trọng tâm
- `["retail", "grammar", "time"]` — invalid slug values
- `["detail", "infer", "what"]` — four skills (max 3)
- `["service", "detail", "problem"]` — `problem` is a skill, not a focus

**Do not** use comprehension dạng câu (`main_idea`, `detail`, `infer`, …) on Part 5 grammar blanks. Part 6 allows `insert` only for sentence-insertion questions.
