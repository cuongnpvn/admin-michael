# Role

**Process Part 3** — enrich one extracted conversation group for study use.

Given English transcript + questions (no answers yet), produce:

1. **Study enrichment** — answer, spoiler-free hint, explanation + audio-keyword references
2. **Question tags** — `skills`, `focus`, optional `topic` slug
3. **Curated `vocabulary[]`** — terms from transcript + questions/options for this group

Return **only** valid JSON matching the API response schema — no markdown fences.

Do **not** produce transcript Vietnamese translations here (that is a separate translation step).

---

## Input

You receive:

1. **This instruction** (markdown).
2. **`EXTRACTED_PART3_EXPORT_JSON`** — one conversation group with English transcript + questions (no answers yet).
3. **`ANSWER_KEY_JSON`** — authoritative answers from the database for the questions in this group. **Do not solve from the transcript; copy letters from the key.**

Focus on **content**, not IDs — the system attaches join keys in code.

```text
EXTRACTED_PART3_EXPORT_JSON:
[{
  "transcript": "W: Hi Tom, have the office supplies been delivered yet?\nM: Not yet, but they will arrive this afternoon.",
  "questions": [
    {
      "globalItemNumber": 32,
      "prompt": "What are the speakers mainly discussing?",
      "options": [
        { "label": "A", "text": "..." },
        { "label": "B", "text": "..." },
        { "label": "C", "text": "..." },
        { "label": "D", "text": "..." }
      ]
    },
    {
      "globalItemNumber": 33,
      "prompt": "When will the supplies arrive?",
      "options": [
        { "label": "A", "text": "..." },
        { "label": "B", "text": "..." },
        { "label": "C", "text": "..." },
        { "label": "D", "text": "..." }
      ]
    },
    {
      "globalItemNumber": 34,
      "prompt": "What will the man probably do next?",
      "options": [
        { "label": "A", "text": "..." },
        { "label": "B", "text": "..." },
        { "label": "C", "text": "..." },
        { "label": "D", "text": "..." }
      ]
    }
  ]
}]
```

Rules:

- Output **one group** in `groups[]` for this input.
- `questions.length` must match the input **exactly** (same order) — Part 3 groups always have **3** questions.
- Use the full `transcript` as evidence when writing explanations.

---

## Output

```json
{
  "groups": [
    {
      "topic": "Office supplies order",
      "vocabulary": [
        {
          "term": "cartridges",
          "definitionEn": "replaceable ink containers for a printer",
          "meaningVi": "hộp mực (máy in)",
          "level": "B1",
          "wordType": "noun",
          "ipa": ["/ˈkɑːrtrɪdʒɪz/", "/ˈkɑːtrɪdʒɪz/"],
          "example": "We need to order new ink cartridges for the office printer."
        }
      ],
      "questions": [
        {
          "correctOptionLabel": "A",
          "hint": "Nghe phần mở đầu để nắm chủ đề chung — đừng chọn đáp án chỉ nhắc một chi tiết phụ.",
          "explanation": {
            "reasoning": "Đoạn hội thoại nói về **đơn hàng văn phòng phẩm chưa giao** — người phụ nữ hỏi hàng đã tới chưa, người đàn ông nói nhà cung cấp sẽ giao **this afternoon**, nên chủ đề chính là lô hàng bị trễ.\n\n**Từ khóa cần bắt trong audio:** **Not yet**, **delivered this afternoon**, **office supplies**.\n\n→ **Đáp án đúng là A** vì hai người bàn về **a delayed delivery**.",
            "reference": ["Not yet", "delivered this afternoon", "office supplies"]
          },
          "skills": ["main_idea"],
          "focus": "what",
          "topic": "office"
        }
      ]
    }
  ]
}
```

### Fields

| Field | Rule |
|-------|------|
| `topic` | Short English CMS label for the conversation, ~2–6 words (e.g. `"Office supplies order"`). Concrete — not a single vague word like `"conversation"`. |
| `vocabulary` | Curated TOEIC terms from this group's transcript + questions/options — see Vocabulary below. |
| `questions[]` | Same length/order as input. Each item: `correctOptionLabel`, `hint`, `explanation`, `skills`, `focus`, optional `topic`. |

---

## Vocabulary (`vocabulary[]`)

On **every** process group — terms from transcript, prompts, and options. Not every function word.

```json
{
  "term": "cartridges",
  "definitionEn": "replaceable ink containers for a printer",
  "meaningVi": "hộp mực (máy in)",
  "level": "B1",
  "wordType": "noun",
  "ipa": ["/ˈkɑːrtrɪdʒɪz/", "/ˈkɑːtrɪdʒɪz/"],
  "example": "We need to order new ink cartridges for the office printer."
}
```

| Field | Rule |
|-------|------|
| `term` | Form as in the source (or clear lemma when inflected) |
| `definitionEn` | Meaning **closest to this context**; avoid a general dictionary gloss when context is clear |
| `meaningVi` | Vietnamese translation of `definitionEn` (same sense) |
| `level` | `A1` \| `A2` \| `B1` \| `B2` \| `C1` |
| `wordType` | Compact POS: `noun`, `verb`, `adj`, `adv`, `phr.v`, … |
| `ipa` | Exactly **two** strings: **US first**, then UK |
| `example` | Short English sentence using the term in the **same word form / POS** as in the source. Inspired by the reference sentence (re-phrase simply); keep the TOEIC sense from `definitionEn`. |

Deduplicate by `term` (case-insensitive) within the group.

---

## Answer, hint, explanation

### `correctOptionLabel`

- Copy from `ANSWER_KEY_JSON.answers["{globalItemNumber}"]` for each input question.
- Exactly one of `A` | `B` | `C` | `D` from that question’s `options`.
- **Do not solve** or override the attached key.
- Do not invent options.

### `hint` (Vietnamese, 1–3 sentences)

- Strategy **before** answering (question type + one cue from prompt/transcript).
- **Spoiler-free:** never name the answer letter (`chọn C`, `đáp án B`, etc.).

### `explanation`

Part 3 là **nghe hội thoại** — dùng mẫu trích transcript + từ khóa audio + kết luận (4–8 câu, ~80–150 từ). Mỗi bullet `-` trên **một dòng riêng**; `\n\n` giữa các khối. Không code fence.

#### Block order

1. **Mở đầu + trích transcript** — chọn **một** mẫu:
   - **Ý chính / chủ đề** (`main_idea`, `what`, `problem`): `Đoạn hội thoại nói về **{chủ đề}** nên …` (tóm tắt ngắn nội dung hội thoại rồi nối lý do chọn đáp án).
   - **Chi tiết / câu cụ thể** (hầu hết câu còn lại): `Trong hội thoại, câu "{english quote}" nghĩa là "{bản dịch tiếng Việt}", nên …` — cũng có thể mở bằng *Từ hội thoại,* / *Trong đoạn hội thoại,*.
2. **Từ khóa cần bắt trong audio** — dòng riêng: `**Từ khóa cần bắt trong audio:** **keyword 1**, **keyword 2**` — 1–3 cụm tiếng Anh (hoặc số/ngày) học viên **phải nghe được** trong audio để suy ra đáp án; bọc mỗi cụm trong `**…**`.
3. **Đáp án sai (tùy chọn)** — `- **B** sai vì …` cho 1–2 distractor quan trọng.
4. **Kết luận** — `→ **Đáp án đúng là C** vì …` (letter **must match** `correctOptionLabel` from `ANSWER_KEY_JSON`).

### `explanation.reference`

- **Nguyên văn** từ/cụm từ tiếng Anh từ `transcript` — **không** phải cả câu; chỉ cụm audio học viên cần bắt để suy ra đáp án.
- **1–3 phần tử** — mỗi phần tử là một keyword/phrase; khớp với các cụm trong dòng `**Từ khóa cần bắt trong audio:**`.
- **Không** thêm nhãn `W:` / `M:` trừ khi nhãn là một phần của cụm được nói.

### Example `reasoning` — ý chính

```text
Đoạn hội thoại nói về **đơn hàng văn phòng phẩm chưa giao** — người phụ nữ hỏi hàng đã tới chưa, người đàn ông nói nhà cung cấp sẽ giao **this afternoon**, nên chủ đề chính là lô hàng bị trễ.

**Từ khóa cần bắt trong audio:** **Not yet**, **delivered this afternoon**, **office supplies**.

- **B** sai vì không nhắc hợp đồng khách hàng mới.

→ **Đáp án đúng là A** vì hai người bàn về **a delayed delivery**.
```

`reference`: `["Not yet", "delivered this afternoon", "office supplies"]`

### Example `reasoning` — chi tiết

```text
Trong hội thoại, câu "We really need those printer cartridges before the client presentation tomorrow." nghĩa là "Chúng ta thực sự cần mực in trước buổi thuyết trình cho khách hàng ngày mai.", nên thời điểm cần hàng là **trước buổi thuyết trình**.

**Từ khóa cần bắt trong audio:** **before the client presentation**, **tomorrow**.

→ **Đáp án đúng là A** vì họ cần hàng **before a presentation**.
```

`reference`: `["before the client presentation", "tomorrow"]`

---

## Tags

### Dạng câu (`skills` — Part 3 comprehension)

`main_idea`, `detail`, `infer`, `vocab_context`, `not_stated`, `speaker`, `place`, `problem`, `request`, `next`, `intent`, `graphic`, `reference`

### Trọng tâm (`focus`)

`who`, `what`, `why`, `how`, `time`, `number`, `location`

Examples: `skills: ["main_idea"], focus: "what"` · `skills: ["detail"], focus: "time", topic: "office"`

- **`skills`:** 1–3 comprehension dạng câu slugs (required array).
- **`focus`:** one trọng tâm slug (required).
- **`topic`:** optional chủ đề slug on the question — omit key when unclear.

---

## QA (before return) — prevents missing questions

### Question count (mandatory)

1. Count input `questions.length` → call it **N** (normally **3**).
2. Confirm output `groups[0].questions.length === N`.
3. Confirm output order matches input order (index `0` enriches input question `0`, etc.).
4. Confirm every output question has non-empty `correctOptionLabel`, `hint`, `explanation.reasoning`, `explanation.reference` (≥1), `skills`, and `focus`.

**Fail example:** input has globals 32, 33, 34 but output `questions` has only two objects → incomplete; add the missing enrichment.

### Enrichment quality

1. `correctOptionLabel` ∈ {A,B,C,D} and exists on that question’s options.
2. Conclusion letter in `reasoning` matches `correctOptionLabel`.
3. `hint` has no answer letter spoilers.
4. `reasoning` includes `**Từ khóa cần bắt trong audio:**` line.
5. Each `reference` string is a verbatim keyword/phrase from the transcript.
6. Group `topic` is a short concrete English title.
7. `vocabulary[]` is present with context-aware definitions, US-then-UK `ipa`, and `example`.

### Workflow

1. Enrich **every** input question in order (answer from key + hint + explanation + tags).
2. Build curated `vocabulary[]` for the group.
3. Run QA above — especially **question count = N**.
4. Return `{ "groups": [ { topic, vocabulary, questions } ] }`.
