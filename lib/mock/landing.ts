/** Landing quotes, FAQ, and contact links. */

export const LANDING_STATS = {
	registered: 2847,
	enrolled: 612,
	examBanks: 48,
	vocab: 1860,
	completed: 214,
	feedback: 1342,
} as const;

export const LANDING_EXAM_BOOKS = [
	{ name: "TOEIC 2026", tests: 8 },
	{ name: "TOEIC 2024", tests: 10 },
	{ name: "TOEIC 2023", tests: 8 },
	{ name: "TOEIC 2022", tests: 6 },
	{ name: "TOEIC 2020", tests: 8 },
	{ name: "TOEIC 2019", tests: 8 },
] as const;

export const LANDING_VOCAB_TOPICS = [
	{ topic: "Hợp đồng", count: 320 },
	{ topic: "Thư từ", count: 280 },
	{ topic: "Văn phòng", count: 410 },
	{ topic: "Nhân sự", count: 190 },
	{ topic: "Tài chính", count: 240 },
	{ topic: "Họp và sản xuất", count: 160 },
] as const;

export const LANDING_COMPLETED_ACCOUNTS = [
	{ email: "lan.nguyen@gmail.com", score: 785 },
	{ email: "minh.tran@gmail.com", score: 890 },
	{ email: "ha.pham@gmail.com", score: 820 },
	{ email: "quoc.anh@gmail.com", score: 710 },
	{ email: "thu.vo@gmail.com", score: 850 },
] as const;


export const LANDING_TESTIMONIALS = [
  {
    id: "1",
    name: "Lan Nguyễn",
    role: "Sinh viên năm 3",
    score: "520 → 785",
    tag: "Listening",
    tone: "peach" as const,
    quote:
      "Mình hay yếu Part 3–4. Luyện đều 6 tuần là Listening tăng rõ, không còn nghe kiểu đoán mò nữa.",
    initials: "LN",
  },
  {
    id: "2",
    name: "Minh Trần",
    role: "Nhân viên văn phòng",
    score: "650 → 890",
    tag: "Mock exam",
    tone: "sky" as const,
    quote:
      "Thi thử trên app giúp mình quen áp lực thời gian. Biết Part 7 yếu nên ôn có trọng tâm hơn.",
    initials: "MT",
  },
  {
    id: "3",
    name: "Hà Phạm",
    role: "Ứng viên tuyển dụng",
    score: "580 → 820",
    tag: "Lộ trình",
    tone: "sage" as const,
    quote:
      "Làm bài test đầu xong mới hiểu mình hay sai grammar hay reading — đỡ lãng phí thời gian.",
    initials: "HP",
  },
  {
    id: "4",
    name: "Quốc Anh Lê",
    role: "Fresh grad",
    score: "490 → 710",
    tag: "Streak",
    tone: "honey" as const,
    quote:
      "Mục tiêu ngày giữ mình luyện đều. 20 từ mỗi ngày nghe nhẹ nhưng hiệu quả.",
    initials: "QA",
  },
  {
    id: "5",
    name: "Thu Võ",
    role: "Kế toán",
    score: "600 → 850",
    tag: "Cộng đồng",
    tone: "rose" as const,
    quote:
      "App yên tĩnh, tối về làm 30 phút Reading rất ổn. Câu khó hỏi Zalo là có người trả lời.",
    initials: "TV",
  },
  {
    id: "6",
    name: "Đức Hoàng",
    role: "IT",
    score: "700 → 945",
    tag: "Giải thích",
    tone: "sand" as const,
    quote:
      "Thích phần giải thích sau mock exam — biết vì sao sai, không chỉ xem đáp án.",
    initials: "DH",
  },
] as const;


export const LANDING_FAQ = [
  {
    id: "free",
    question: "Có miễn phí không?",
    answer:
      "Bạn có thể bắt đầu luyện và làm bài thi thử miễn phí. Nếu có gói trả phí, chúng mình sẽ nói rõ trước khi bạn chọn.",
    tone: "cream" as const,
  },
  {
    id: "start",
    question: "Mới bắt đầu nên làm gì?",
    answer:
      "Mở khoá học và học bài đầu tiên. Muốn biết điểm xuất phát thì làm thêm một bài thi thử.",
    tone: "peach" as const,
  },
  {
    id: "ai",
    question: "AI hỗ trợ gì?",
    answer:
      "AI giúp xem bạn hay sai dạng câu nào và gợi ý lộ trình luyện — bạn vẫn tự làm bài nhé.",
    tone: "sky" as const,
  },
  {
    id: "account",
    question: "Có cần đăng nhập không?",
    answer:
      "Không bắt buộc để thử. Đăng nhập để lưu tiến độ, streak và mục tiêu trên nhiều thiết bị.",
    tone: "sage" as const,
  },
  {
    id: "contact",
    question: "Liên hệ Michael ở đâu?",
    answer: "Nhắn Zalo là nhanh nhất. Gmail cũng được nếu bạn muốn trao đổi dài hơn.",
    tone: "sand" as const,
  },
] as const;

type LandingSocialLink = {
  id: string;
  href: string;
  labelKey: "fbPage" | "fbGroup" | "drive" | "zaloGroup";
  descriptionKey: "fbPageDesc" | "fbGroupDesc" | "driveDesc" | "zaloGroupDesc";
  tagKey: "fbPageTag" | "fbGroupTag" | "driveTag" | "zaloGroupTag";
  iconSrc: string;
  iconAbbr: string;
  accentClass: string;
  tone: string;
  qrImageSrc?: string;
};

export const LANDING_SOCIAL_LINKS: LandingSocialLink[] = [
  {
    id: "zalo-group",
    href: "https://zalo.me/g/",
    labelKey: "zaloGroup",
    descriptionKey: "zaloGroupDesc",
    tagKey: "zaloGroupTag",
    iconSrc: "/images/landing/social/zalo-icon.svg",
    iconAbbr: "ZL",
    accentClass: "border-l-[#0068FF]",
    tone: "sky",
    qrImageSrc: "/images/landing/social/zalo-qr.jpeg",
  },
  {
    id: "fb-page",
    href: "https://www.facebook.com/michaeltoeic",
    labelKey: "fbPage",
    descriptionKey: "fbPageDesc",
    tagKey: "fbPageTag",
    iconSrc: "/images/landing/social/facebook-icon.svg",
    iconAbbr: "FB",
    accentClass: "border-l-[#1877F2]",
    tone: "peach",
  },
  {
    id: "fb-group",
    href: "https://www.facebook.com/groups/michaeltoeic",
    labelKey: "fbGroup",
    descriptionKey: "fbGroupDesc",
    tagKey: "fbGroupTag",
    iconSrc: "/images/landing/social/facebook-icon.svg",
    iconAbbr: "FB",
    accentClass: "border-l-[#1877F2]",
    tone: "peach",
  },
  // {
  //   id: "drive",
  //   href: "https://drive.google.com/",
  //   labelKey: "drive",
  //   descriptionKey: "driveDesc",
  //   tagKey: "driveTag",
  //   iconSrc: "/images/landing/social/drive-icon.svg",
  //   iconAbbr: "GD",
  //   accentClass: "border-l-[#4285F4]",
  //   tone: "sage",
  // },
];

export const LANDING_CONTACT = {
  zalo: {
    href: "https://zalo.me/0900000000",
    display: "Zalo — Michael TOEIC",
  },
  gmail: {
    href: "mailto:michael.toeic@gmail.com",
    display: "michael.toeic@gmail.com",
  },
} as const;
