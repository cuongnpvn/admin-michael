/** Static mirror of seeded toeic_tips rows for client-side hint fallback. */
export interface ToeicTipEntry {
  id: string;
  category: "skill" | "topic" | "focus" | "strategy";
  headlineVi: string;
  bodyVi: string;
}

export const TOEIC_TIPS_STATIC: ToeicTipEntry[] = [
  {
    id: "strategy-preview",
    category: "strategy",
    headlineVi: "Đọc câu hỏi trước khi nghe",
    bodyVi:
      "Tận dụng thời gian phát hướng dẫn để đọc câu hỏi và 4 đáp án. Dự đoán chủ đề và thông tin cần nghe.",
  },
  { id: "preposition", category: "skill", headlineVi: "Giới từ", bodyVi: "Xác định từ/cụm đi sau blank (danh từ, V-ing, mệnh đề). Ôn collocation: depend on, role in, despite + N." },
  { id: "word_form", category: "skill", headlineVi: "Dạng từ", bodyVi: "Nhìn vị trí blank: trước/sau danh từ → Adj/N; trước động từ → Adv; sau the/a → N." },
  { id: "verb_tense", category: "skill", headlineVi: "Thì động từ", bodyVi: "Tìm dấu hiệu thời gian (yesterday, since, by next week) để chọn thì đúng. Phân biệt past simple, present perfect, future." },
  { id: "sv_agreement", category: "skill", headlineVi: "Hòa hợp CN–ĐT", bodyVi: "Xác định chủ ngữ thật (không bị cụm chen giữa đánh lừa). One of / Each of / The number of → thường dùng động từ số ít." },
  { id: "conditional", category: "skill", headlineVi: "Câu điều kiện", bodyVi: "Type 1: If + present, will/can + V. Type 2: If + past, would + V. Type 3: If + had V-ed, would have V-ed. Unless = if not." },
  { id: "article", category: "skill", headlineVi: "Mạo từ", bodyVi: "a/an trước danh từ đếm được số ít lần đầu; the khi đã xác định; không mạo từ với danh từ không đếm được (information, equipment)." },
  { id: "comparison", category: "skill", headlineVi: "So sánh", bodyVi: "Adj ngắn → -er/-est; adj dài → more/most. Chú ý than/more…than, as…as, less…than." },
  { id: "modal", category: "skill", headlineVi: "Động từ khuyết thiếu", bodyVi: "must = bắt buộc; should = nên; can/could = khả năng; may/might = có thể. Sau modal → V nguyên mẫu." },
  { id: "phrasal_verb", category: "skill", headlineVi: "Cụm động từ", bodyVi: "Học theo cụm (call off = cancel, look into = investigate). Giới từ sau động từ quyết định nghĩa." },
  { id: "quantifier", category: "skill", headlineVi: "Lượng từ", bodyVi: "much/little + N không đếm; many/few/several + N đếm số nhiều. A number of → số nhiều; The number of → số ít." },
  { id: "conjunction", category: "skill", headlineVi: "Liên từ / cụm nối", bodyVi: "Xác định quan hệ hai vế: song song (and), nhượng bộ (although/despite), mục đích (so that)." },
  { id: "collocation", category: "skill", headlineVi: "Collocation", bodyVi: "Đáp án thường là cụm cố định (status update, product line, with certainty). Đọc cả câu, không chỉ blank." },
  { id: "vocabulary", category: "skill", headlineVi: "Từ vựng theo ngữ cảnh", bodyVi: "Loại đáp án đúng ngữ pháp nhưng sai nghĩa. Chọn từ phù hợp logic câu và chủ đề." },
  { id: "pronoun", category: "skill", headlineVi: "Đại từ / sở hữu", bodyVi: "Xác định thay thế ai/cái gì. Sau giới từ hoặc trước danh từ → tính từ sở hữu (her project)." },
  { id: "verb_pattern", category: "skill", headlineVi: "Cấu trúc V", bodyVi: "Ôn wish to V, will V, enjoy V-ing, look forward to V-ing. Sau to/will/modal → V nguyên mẫu." },
  { id: "relative_clause", category: "skill", headlineVi: "MĐ quan hệ", bodyVi: "Xác định danh từ được bổ sung. who/whom → người; which/that → vật; whose → sở hữu." },
  { id: "passive", category: "skill", headlineVi: "Câu bị động", bodyVi: "Nhấn mạnh hành động hơn chủ thể. Cấu trúc be + V-ed; tìm by + agent nếu có." },
  { id: "main_idea", category: "skill", headlineVi: "Ý chính", bodyVi: "Đọc trước 4 đáp án để đoán chủ đề. Câu hỏi đầu nhóm thường hỏi main idea. Đáp án hay paraphrase." },
  { id: "speaker", category: "skill", headlineVi: "Người nói / vai trò", bodyVi: "Phân biệt giọng W/M. Chú ý ai hỏi — ai trả lời. Suy vai trò từ ngữ cảnh." },
  { id: "place", category: "skill", headlineVi: "Địa điểm (Where)", bodyVi: "Nghe từ khóa at/in/on + tên nơi. Đọc trước đáp án để biết cần nghe địa điểm nào." },
  { id: "detail", category: "skill", headlineVi: "Chi tiết", bodyVi: "Đọc câu hỏi trước để biết cần nghe số, ngày, giờ, tên. Part 4: thứ tự câu hỏi theo thứ tự bài nói." },
  { id: "vocab_context", category: "skill", headlineVi: "Từ vựng ngữ cảnh", bodyVi: "Không chọn nghĩa từ điển — đọc cả câu chứa từ được hỏi. Bẫy thường là nghĩa phụ không khớp ngữ cảnh." },
  { id: "not_stated", category: "skill", headlineVi: "NOT / không đề cập", bodyVi: "Dạng NOT: loại 3 đáp án có trong bài, chọn đáp án còn lại. Dùng paraphrase — thông tin có thể không dùng đúng từ trong đáp án." },
  { id: "compare", category: "skill", headlineVi: "So sánh đoạn kép", bodyVi: "Đánh dấu từng đoạn, đối chiếu ngày/tên/số liệu giữa các văn bản. Không chọn đáp án chỉ đúng một đoạn." },
  { id: "insert", category: "skill", headlineVi: "Chèn câu", bodyVi: "Đọc câu cần chèn trước, tìm đại từ/thì liên kết với câu trước/sau. Chú ý từ chuyển ý (However, Therefore)." },
  { id: "organization", category: "skill", headlineVi: "Cấu trúc đoạn", bodyVi: "Xác định vai trò từng đoạn (mở đầu, chi tiết, kết luận). Câu chèn phải khớp luồng logic toàn bài." },
  { id: "reference", category: "skill", headlineVi: "Tham chiếu", bodyVi: "Theo dõi this/that/they/it — tìm danh từ antecedent gần nhất trong đoạn. Đáp án phải khớp số và giới." },
  { id: "problem", category: "skill", headlineVi: "Vấn đề", bodyVi: "Nửa đầu nêu vấn đề, nửa sau giải pháp. Chú ý issue, delay, concern." },
  { id: "request", category: "skill", headlineVi: "Đề nghị / lời mời", bodyVi: "Nghe Could you, Would you, I'd like. Phân biệt yêu cầu, gợi ý và lời mời." },
  { id: "next", category: "skill", headlineVi: "Hành động tiếp", bodyVi: "Từ chuyển: So, Then, I'll. Câu 3 trong nhóm hay hỏi bước tiếp theo." },
  { id: "infer", category: "skill", headlineVi: "Suy luận", bodyVi: "Đáp án không nói thẳng. Loại đáp án có từ nghe được nhưng sai ngữ cảnh." },
  { id: "intent", category: "skill", headlineVi: "Ý định (meaning-in-context)", bodyVi: "Hiểu câu trích dẫn theo tình huống và giọng điệu người nói." },
  { id: "graphic", category: "skill", headlineVi: "Graphic", bodyVi: "Xem bảng/biểu đồ trước khi nghe. Ghép thông tin nói với hàng/cột trên hình." },
  { id: "office", category: "topic", headlineVi: "Văn phòng", bodyVi: "Bối cảnh: meeting, deadline, project, presentation, email nội bộ." },
  { id: "personnel", category: "topic", headlineVi: "Nhân sự", bodyVi: "Bối cảnh: interview, training, policy, benefits, performance review." },
  { id: "purchasing", category: "topic", headlineVi: "Mua hàng / bán lẻ", bodyVi: "Bối cảnh: order, delivery, inventory, supplier, discount." },
  { id: "finance", category: "topic", headlineVi: "Tài chính", bodyVi: "Bối cảnh: invoice, payment, budget, account, fee." },
  { id: "travel", category: "topic", headlineVi: "Du lịch", bodyVi: "Bối cảnh: flight, gate, hotel, reservation, itinerary." },
  { id: "dining", category: "topic", headlineVi: "Ẩm thực", bodyVi: "Bối cảnh: reservation, menu, catering, bistro, produce." },
  { id: "property", category: "topic", headlineVi: "Bất động sản / cơ sở", bodyVi: "Bối cảnh: maintenance, repair, renovation, lease, parking." },
  { id: "manufacturing", category: "topic", headlineVi: "Sản xuất", bodyVi: "Bối cảnh: factory, inventory, supplier, shipping, productivity." },
  { id: "marketing", category: "topic", headlineVi: "Marketing", bodyVi: "Bối cảnh: campaign, feedback, promotion, advertisement, survey." },
  { id: "technology", category: "topic", headlineVi: "Công nghệ", bodyVi: "Bối cảnh: software, device, network, virus, digital system." },
  { id: "health", category: "topic", headlineVi: "Y tế", bodyVi: "Bối cảnh: hospital, clinic, pharmacy, patient, medical staff." },
  { id: "event", category: "topic", headlineVi: "Sự kiện", bodyVi: "Bối cảnh: conference, seminar, registration, lecture, attendee." },
  { id: "service", category: "topic", headlineVi: "Dịch vụ KH", bodyVi: "Bối cảnh: complaint, refund, support, reservation issue." },
  { id: "general", category: "topic", headlineVi: "Chủ đề chung", bodyVi: "Đọc đáp án và câu để xác định lĩnh vực cụ thể (báo chí, cộng đồng, thông báo công cộng)." },
  { id: "time", category: "focus", headlineVi: "Thời gian", bodyVi: "Chú ý mốc thời gian, thì, trạng từ thời gian (at 6 P.M., after which, currently)." },
  { id: "location", category: "focus", headlineVi: "Nơi chốn", bodyVi: "Xác định nơi chốn, hướng, giới từ không gian (in, at, on, to)." },
  { id: "number", category: "focus", headlineVi: "Số liệu", bodyVi: "Nghe/đọc số, giá, số lượng, phần trăm — đối chiếu với đáp án." },
  { id: "purpose", category: "focus", headlineVi: "Mục đích", bodyVi: "Tìm so that, in order to, để làm gì / vì sao hành động được thực hiện." },
  { id: "contrast", category: "focus", headlineVi: "Tương phản", bodyVi: "Chú ý but, despite, rather than, even though — quan hệ đối lập hoặc nhượng bộ." },
  { id: "phrase", category: "focus", headlineVi: "Cụm cố định", bodyVi: "Đáp án thường là multi-word unit — đọc cả cụm, không chỉ một từ." },
  { id: "pos", category: "focus", headlineVi: "Loại từ", bodyVi: "Xác định blank cần N/V/Adj/Adv dựa trên vị trí trong câu và từ đi kề." },
  { id: "semantics", category: "focus", headlineVi: "Nghĩa từ", bodyVi: "Loại đáp án đúng ngữ pháp nhưng sai logic câu — chọn theo nghĩa phù hợp nhất." },
  { id: "who", category: "focus", headlineVi: "Ai (Who)", bodyVi: "Câu hỏi về người — tên, vai trò, ai thực hiện hành động." },
  { id: "what", category: "focus", headlineVi: "Cái gì (What)", bodyVi: "Câu hỏi về sự việc, vật, nội dung chính." },
  { id: "why", category: "focus", headlineVi: "Vì sao (Why)", bodyVi: "Câu hỏi về lý do, nguyên nhân, mục đích." },
  { id: "how", category: "focus", headlineVi: "Cách thức (How)", bodyVi: "Câu hỏi về cách thức, quy trình, phương tiện." },
];

const TIPS_BY_ID = new Map(TOEIC_TIPS_STATIC.map((tip) => [tip.id, tip]));

export function getToeicTipById(id: string): ToeicTipEntry | undefined {
  const normalized = id === "topic" ? "main_idea" : id;
  return TIPS_BY_ID.get(normalized) ?? TIPS_BY_ID.get(id);
}
