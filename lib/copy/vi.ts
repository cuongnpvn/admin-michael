export const APP_NAME = "Michael TOEIC";

export const copy = {
	nav: {
		community: "Michael TOEIC",
		dictation: "Chép chính tả",
		practice: "Luyện tập",
		listening: "Luyện nghe",
		reading: "Luyện đọc",
		vocab: "Từ vựng",
		courses: "Khoá học",
		exam: "Thi thử",
		entranceTest: "Test đầu vào",
		notebook: "Ghi chú",
		progress: "Tiến độ",
	},
	common: {
		start: "Bắt đầu",
		startPractice: "Luyện tập",
		continuePractice: "Tiếp tục",
		partAnsweredProgress: (answered: number, total: number) =>
			`${answered} / ${total} đã trả lời`,
		partCompletedResult: (correct: number, total: number) =>
			`Hoàn thành — ${correct} / ${total} đúng`,
		retry: "Thử lại",
		retryPractice: "Làm lại",
		previous: "Câu trước",
		next: "Câu sau",
		previousPassage: "Bài trước",
		nextPassage: "Bài sau",
		nextQuestion: "Câu tiếp theo",
		question: "Câu ",
		passage: "Đoạn văn",
		questions: "câu hỏi",
		minutes: "phút",
		part: "Part",
		selectAnswer: "Chọn đáp án",
		backToPractice: "Quay lại luyện tập",
		backToListening: "Quay lại Listening",
		backToReading: "Quay lại Reading",
		openMenu: "Mở menu",
		toggleTheme: "Đổi giao diện",
		switchToLight: "Chuyển sang sáng",
		switchToDark: "Chuyển sang tối",
		relativeTime: {
			justNow: "vừa xong",
			minutesAgo: (minutes: number) => `${minutes} phút trước`,
			hoursAgo: (hours: number) => `${hours} giờ trước`,
		},
	},
	home: {
		headline: "Chinh phục mục tiêu TOEIC cùng Michael",
		subtitleLead: "Bạn cần 1 lộ trình luyện thi ",
		subtitleMark: "theo ngày",
		subtitleRest: " để đạt điểm thi tối ưu nhất",
		heroCtaPrimary: "Đăng kí khoá học",
		heroCtaSecondary: "Test Đầu vào",
		course: {
			title: "Hãy chăm chỉ ôn tập !~",
			steps: [
				{
					title: [
						{ text: "Ôn luyện " },
						{ text: "ngữ pháp", highlight: true },
						{ text: " để có 1 " },
						{ text: "nền tảng kiến thức", highlight: true },
						{ text: " tốt" },
					],
					body: "Ngồi mở sách, cày từng điểm một. Câu bị động, giới từ, mệnh đề quan hệ... nhớ chắc rồi thì gặp câu nào cũng đỡ phải đoán.",
					imageAlt:
						"Bạn đang ôn ngữ pháp với sách TOEIC, Grammar và Vocabulary",
				},
				{
					title: [
						{ text: "Luyện nghe đều đặn", highlight: true },
						{ text: " giúp dễ dàng bắt các trường hợp khó như " },
						{
							text: "từ bị nuốt âm, từ nói lướt, từ nghe na ná nhau",
							highlight: true,
						},
					],
					body: "Mỗi ngày một lúc với tai nghe. Nghe lại đúng đoạn mình tuột, gạch vàng chỗ chưa kịp. Quen tai rồi thì tốc độ trong đề thành chuyện bình thường.",
					imageAlt:
						"Bạn đeo tai nghe, vừa nghe audio vừa highlight những chỗ chưa kịp",
				},
				{
					title: [
						{ text: "Hiểu rõ " },
						{ text: "các phần đã học", highlight: true },
						{ text: ", " },
						{
							text: "các phần kiến thức còn thiếu",
							highlight: true,
						},
						{ text: ", để biết bước tiếp theo ngồi vào đâu" },
					],
					body: "Nhìn tờ tick là thấy ngay. Ngữ pháp đã gạch thì giữ vậy. Mục còn trống, như từ vựng chưa chạm tới, chính là phần mình sẽ cày tiếp.",
					imageAlt:
						"Tờ checklist ngữ pháp đã được tick, từ vựng Business đang được gạch và từ vựng du lịch còn trống",
				},
			],
		},
		path: {
			title: "Mỗi ngày 1 bài học cụ thể",
			subtitle:
				"Có lúc nản, lúc hào hứng, nhưng Michael sẽ giúp bạn luôn giữ lửa!!!",

			ready: "Sẵn sàng thi",
			readyHint: "Đích của lộ trình",
			progress: (opened: number, total: number) =>
				`${opened} / ${total} kỹ năng đã mở`,
		},
		faq: {
			title: "Câu hỏi thường gặp",
			subtitle: "Vài điều bạn có thể thắc mắc trước khi mở vở.",
		},
		stats: {
			label: "Số liệu cộng đồng",
			registered: "học viên đã đăng ký",
			enrolled: "đã ghi danh khoá học",
			examBanks: "Bộ đề thi",
			vocab: "Từ vựng",
			completed: "Hoàn thành khoá",
			feedback: "Phản hồi",
			examCount: (count: number) => `${count} đề`,
			vocabCount: (count: number) => `${count} từ`,
			score: "điểm",
		},
		community: {
			title: "Ngồi luyện cùng mọi người",
			subtitle: "Hỏi bài, lấy tài liệu, giữ nhịp ôn.",
			whyJoinTitle: "Bạn sẽ có thêm",
			whyJoin: [
				"Chỗ hỏi bài khó nhanh hơn",
				"Tài liệu & audio bổ sung trên Drive",
				"Tip mới và lịch live trên Facebook",
			],
			featuredBadge: "Nên thử trước",
			fbPage: "Fanpage",
			fbPageDesc: "Mẹo làm bài và cập nhật mới.",
			fbPageTag: "Tips",
			fbGroup: "Nhóm học",
			fbGroupDesc: "Hỏi đáp và chia sẻ kinh nghiệm thi.",
			fbGroupTag: "Hỏi đáp",
			drive: "Google Drive",
			driveDesc: "PDF, audio và đề luyện thêm.",
			driveTag: "Tài liệu",
			zaloGroup: "Nhóm Zalo",
			zaloGroupDesc: "Chat nhanh và hỏi Michael trực tiếp.",
			zaloGroupTag: "Hỗ trợ",
			zaloQrAlt: "Mã QR tham gia nhóm Zalo Michael TOEIC",
			externalLink: "Tham gia",
			statsLine: "2.800+ thành viên · Cập nhật thường xuyên",
		},
		blog: {
			title: "Bài viết mới",
			subtitle: "Mẹo học, kinh nghiệm thi và cập nhật từ Michael TOEIC.",
			empty: "Chưa có bài viết nào.",
			readMore: "Đọc tiếp",
			backToCommunity: "Quay lại trang chủ",
			publishedAt: (date: string) => date,
			like: "Thích",
			liked: "Đã thích",
			share: "Chia sẻ",
			shareCopied: "Đã sao chép liên kết",
			likes: (count: number) => `${count} lượt thích`,
			comments: (count: number) => `${count} bình luận`,
			shares: (count: number) => `${count} lượt chia sẻ`,
			relatedTitle: "Bài viết liên quan",
			commentsTitle: "Bình luận",
			commentPlaceholder: "Viết bình luận…",
			commentSubmit: "Gửi bình luận",
			commentSignIn: "Đăng nhập để bình luận",
			commentSignInButton: "Đăng nhập",
			likeSignIn: "Đăng nhập để thích bài viết",
			noComments: "Chưa có bình luận. Hãy là người đầu tiên!",
			errors: {
				generic: "Có lỗi xảy ra. Vui lòng thử lại.",
				commentRequired: "Bình luận không được để trống.",
			},
		},
		contact: {
			zalo: "Nhắn Zalo",
			gmail: "Gửi Gmail",
		},
		close: {
			title: "Mở bài học hôm nay",
			subtitle: "Bắt đầu từ khoá. Muốn được gợi ý bài thì nhắn Zalo.",
			zalo: "hoặc nhắn Zalo",
		},
	},
	community: {
		chat: {
			title: "Chat cộng đồng",
			subtitle: "Trao đổi nhanh với học viên đang trên trang Cộng đồng.",
			online: (count: number) => `${count} đang online`,
			placeholder: "Nhập tin nhắn…",
			send: "Gửi",
			signInPrompt: "Đăng nhập để chat",
			signInButton: "Đăng nhập",
			empty: "Chưa có tin nhắn. Hãy là người đầu tiên!",
			errors: {
				empty: "Tin nhắn không được để trống.",
				tooLong: "Tin nhắn quá dài (tối đa 500 ký tự).",
				rateLimit: "Bạn gửi quá nhanh. Vui lòng chờ một chút.",
				generic: "Có lỗi xảy ra. Vui lòng thử lại.",
				notSignedIn: "Vui lòng đăng nhập để chat.",
			},
		},
	},
	listening: {
		title: "Luyện Listening",
		subtitle: "Rèn luyện kỹ năng nghe từ chế độ luyện tập",
	},
	dictation: {
		title: "Chép chính tả",
		subtitle:
			"Luyện tập nghe chép chính tả để nâng cao kĩ năng, cải thiện điểm phần Listening",
		sortTopic: "Chủ đề",
		sortLevel: "Trình độ",
		itemCount: (count: number) => `${count} bài`,
		empty: "Chưa có bài chép chính tả.",
		backToCatalog: "Quay lại danh mục",
		partLabel: {
			image_description: "Part 1",
			question_answer: "Part 2",
			conversation: "Part 3",
			monologue: "Part 4",
		},
		stages: {
			overview: "Nghe tổng quan",
			transcribe: "Chép câu",
			compare: "Đối chiếu",
			shadow: "Đọc nhại",
		},
		progress: (current: number, total: number) =>
			`Bài ${current} / ${total}`,
		listenCount: (count: number) => `Lần nghe ${count}`,
		overviewHint: "Nghe toàn bộ đoạn một đến hai lần.",
		transcribeHint: "Nghe từng câu và viết đúng những gì nghe được.",
		compareHint:
			"Đối chiếu với transcript. Từ khớp hiện màu xanh, từ chưa khớp hiện màu đỏ.",
		play: "Nghe",
		sentenceProgress: (current: number, total: number) =>
			`Câu ${current} / ${total}`,
		listenGuide: (count: number) =>
			`Đã nghe ${count} lần. Nên nghe khoảng 3–5 lần, rồi viết đúng những gì nghe được.`,
		draftPlaceholder: "Viết những gì bạn nghe được…",
		answerModeLabel: "Chế độ câu",
		writeMode: "Nghe chép",
		clozeMode: "Đục lỗ",
		previousSentence: "Câu trước",
		nextSentence: "Câu sau",
		hints: "Gợi ý",
		hideHints: "Ẩn gợi ý",
		noHints: "Bài này không có gợi ý.",
		listenNotes: "Cần chú ý",
		noListenNotes: "Câu này không có từ cần chú ý.",
		noteLinked: "Nối với từ sau",
		noteOmitted: "Âm bị nuốt",
		notePronunciation: "Phát âm khó",
		yourDraft: "Bạn viết",
		official: "Transcript",
		matched: "Khớp rồi",
		reasonPrompt: "Vì sao nghe sai câu này?",
		reasonNewVocab: "Từ mới",
		reasonConnected: "Âm bị nuốt",
		shadowHint: "Vừa nghe transcript vừa đọc nhại theo nhịp.",
		translation: "Bản dịch",
		nextStage: "Tiếp tục",
		skip: "Bỏ qua",
		repeat: "Làm lại bài này",
		nextItem: "Bài tiếp",
		finish: "Hoàn thành",
		remindTitle: "Kỹ năng nghe không vững chỉ sau một buổi đâu",
		remindDescription:
			"Bạn nên sắp xếp luyện thêm nhiều lần thì kỹ năng này mới tiến rõ. Nếu muốn, mình sẽ nhắc bạn vào lúc hợp để luyện tiếp nhé.",
		remindOk: "OK",
		remindSaved: "Đã hẹn nhắc bạn luyện lại bài này.",
		sessionComplete: "Đã hoàn thành bộ bài này.",
		playSentence: "Nghe câu",
	},
	vocab: {
		title: "Từ vựng",
		listening: "Listening",
		reading: "Reading",
		myDecks: "Cá nhân",
		publicDecks: "Các bộ từ phổ biến",
		deckTitle: (
			bookName: string,
			testLabel: string,
			sectionLabel: string,
		) =>
			`${bookName.toUpperCase()} · ${testLabel.toUpperCase()} · ${sectionLabel}`,
		wordCount: (count: number) => `${count} từ`,
		searchPlaceholder: "Tìm từ…",
		searchEmpty: "Không tìm thấy từ phù hợp.",
		deckSearchPlaceholder: "Tìm bộ từ…",
		deckSearchEmpty: "Không tìm thấy bộ từ phù hợp.",
		backToCatalog: "Quay lại Từ vựng",
		backToDeck: "Quay lại danh sách từ",
		practiceSessionMeta: (sessionCount: number, deckSize: number) =>
			`${sessionCount} / ${deckSize} từ trong phiên này`,
		selectPractice: {
			toggle: "Chọn từ",
			toggleActive: "Hủy chọn",
			startSelected: (count: number) => `Luyện ${count} từ đã chọn`,
			startEmpty: "Chọn để luyện tập",
			cancel: "Hủy chọn",
		},
		manage: {
			createDeck: "Thêm mới",
			createDeckTitle: "Thêm mới",
			deckNameLabel: "Tên bộ từ",
			deckNamePlaceholder: "VD: Từ vựng của tôi",
			export: "Sao chép",
			addWord: "Thêm từ",
			addWordTitle: "Thêm từ",
			editWordTitle: "Sửa từ",
			dictionarySuggest: "Gợi ý từ điển",
			save: "Lưu",
			delete: "Xóa",
			cancel: "Hủy",
			publish: "Công khai",
			private: "Riêng tư",
			settings: "Cài đặt",
			settingsTitle: "Cài đặt",
			regenerate: "Tạo lại từ vựng",
			regenerateTitle: "Tạo lại từ vựng",
			regenerateConfirm: "Tạo lại",
			regenerateProgressTitle: "Đang tạo lại từ vựng…",
			regenerateSuccess: (wordCount: number) =>
				`Đã tạo lại ${wordCount} từ.`,
			deleteDeck: "Xóa bộ từ",
			deleteDeckTitle: "Xóa bộ từ?",
			deleteDeckConfirm: "Xóa",
			emptyMine: "Chưa có bộ từ.",
			fields: {
				term: "Từ",
				lemma: "Lemma",
				meaningVi: "Nghĩa (VI)",
				definitionEn: "Định nghĩa (EN)",
				ipaUs: "IPA (Mỹ)",
				ipaUk: "IPA (Anh)",
				wordTypes: "Loại từ",
				synonyms: "Từ đồng nghĩa",
				collocations: "Cụm từ",
				example: "Ví dụ",
				level: "Trình độ",
				levelOptional: "Không bắt buộc",
			},
			errors: {
				notSignedIn: "Bạn cần đăng nhập.",
				notOwner: "Bạn không có quyền sửa bộ từ này.",
				nameRequired: "Nhập tên bộ từ.",
				termRequired: "Nhập từ.",
				emptyDeck: "Bộ từ chưa có từ nào để tạo lại.",
				exportFailed: "Không sao chép được bộ từ.",
				exportNotAllowed:
					"Chỉ sao chép được bộ từ công khai của người dùng khác.",
				geminiMissingApiKey:
					"Hệ thống tạm thời không khả dụng. Thử lại sau.",
				geminiRateLimited: "Hệ thống đang quá tải. Thử lại sau.",
				generic: "Có lỗi xảy ra. Thử lại.",
			},
		},
		toast: {
			deckCreated: "Tạo bộ từ thành công",
			deckCreateFailed: "Lỗi khi tạo bộ từ",
			deckRenamed: "Đổi tên bộ từ thành công",
			deckRenameFailed: "Lỗi khi đổi tên bộ từ",
			deckPublished: "Công khai bộ từ thành công",
			deckPublishFailed: "Lỗi khi công khai bộ từ",
			deckUnpublished: "Đặt bộ từ riêng tư thành công",
			deckUnpublishFailed: "Lỗi khi đặt bộ từ riêng tư",
			deckDeleted: "Xóa bộ từ thành công",
			deckDeleteFailed: "Lỗi khi xóa bộ từ",
			wordAdded: "Thêm từ thành công",
			wordAddFailed: "Lỗi khi thêm từ",
			wordUpdated: "Cập nhật từ thành công",
			wordUpdateFailed: "Lỗi khi cập nhật từ",
			wordDeleted: "Xóa từ thành công",
			wordDeleteFailed: "Lỗi khi xóa từ",
			deckCopied: "Sao chép bộ từ thành công",
			deckCopyFailed: "Lỗi khi sao chép bộ từ",
			wordAddedToDeck: "Thêm vào bộ từ thành công",
			wordAddToDeckFailed: "Lỗi khi thêm vào bộ từ",
			deckRegenerated: "Tạo lại từ vựng thành công",
			deckRegenerateFailed: "Lỗi khi tạo lại từ vựng",
		},
		quickAdd: {
			add: "Thêm",
			title: "Thêm vào bộ từ",
			createDeck: "Thêm mới",
			deckNamePlaceholder: "VD: Từ vựng của tôi",
			emptyDecks: "Chưa có bộ từ.",
			added: "Đã thêm.",
			alreadyInDeck: "Từ đã có trong bộ từ này.",
			errors: {
				generic: "Có lỗi xảy ra. Vui lòng thử lại.",
			},
		},
		detail: {
			playPronunciation: "Nghe phát âm",
		},
		practicePicker: {
			title: "Chọn số từ luyện tập",
			description: (deckSize: number) =>
				`Bộ từ có ${deckSize} từ. Chọn số từ bạn muốn học trong phiên này.`,
			start: "Bắt đầu",
			cancel: "Hủy",
			estimatedMinutes: (minutes: number) => `~${minutes} phút`,
			startFailed: "Không thể bắt đầu phiên luyện tập. Thử lại.",
		},
		practice: {
			loading: "Đang tải…",
			stageDefinition: "Định nghĩa",
			stageFillIn: "Điền từ",
			stageDictation: "Nghe viết",
			progress: (current: number, total: number) =>
				`${current} / ${total}`,
			noExample: "Chưa có nghĩa tiếng Việt cho từ này.",
			meaningLabel: "Dịch nghĩa",
			englishLabel: "English",
			exampleLabel: "Ví dụ",
			exampleTranslation: "Dịch ví dụ",
			synonymsLabel: "Từ đồng nghĩa",
			collocationsLabel: "Cụm từ",
			showFront: "Xem mặt trước thẻ",
			showBack: "Xem mặt sau thẻ",
			playUs: "US",
			playUk: "UK",
			checkAnswer: "Kiểm tra",
			nextStage: "Tiếp theo",
			repeatWord: "Học lại",
			reviewWord: "Xem lại",
			hideReview: "Ẩn thẻ",
			nextWord: "Tiếp theo",
			finishSession: "Hoàn thành",
			skipWord: "Bỏ qua",
			deckComplete: "Đã hoàn thành bộ từ này.",
			sessionCompleteTitle: "Hoàn thành phiên luyện tập",
			sessionCompleteDescription: "Bạn đã hoàn thành bộ từ này.",
			backToList: "Quay lại",
			startNewSession: "Luyện phiên mới",
		},
	},
	reading: {
		title: "Luyện Reading",
		subtitle:
			"Các bài reading được lấy từ những bài TEST chất lượng và sẽ được cập nhật liên tục theo tuần.",
		examBookHint: "Chọn bộ đề, sau đó chọn part để luyện tập.",
		documentTypes: {
			email: "E-mail",
			memo: "Memo",
			letter: "Thư",
			article: "Bài báo",
			advertisement: "Quảng cáo",
			brochure: "Brochure",
			notice: "Thông báo",
			form: "Biểu mẫu",
			schedule: "Lịch trình",
			review: "Đánh giá",
			web_page: "Trang web",
			conversation: "Hội thoại",
			other: "Đoạn văn",
		},
	},
	study: {
		comingSoon: "Sắp ra mắt",
		testComingSoon: (label: string) =>
			`${label} chưa có dữ liệu cho phần này.`,
		invalidSession:
			"Không tìm thấy bài luyện tập. Vui lòng chọn lại từ trang luyện tập.",
		defaultBookLabel: "bộ đề",
		commonPracticeTitle: "Luyện chung",
		commonPracticeSubtitle:
			"Bài luyện độc lập — không gắn với đề thi đầy đủ.",
		examBookPracticeTitle: "Theo bộ đề",
		examBookPracticeSubtitle: "Luyện từng part của bài test trong sách đề.",
		catalogEmptyNoBooks:
			"Chưa có sách đề thi trên hệ thống. Kiểm tra kết nối Supabase, chạy migration, rồi import hoặc seed nội dung trong Admin.",
		catalogEmptyNoPublished: (bookName: string) =>
			`${bookName ?? "Hệ thống"} chưa có nội dung được publish cho phần này. Vào Admin để publish Listening/Reading.`,
		catalogEmptyAdminLink: "Mở Admin",
		catalogQuestionCount: (count: number) => `${count} câu hỏi`,
		sectionMetaListening: "100 câu · ~45 phút",
		sectionMetaReading: "100 câu · ~75 phút",
		startExam: "Thi thử",
		startPractice: "Luyện theo part",
		sessionPickerExamTitle: "Chọn nội dung — Thi thử",
		sessionPickerPracticeTitle: (bookName: string, testName: string) =>
			`${bookName.toUpperCase()} · ${testName.toUpperCase()}`,
		sessionPickerDescription:
			"Chọn một hoặc nhiều part để luyện tập trong phiên này.",
		sessionPickerSummaryMeta: (count: number, minutes: number) =>
			`${count} câu · ~${minutes} phút`,
		sessionPickerNoParts: "Chưa có part nào khả dụng cho bài test này.",
		sessionPickerMixedSections:
			"Một phiên chỉ gồm part Listening hoặc part Reading.",
		sessionPickerConfirmExam: "Bắt đầu thi thử",
		sessionPickerConfirmPractice: "Bắt đầu luyện tập",
		sessionPickerCancel: "Hủy",
		sessionPickerTimerLabel: "Thời gian làm bài",
		groupCardQuestions: (count: number) => `${count} câu`,
		partSectionLabel: (part: number, title: string) =>
			`Part ${part} — ${title}`,
	},
	entrance: {
		emptyTitle: "Đề đầu vào đang được cập nhật",
		emptyBody: "Chưa có bài test nào để làm. Hãy thử lại sau.",
		retry: "Thử lại",
		readyTitle: "Đánh giá rõ điểm xuất phát",
		readyBody:
			"Làm bài test đầu vào để biết trình độ hiện tại. Kết quả cho bạn thấy mình đang ở đâu và nên bắt đầu luyện từ phần nào.",
		introCta: "Làm bài test",
		resultTitle: "Kết quả bài đầu vào",
		resultEmptyTitle: "Chưa có kết quả",
		resultEmptyBody: "Hãy làm bài đầu vào để xem điểm và nhận xét.",
		startTest: "Làm bài đầu vào",
		backToLanding: "Về trang chủ",
		goToCourse: "Tìm hiểu khoá học",
		skillsTitle: "Một vài chỉ số",
		conclusionTitle: "Nhận xét",
		analysisTitle: "Phân tích kết quả bài thi",
		analysisSteps: [
			"Phân tích kết quả bài thi",
			"Đối chiếu điểm Nghe và Đọc",
			"Xem ngữ pháp và từ vựng đã dùng",
			"Khoanh vùng phần cần cải thiện",
			"Chọn bước luyện tiếp theo",
		],
		skills: {
			listening: "Nghe",
			reading: "Đọc",
			completion: "Mức hoàn thành",
			overall: "Độ chính xác",
		},
		conclusions: {
			foundation:
				"Nền còn mỏng. Nghe và đọc đều cần luyện đều mỗi ngày, bắt đầu từ câu ngắn và từ vựng thường gặp trong đề.",
			building:
				"Bạn đã có nền cơ bản. Giữ nhịp luyện nghe ngắn mỗi ngày và ôn ngữ pháp ở những câu còn sai.",
			solid: "Bạn đang ở vùng điểm khá. Tập trung vào câu dài và đoạn đọc để kéo điểm ổn định hơn.",
			ready: "Bạn đã sẵn sàng cho mục tiêu cao. Luyện đề đủ thời gian và rà lại những câu dễ mất điểm.",
		},
	},
	exam: {
		title: "Mô phỏng trải nghiệm TOEIC thực tế",
		subtitle:
			"Chế độ Exam có bố cục chặt chẽ hơn, đồng hồ luôn hiển thị và ít yếu tố gây xao nhãng để bạn luyện tập dưới áp lực.",
		selectTitle: "Chọn bài thi thử",
		lobbyTitle: "Chuẩn bị bắt đầu",
		backToSelection: "Chọn bài khác",
		invalidSelection:
			"Không tìm thấy bài thi. Vui lòng chọn lại từ danh sách.",
		loadingLobby: "Đang tải…",
		exitExam: "Thoát",
		exitConfirmTitle: "Thoát bài thi?",
		exitConfirmDescription:
			"Tiến độ hiện tại sẽ không được lưu. Bạn sẽ quay lại trang chọn bài thi.",
		exitConfirmStay: "Ở lại",
		exitConfirmLeave: "Thoát bài thi",
		totalTime: "Tổng 120 phút",
		sectionsNote:
			"Hai phần thi với thời gian cố định, không tạm dừng giữa các câu.",
		rules: [
			"Đồng hồ luôn hiển thị trong suốt bài thi.",
			"Số lần nghe lại bị giới hạn ở chế độ Exam.",
			"Không thể quay lại phần thi trước sau khi đã nộp.",
		],
		startMockTest: "Bắt đầu",
		scoreStatsOpenAria: "Xem điểm",
		scoreStatsTitle: "Kết quả thi",
		scoreStatsAll: "Tất cả",
		scoreStatsAxisReading: "R",
		scoreStatsAxisListening: "L",
		scoreStatsAttemptSubtitle: (listening: number, reading: number) =>
			`L ${listening} · R ${reading}`,
		scoreStatsEmptyTitle: "Chưa có bài thi",
		reviewLastAttempt: "Xem lại bài",
		reviewLastAttemptAria: "Xem lại lần làm gần nhất",
		reviewLastAttemptDialogTitle: "Review lại bài thi",
		reviewLastAttemptPartsLabel: "Kết quả lưu từ lần thi trước",
		reviewLastAttemptPartBadge: (part: number) => `Part ${part}`,
		reviewLastAttemptConfirm: "Xem lại",
		examPrepareTitle: "Chuẩn bị",
		beginExamWaitingPrepare: "Đang chuẩn bị…",
		partPickerTitle: (bookName: string, testName: string) =>
			`${bookName.toUpperCase()} · ${testName.toUpperCase()}`,
		partPickerWholeTest: "Làm full test",
		partPickerListeningSection: "Listening",
		partPickerReadingSection: "Reading",
		partPickerSummaryMeta: (count: number) => `${count} câu`,
		partPickerCardMeta: (count: number) => `${count} câu`,
		partPickerDurationLabel: "Thời gian thi",
		partPickerDurationUnit: "phút",
		partPickerDurationListeningNote:
			"Lưu ý: Phần Listening dùng thời lượng audio thực tế của bài thi, không nhất thiết trùng với số phút bạn chọn ở trên.",
		partPickerNoParts: "Chưa có part nào khả dụng cho bài test này.",
		partPickerConfirm: "Bắt đầu",
		partPickerContinueLobby: "Tiếp tục",
		partPickerBack: "Quay lại",
		partPickerCancel: "Hủy",
		lobbySelectedSummary: (count: number, minutes: number) =>
			`${count} câu · ${minutes} phút`,
		lobbySelectedPartsTitle: "Phần đã chọn",
		readyTitle: "Sẵn sàng bắt đầu?",
		readyDescription:
			"Khi bạn bắt đầu, đồng hồ đếm ngược sẽ chạy ngay. Hãy tìm chỗ yên tĩnh và chuẩn bị tập trung.",
		notYet: "Chưa",
		beginExam: "Bắt đầu",
		mockExamBadge: "Mock Exam",
		submitSection: "Nộp phần thi",
		selectedProgress: (answered: number, total: number) =>
			`Đã chọn: ${answered}/${total}`,
		answered: "đã trả lời",
		sectionCompleteTitle: "Hoàn thành phần Listening",
		sectionCompleteDescription:
			"Bạn sẽ chuyển sang phần Reading. Hít thở sâu một chút, rồi tiếp tục khi sẵn sàng.",
		continueNextSection: "Chuyển sang phần tiếp theo",
		toeicAudioPlaying: "Đang phát audio",
		listeningTestAudioLabel: "Audio Listening — toàn bài test",
		toeicAudioAutoAdvance: "Tự chuyển câu",
		listeningDebugNav: "Debug: nhảy câu",
		listeningDebugNavHint:
			"Cho phép chuyển câu Listening mà không cần chờ audio kết thúc (chỉ admin).",
		back: "BACK",
		next: "NEXT",
		review: "REVIEW",
		reviewReturn: "RETURN",
		reviewClose: "Review",
		finishTest: "Finish test",
		reviewNotificationTitle: "NOTIFICATION",
		reviewUnansweredWarning:
			"You have unanswered questions. Submit anyway?",
		markForReview: "Mark for Review",
		markItemForReview: "Mark item for review",
		openQuestionGrid: "Mở danh sách câu hỏi",
		readingPanelJumpNav: "Chuyển đến đoạn văn hoặc câu hỏi",
		scrollToPassage: "Cuộn đến đoạn văn",
		scrollToQuestions: "Cuộn đến câu hỏi",
		muteAudio: "Mute audio",
		unmuteAudio: "Unmute audio",
		hideTime: "Hide Time",
		showTime: "Show Time",
		go: "GO",
		continue: "CONTINUE",
		skipIntro: "SKIP",
		listeningSectionIntroTitle: "LISTENING TEST",
		listeningSectionIntroBody:
			"In the Listening test, you will be asked to demonstrate how well you understand spoken English. The entire Listening test will last approximately 45 minutes. There are four parts, and directions are given for each part. You must mark your answers on the separate answer sheet. Do not write your answers in your test book.",
		listeningPart1Example:
			'Statement (C), "They\'re sitting at a table," is the best description of the picture, so you should select answer (C) and mark it on your answer sheet.',
		listeningIntroPartHeading: (part: number) => `PART ${part}`,
		listeningIntroDirections: (part: number) => {
			switch (part) {
				case 1:
					return "Directions: For each question in this part, you will hear four statements about a picture in your test book. When you hear the statements, you must select the one statement that best describes what you see in the picture. Then find the number of the question on your answer sheet and mark your answer. The statements will not be printed in your test book and will be spoken only one time.";
				case 2:
					return "Directions: You will hear a question or statement and three responses spoken in English. They will not be printed in your test book and will be spoken only one time. Select the best response to the question or statement and mark the letter (A), (B), or (C) on your answer sheet.";
				case 3:
					return "Directions: You will hear some conversations between two or more people. You will be asked to answer three questions about what the speakers say in each conversation. Select the best response to each question and mark the letter (A), (B), (C), or (D) on your answer sheet. The conversations will not be printed in your test book and will be spoken only one time.";
				case 4:
					return "Directions: You will hear some talks given by a single speaker. You will be asked to answer three questions about what the speaker says in each talk. Select the best response to each question and mark the letter (A), (B), (C), or (D) on your answer sheet. The talks will not be printed in your test book and will be spoken only one time.";
				default:
					return "";
			}
		},
		submitExam: "Nộp bài",
		submitExamEarly: "Submit",
		listeningSectionShortLabel: "Listening",
		readingSectionShortLabel: "Reading",
		examQuestionOf: (current: number, total: number) =>
			`Questions ${current} of ${total}`,
		examQuestionRange: (start: number, end: number, total: number) =>
			start === end
				? `Questions ${start} of ${total}`
				: `Questions ${start} - ${end} of ${total}`,
		listeningItemInstruction: (part: number) => {
			switch (part) {
				case 1:
					return "Select the one statement that best describes what you see in the picture.";
				case 2:
					return "Select the best response to the question.";
				default:
					return "";
			}
		},
		partDirectionsTitle: (part: number, title: string) =>
			`Part ${part}: ${title}`,
		partDirectionsBody:
			"Đọc hướng dẫn và nhấn CONTINUE để bắt đầu. Trong phần Listening, bạn không thể quay lại câu trước.",
		partDirectionsBodyEn:
			"In this part you will hear short conversations and talks. You will hear each recording once, followed by a question and four answer choices. Select the best answer to each question. You cannot return to previous questions in the Listening section.",
		listeningPartDirectionsBodyEn: (part: number) => {
			switch (part) {
				case 1:
					return "In this part of the test, you will look at a photograph. You will hear four statements about each photograph. The statements will not be printed and will be spoken only one time. Select the statement that best describes the photograph.";
				case 2:
					return "You will hear a question or statement and three responses spoken in English. They will not appear on the screen and will be spoken only one time. Select the best response to each question or statement.";
				case 3:
					return "You will hear some conversations between two or more people. You will be asked to answer three questions about each conversation. The conversations will not be printed and will be spoken only one time.";
				case 4:
					return "You will hear some talks given by a single speaker. You will be asked to answer three questions about each talk. The talks will not be printed and will be spoken only one time.";
				default:
					return "You will hear each recording once. Select the best answer to each question. You cannot return to previous questions in the Listening section.";
			}
		},
		listeningPartDirectionsBody: (part: number) => {
			switch (part) {
				case 1:
					return "Bạn sẽ xem một bức ảnh và nghe bốn câu mô tả. Các câu mô tả không hiển thị trên màn hình và chỉ được phát một lần. Chọn câu mô tả đúng nhất về bức ảnh.";
				case 2:
					return "Bạn sẽ nghe một câu hỏi hoặc phát biểu và ba câu trả lời. Chúng không hiển thị trên màn hình và chỉ được phát một lần. Chọn câu trả lời phù hợp nhất.";
				case 3:
					return "Bạn sẽ nghe các hội thoại giữa hai hoặc nhiều người và trả lời ba câu hỏi về mỗi hội thoại. Hội thoại không in trên màn hình và chỉ được phát một lần.";
				case 4:
					return "Bạn sẽ nghe các bài nói của một người và trả lời ba câu hỏi về mỗi bài. Bài nói không in trên màn hình và chỉ được phát một lần.";
				default:
					return "Đọc hướng dẫn và nhấn CONTINUE để bắt đầu. Trong phần Listening, bạn không thể quay lại câu trước.";
			}
		},
		partDirectionsNoteVi:
			"Nhấn CONTINUE để bắt đầu. Trong phần Listening, bạn không thể quay lại câu trước.",
		readingDirectionsTitle: "Reading Section",
		readingDirectionsBody:
			"Bạn có 75 phút cho 100 câu hỏi Reading. Dùng NEXT để chuyển câu, REVIEW để xem danh sách câu hỏi.",
		readingDirectionsBodyEn:
			"In the Reading section, you will read passages and answer questions about them. You have 75 minutes to answer 100 questions. Use NEXT to go forward, BACK to review earlier questions, and REVIEW to see your progress.",
		listeningSectionLabel: "Listening Section",
		readingSectionLabel: "Reading Section",
		examResultTitle: "Kết quả bài thi",
		examResultListening: "Listening",
		examResultReading: "Reading",
		examResultTotal: "Tổng điểm",
		examResultExit: "Thoát",
		examResultBackToExam: "Quay lại",
		examResultReviewExplanations: "Xem giải thích",
		examScoreDetailTitle: "Chi tiết điểm bài thi",
		examScoreDetailOpenLabel: "Xem chi tiết điểm",
		examScoreDetailSectionScore: "Điểm",
		examExplanationReviewTitle: "Giải thích bài thi",
		examIncompleteTitle: "Chưa trả lời hết",
		examIncompleteDescription:
			"Bạn còn câu hỏi chưa trả lời. Nhấn vào câu để quay lại hoặc nộp bài.",
		examSubmitAnyway: "Vẫn nộp bài",
		examSubmitSectionConfirm: "Nộp phần Listening?",
		examSubmitSectionDescription:
			"Sau khi nộp, bạn không thể quay lại phần Listening.",
		examSubmitFinalConfirm: "Nộp bài thi?",
		examSubmitFinalDescription: "Xác nhận nộp toàn bộ bài thi Reading.",
		examSubmitEarlyConfirm: "Nộp bài thi sớm?",
		examSubmitEarlyDescription: (count: number) =>
			`Bạn còn ${count} câu chưa trả lời. Các câu bỏ trống sẽ không được tính điểm. Xác nhận nộp bài?`,
		examSubmitEarlyDescriptionComplete:
			"Tất cả câu hỏi đã được trả lời. Xác nhận nộp bài và xem kết quả?",
		examResultUnanswered: (count: number) => `${count} bỏ trống`,
		examResultWrong: (count: number) => `${count} sai`,
		examResultCorrect: (count: number) => `${count} đúng`,
		unanswered: "Chưa trả lời",
		marked: "Đánh dấu",
		current: "Hiện tại",
		reviewGridCorrect: "Đúng",
		reviewGridWrong: "Sai",
		navTabQuestions: "Danh sách câu hỏi",
		navTabScoreDetail: "Chi tiết",
		scoreDetailCategory: "Phân loại câu hỏi",
		scoreDetailSkipped: "Bỏ qua",
		scoreDetailAllQuestions: "Tất cả câu hỏi",
		scoreDetailUncategorized: "Chưa phân loại",
		scoreDetailPartSummary: (
			part: number,
			correct: number,
			total: number,
		) => `Part ${part} ${correct}/${total}`,
		listeningPartLabel: (part: number) => `Listening — Part ${part}`,
		readingPartLabel: (part: number) => `Reading — Part ${part}`,
	},
	session: {
		tutorNote: "Gợi ý",
		tutorHint:
			"Chú ý các mốc thời gian và động từ hành động trong đoạn văn. Đáp án thi thường diễn đạt lại cùng ý bằng từ ngữ khác.",
		listeningAudio: "Âm thanh Listening",
		replaysLeft: (count: number) => `Còn ${count} lượt nghe lại`,
		examLimitedReplays: "Chế độ Exam — nghe lại hạn chế",
		imagePlaceholder: "Ảnh minh họa cho Part 1–3",
		contextImageAlt: "Ảnh minh họa cho câu hỏi",
		imageLoadFailed: "Không tải được ảnh",
		audioLoadFailed: "Không tải được âm thanh",
		questionOf: (current: number, total: number) =>
			`Câu ${current} / ${total}`,
		questionRange: (start: number, end: number) =>
			start === end ? `Câu hỏi ${start}` : `Câu hỏi ${start}–${end}`,
		bilingualMode: "Dịch nghĩa",
		reviewStackedMode: "Xem lại",
		reviewPassageTranslationLabel: "Bản dịch",
		passageViewModeLabel: "Chế độ đọc đoạn văn",
		annotatorEnter: "Ghi chú",
		annotatorExit: "Thoát chế độ ghi chú",
		annotatorToolbarLabel: "Công cụ ghi chú",
		annotatorMouse: "Chuột",
		annotatorPen: "Bút",
		annotatorText: "Văn bản",
		annotatorEraser: "Tẩy",
		annotatorColor: "Màu",
		annotatorTextPlaceholder: "Nhập ghi chú…",
		progressOf: (current: number, total: number) => `${current} / ${total}`,
		listeningModeLabel: "Chế độ nghe",
		listeningPracticeModeExam: "Luyện thi",
		listeningPracticeModeCloze: "Nghe đục lỗ",
		listeningPracticeModeDictation: "Nghe chép",
		listeningPracticeModeTabsLabel: "Chế độ nghe",
		clozeRevealBlankLabel: "Nhấn để hiện từ",
		dictationCheckAnswer: "Kiểm tra",
		clozeMode: "Cloze",
		examMode: "Thi thử",
		clozeVisibilityLabel: "Ẩn/hiện thêm từ khóa",
		clozeHint: "Nghe từng đáp án và đoán nội dung.",
		transcriptClozeVisibilityLabel: "Ẩn/hiện thêm từ khóa",
		transcriptClozeHint: "Nghe audio rồi đoán nội dung.",
		playTranscriptAudio: "Nghe transcript",
		playAudio: "Phát",
		pauseAudio: "Tạm dừng",
		replayAudio: "Nghe lại",
		audioSeekLabel: "Vị trí phát audio",
		audioSeekSecondsUnit: "giây",
		audioShortcutReplay: "Nghe lại",
		audioShortcutPlayPause: "Phát / Tạm dừng",
		audioShortcutSeekBack: "Lùi 2 giây",
		audioShortcutSeekForward: "Tua 2 giây",
		audioShortcutCycleSpeed: "Đổi tốc độ phát",
		clozeToggleLabel: "Chế độ Cloze",
		playQuestionAudio: "Câu hỏi",
		playFullQuestionAudio: "Tất cả",
		playQuestionWithAnswersAudio: "Nghe câu hỏi và tất cả đáp án",
		playOptionAudio: (label: string) => `Nghe đáp án ${label}`,
		checkAnswer: "Kiểm tra",
		submitPractice: "Nộp bài",
		exitPracticeConfirmTitle: "Thoát phiên luyện tập?",
		exitPracticeConfirmDescription:
			"Tiến độ trả lời sẽ được lưu tạm. Bạn có chắc muốn thoát phiên luyện tập hiện tại?",
		exitPracticeConfirmStay: "Ở lại",
		exitPracticeConfirmLeave: "Thoát",
		incompleteSubmitTitle: "Chưa trả lời hết",
		incompleteSubmitDescription:
			"Bạn còn câu hỏi chưa trả lời. Hãy quay lại hoàn thành trước khi nộp bài.",
		incompleteSubmitEarlyDescription: (count: number) =>
			`Bạn còn ${count} câu chưa trả lời. Bạn vẫn có thể nộp bài sớm nếu muốn.`,
		unansweredListTitle: "Câu chưa trả lời",
		submitAnyway: "Vẫn nộp bài",
		resultTitle: "Kết quả",
		resultScore: (correct: number, total: number) =>
			`${correct} / ${total}`,
		resultWrong: (count: number) => `${count} câu sai`,
		resultUnanswered: (count: number) => `${count} câu chưa trả lời`,
		backToParts: "Quay lại chọn part",
		autoBackCountdown: (seconds: number) => `Trờ lại sau ${seconds} giây`,
		reviewAnswers: "Xem lại bài",
		explanationTitle: "Giải thích",
		explanationUpgradeToPro: "Nâng cấp lên Pro để xem giải thích",
		hintUpgradeToPro: "Nâng cấp lên Pro để xem gợi ý",
		// explanationReferenceTitle: "Trích dẫn",
		explanationFallback:
			"Chưa có giải thích cho câu hỏi này. Hãy thử suy luận lại từ đoạn văn và các đáp án.",
	},
	practice: {
		title: "Luyện tập",
		subtitle: "Luyện Listening và Reading theo từng part.",
		timerLabel: "Thời gian luyện tập",
		timerRemainingAria: "Thời gian còn lại",
		timerWarning: "Còn 5 phút.",
		feedback: {
			title: "Bài luyện này khó thế nào?",
			description:
				"Đánh giá độ khó giúp chúng tôi cải thiện nội dung và giúp học viên khác chọn bài phù hợp.",
			easyLabel: "Dễ",
			hardLabel: "Rất khó",
			submit: "Gửi phản hồi",
			skip: "Bỏ qua",
			guestHint:
				"Đăng nhập để gửi phản hồi. Bạn vẫn có thể bỏ qua và xem lại bài.",
			invalidScore: "Điểm độ khó phải từ 1 đến 10.",
			contentNotFound:
				"Không tìm thấy nội dung bài luyện. Vui lòng thử lại.",
			saving: "Đang gửi…",
		},
		difficulty: {
			barAriaLabel: (score: number) =>
				`Độ khó trung vị ${score.toFixed(1)} trên 10`,
		},
	},
	auth: {
		signIn: "Đăng nhập",
		signOut: "Đăng xuất",
		signInWithGoogle: "Đăng nhập với Google",
		signingIn: "Đang đăng nhập…",
		email: "Email",
		password: "Mật khẩu",
		signInFailed: "Email hoặc mật khẩu không đúng.",
		dialogTitle: "Chào mừng trở lại",
		dialogDescription:
			"Đăng nhập để lưu tiến độ luyện tập và đồng bộ trên mọi thiết bị.",
		brandSlogan:
			"Luyện TOEIC trong không gian yên tĩnh, tập trung và thoải mái.",
		brandFeatures: [
			"Lưu tiến độ từng part Listening và Reading",
			"Theo dõi kết quả luyện tập và thi thử",
			"Đồng bộ dữ liệu trên mọi thiết bị",
		],
		termsPrefix: "Bằng việc đăng nhập, bạn đồng ý với",
		termsLink: "Điều khoản sử dụng",
		termsAnd: "và",
		privacyLink: "Chính sách bảo mật",
		termsSuffix: "của chúng tôi.",
		authErrorTitle: "Không thể đăng nhập",
		authError:
			"Liên kết đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
		backHome: "Về trang chủ",
	},
	legal: {
		footerNav: "Thông tin pháp lý",
	},
	topbar: {
		streak: (days: number) => (days === 1 ? "1 ngày" : `${days} ngày`),
		planFree: "Free",
		planPro: "Pro",
	},
	upgrade: {
		title: "Nâng cấp lên Pro",
		caption:
			"Mở khoá tất cả tính năng để English Michael có thể hỗ trợ bạn tốt nhất chinh phục mục tiêu TOEIC",
		features: [
			"Review lại tất cả bài test",
			"AI phân tích đáp án và giải thích chi tiết",
			"Truy cập vào các bộ đề/bộ từ vựng 'xịn' do chính tác giả sưu tầm và chọn lọc",
		],
		contact: "Liên hệ",
		upgrade: "Nâng cấp",
	},
	dailyGoals: {
		title: "Mục tiêu hàng ngày",
		words: "Từ vựng",
		practice: "Luyện tập",
		exam: "Bài thi",
		goalMet: "Đã hoàn thành",
		goalNotMet: "Chưa hoàn thành",
		progressCount: (current: number, target: number) =>
			`${current} / ${target}`,
		settingsAction: "Cài đặt",
		settingsTitle: "Cài đặt mục tiêu hàng ngày",
		wordsTarget: "Số từ cần học",
		wordsTargetHint:
			"Tổng từ vựng hoàn thành trong ngày (Listening hoặc Reading).",
		practiceTarget: "Số buổi luyện tập",
		practiceTargetHint:
			"Buổi luyện Listening hoặc Reading hoàn thành trong ngày.",
		examTarget: "Số bài thi",
		examTargetHint: "Bài thi TOEIC hoàn thành trong ngày.",
		save: "Lưu mục tiêu",
		saving: "Đang lưu…",
		saved: "Đã lưu mục tiêu.",
		saveFailed: "Không thể lưu mục tiêu.",
		calendarPreviousMonth: "Tháng trước",
		calendarNextMonth: "Tháng sau",
		calendarWeekdays: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
	},
	lectures: {
		title: "Khoá học",
		subtitle:
			"Chương trình học được biên soạn tỉ mỉ để giúp bạn chinh phục số điểm mục tiêu.",
		continue: "Tiếp tục",
		continueLecture: "Tiếp tục bài giảng đang học",
		emptyCollections: "Chưa có khoá học nào được mở.",
		emptyLectures: "Khoá học này chưa có bài giảng.",
		progress: (finished: number, total: number) =>
			`${finished} / ${total} bài giảng xong`,
		stageRange: (start: number, end: number) => `Ngày ${start}–${end}`,
		scheduleKindLesson: "Bài học",
		scheduleKindPractice: "Luyện / test",
		scheduleKindRest: "Nghỉ",
		scheduleLegendSelected: "Đang chọn",
		day: (n: number) => `Ngày ${n}`,
		newGoal: "Bài mới",
		reviewGoal: "Ôn tập",
		enroll: "Bắt đầu ngay!",
		preview: "Lý thuyết",
		previewLoading: "Đang tải…",
		previewEmpty: "Chưa có nội dung xem trước.",
		emptyDay: "Chưa có bài giảng cho ngày này.",
		emptyDayCell: "Trống",
		previewBadge: "Mẫu",
		previewDay:
			"Lịch mẫu để xem giao diện. Gắn bài giảng thật trong CMS rồi tắt preview.",
		minutes: (count: number) => `${count} phút`,
		studyTimeTitle: "Thời gian học",
		studyTimeHours: (hours: number) => `${hours} giờ`,
		studyTimeHoursMinutes: (hours: number, minutes: number) =>
			`${hours} giờ ${minutes} phút`,
		studyTimeOf: (spent: string, target: string) => `${spent} / ${target}`,
		studyTimePercent: (percent: number) => `${percent}%`,
		studyTimeHint: (daily: string) => `Tối thiểu ${daily} mỗi ngày học`,
		lectureDue: "Cần hoàn thành",
		lectureDueWarning: "Bài này đã đến hạn.",
		open: "Làm bài",
		startLearning: "Bắt đầu",
		resumeLearning: "Tiếp tục",
		startTest: "Làm bài test",
		startDoing: "Làm bài test",
		startMiniTest: "Bắt đầu làm bài",
		testHeading: "Bài test",
		miniTestDescriptionTitle: "Mô tả",
		miniTestDisclaimerTitle: "Chuẩn bị",
		miniTestDescriptionFallback: (count: number) =>
			`Bài kiểm tra nhanh ${count} câu để ôn các kỹ năng của buổi này.`,
		miniTestDisclaimer:
			"Hãy chọn chỗ yên tĩnh và tập trung trước khi bắt đầu bài test.",
		review: "Xem lại",
		exerciseTitle: "Câu hỏi luyện tập",
		openExercise: "Luyện tập",
		reviewExercise: "Xem bài tập",
		exerciseCount: (count: number) => `${count} câu`,
		submit: "Kiểm tra",
		closeExercise: "Đóng",
		retry: "Làm lại",
		score: (correct: number, total: number) => `${correct} / ${total} đúng`,
		practiceResultTitle: "Kết quả luyện tập",
		practiceCompleteness: (percent: number) => `${percent}%`,
		finished: "Đã hoàn thành",
		backToCollections: "Tất cả khoá học",
		highlightHint: "Chọn nhãn, rồi bấm từng từ để tô.",
		exerciseGroup: (index: number, title: string) =>
			`Bài tập ${index}: ${title}`,
		exerciseKind: {
			multiple_choice: "Trắc nghiệm",
			highlight: "Tô từ",
			rewrite: "Viết lại câu",
			fill_blank: "Điền chỗ trống",
		},
		rewritePlaceholder: "Viết lại câu",
		expectedAnswer: "Đáp án",
		explanation: "Giải thích",
		incomplete: "Hãy trả lời hết các câu trước khi nộp.",
		sectionEmpty: "Phần này chưa có câu hỏi.",
		practiceEmpty: "Chưa có câu hỏi luyện đề.",
		vocabBack: "Xem lại từ vựng",
		vocabEmpty: "Bài này chưa có từ vựng.",
		vocabDone: "Đã luyện xong bộ từ.",
		vocabPracticePrompt: "Luyện tập thêm với các từ đã học.",
		vocabWord: "Tiếng anh",
		vocabCount: (count: number) =>
			count === 0 ? "Chưa có từ vựng" : `${count} từ`,
		vocabIpa: "Phiên âm",
		vocabType: "Loại từ",
		vocabMeaning: "Nghĩa",
		vocabExample: "Ví dụ",
		saveFailed: "Không lưu được tiến độ. Thử lại.",
		submitFailed: "Không nộp được bài. Thử lại.",
		tutorFailed: "Không trả lời được. Thử lại.",
		tutorProRequired: "Hỏi bài giảng dành cho tài khoản Pro.",
		tutorMessageRequired: "Hãy nhập câu hỏi.",
		tutorMessageTooLong: "Câu hỏi quá dài. Hãy rút ngắn rồi thử lại.",
		tutorOffTopicLabel: "Ngoài phạm vi bài đang học",
		tutorOffTopicAnswer:
			"Mình chỉ giải thích lý thuyết và bài tập của bài này, hoặc gợi ý bài tiếp theo trong khoá. Hãy hỏi về nội dung trên trang này.",
		tutorOffExamAnswer:
			"Mình không hỗ trợ IELTS hay kỳ thi khác. Hãy hỏi về bài TOEIC đang học.",
		tutorOffEnglishAnswer:
			"Mình chỉ hỗ trợ tiếng Anh TOEIC trong bài đang học. Hãy hỏi về lý thuyết hoặc bài tập trên trang này.",
		tutorTitle: "Michael AI",
		tutorOpen: "Mở hỏi bài giảng",
		tutorClose: "Đóng hỏi bài giảng",
		tutorThinking: "Đang trả lời…",
		tutorSuggestions: [
			"Giới từ sau interested là gì?",
			"Giải thích câu 3 giúp mình",
			"Nên học bài nào tiếp theo?",
		],
		tutorPlaceholder: "Hỏi về lý thuyết hoặc bài tập…",
		tutorSend: "Gửi",
		tutorSources: "Nguồn",
		tutorPractice: "Luyện tập",
		tutorOfferYes: "Có",
		tutorOfferNo: "Không",
		tutorPracticeEmpty: "Chưa có bài luyện tập phù hợp.",
		tutorPracticeFailed: "Không tải được bài luyện tập. Thử lại.",
		tutorPracticeSubmit: "Nộp",
		tutorRoundLimit: "Xóa lịch sử để bắt đầu đoạn chat mới.",
		tutorClearHistory: "Xóa lịch sử",
		tutorRateLimit: "Bạn gửi quá nhanh. Vui lòng chờ một chút.",
		tutorNext: "Bài tiếp theo",
	},
	notebook: {
		title: "Note",
		subtitle: "Ghi chú và tài liệu cá nhân.",
		defaultName: "Note",
		addNote: "Ghi chú",
		addFromVocab: "Thêm vào ghi chú",
		drawerTitle: "Thêm note",
		drawerEditTitle: "Sửa note",
		createTitle: "Tạo note",
		createDescription: "Đặt tên note để bắt đầu ghi chú.",
		createNameLabel: "Tên note",
		createSubmit: "Tạo note",
		loading: "Đang tải…",
		notebookLabel: "Notebook",
		selectNotebookPlaceholder: "Chọn note",
		addNewNotebook: "Tạo mới +",
		wordLabel: "Từ",
		termPlaceholder: "Nhập từ hoặc cụm",
		noteLabel: "Note",
		notePlaceholder: "# để gắn thẻ",
		addTag: "Thêm thẻ",
		lookup: "Tra nghĩa",
		lookupLoading: "Tra cứu…",
		lookupDrawerTitle: "Tra nghĩa",
		lookupMeaningVi: "Vi",
		lookupMeaningEn: "En",
		justNow: "vừa xong",
		closeAddToDeck: "Đóng",
		save: "Lưu",
		saved: "Đã lưu note.",
		viewSource: "Xem lại",
		emptyState:
			"Chưa có note. Chọn từ trong bài luyện tập và bấm Note để thêm.",
		searchPlaceholder: "Tìm từ hoặc thẻ…",
		filterAllTags: "Tất cả",
		deleteNote: "Xóa",
		editNote: "Sửa",
		deleteConfirmTitle: "Xóa note?",
		deleteConfirmDescription: (word: string) =>
			`Note cho "${word}" sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`,
		deleteConfirmCancel: "Hủy",
		deleteConfirmSubmit: "Xóa note",
		editTerm: "Sửa từ",
		removeTag: "Xóa thẻ",
		loadingNotes: "Đang tải note…",
		editingNote: "Đang sửa",
		noteListItem: (index: number) => `#${index}`,
		noteCount: (count: number) =>
			count === 1 ? "1 note" : `${count} note`,
		errors: {
			wordRequired: "Vui lòng nhập từ hoặc cụm.",
			noteRequired: "Vui lòng nhập note.",
			notebookRequired: "Vui lòng chọn note.",
			nameRequired: "Vui lòng nhập tên note.",
			tooManyTags: "Tối đa 2 thẻ cho mỗi note.",
			saveFailed: "Không thể lưu note.",
			deleteFailed: "Không thể xóa note.",
			lookupNotFound: "Không tìm thấy nghĩa tiếng Việt cho từ này.",
			lookupFailed: "Không thể tra cứu từ điển. Vui lòng thử lại.",
		},
	},
	user: {
		title: "Nhật ký học tập",
		signInTitle: "Đăng nhập để lưu nhật ký",
		signInDescription:
			"Đăng nhập để lưu điểm thi, kết quả luyện tập và từ vựng đã học trên mọi thiết bị.",
		signInButton: "Đăng nhập",
		journalLink: "Nhật ký học tập",
		settingsLink: "Cài đặt",
		settingsTitle: "Cài đặt",
		settingsSubtitle: "Tùy chọn và tùy biến tài khoản.",
		settingsGoalsTitle: "Mục tiêu hàng ngày",
		settingsGoalsDescription:
			"Các mục tiêu này quyết định khi nào một ngày được tính vào chuỗi học.",
		settingsNotificationsTitle: "Thông báo",
		settingsNotificationsDescription:
			"Chọn loại thông báo bạn muốn nhận trong ứng dụng.",
		notifications: {
			title: "Thông báo",
			subtitle: "Nhắc nhở học tập và cập nhật từ Michael TOEIC.",
			empty: "Chưa có thông báo nào.",
			markAllRead: "Đánh dấu đã đọc",
			clearAll: "Xóa tất cả",
			seeMore: "Xem thêm",
			unreadBadge: (count: number) =>
				count > 99 ? "99+" : String(count),
			unreadHeader: (count: number) =>
				count > 99 ? "(99+)" : `(${count})`,
			bellLabel: "Thông báo",
			prefs: {
				learningReminder: "Nhắc nhở học tập",
				learningReminderHint:
					"Mục tiêu ngày, từ vựng đến hạn, luyện tập và thi lại.",
				contentRelease: "Nội dung mới",
				contentReleaseHint: "Sách / đề thi mới được phát hành.",
				marketing: "Ưu đãi & tin tức",
				marketingHint: "Thông báo khuyến mãi và tin từ Michael TOEIC.",
			},
			errors: {
				generic: "Không thể cập nhật thông báo.",
				savePrefsFailed: "Không thể lưu tùy chọn thông báo.",
				clearFailed: "Không thể xóa thông báo.",
			},
		},
		levelTitle: "Trình độ hiện tại",
		historyTitle: "Lịch sử",
		achievementsTitle: "Thành tích",
		emptyHistory:
			"Chưa có hoạt động nào. Hãy luyện tập hoặc làm bài thi để bắt đầu.",
		latestExam: "Điểm thi gần nhất",
		bestExam: "Điểm cao nhất",
		listeningScore: "Listening",
		readingScore: "Reading",
		weakestPart: "Part cần cải thiện",
		wordsLearned: "Từ đã học",
		noData: "—",
		noExamYet: "Chưa có bài thi",
		partStrength: {
			title: "Part",
			infoAction: "Mục tiêu Part",
			targets: {
				600: "600+",
				700: "700+",
				800: "800+",
			},
			columns: {
				part: "Part",
				score: "Điểm",
			},
		},
		examProgress: {
			title: "Tiến bộ",
			empty: "Chưa có bài thi nào để so sánh tiến bộ.",
			columns: {
				time: "Lần thi",
				exam: "Đề thi",
				part: (part: number) => `P${part}`,
				listening: "LC",
				reading: "RC",
				total: "Tổng",
			},
		},
		noWeakPartYet: "Chưa đủ dữ liệu",
		studyStreak: (days: number) =>
			days === 1 ? "1 ngày liên tiếp" : `${days} ngày liên tiếp`,
		testsCompleted: (count: number) => `${count} bài thi hoàn thành`,
		practiceSessions: (count: number) => `${count} buổi luyện tập`,
		vocabularyMilestone: (count: number) => `Đã học ${count}+ từ`,
		activityExam: "Bài thi",
		activityPractice: "Luyện tập",
		activityVocabulary: "Từ vựng",
		historyPracticeSummary: (
			correct: number,
			total: number,
			part: number | null,
		) =>
			part != null
				? `Part ${part} — ${correct}/${total} đúng`
				: `${correct}/${total} đúng`,
		historyVocabularySummary: (words: number) => `${words} từ đã luyện`,
		errors: {
			notSignedIn: "Bạn cần đăng nhập để lưu nhật ký.",
			saveFailed: "Không thể lưu hoạt động học tập.",
		},
	},
	classes: {
		title: "Lớp học",
		subtitle: "Quản lý học viên và theo dõi tiến độ hoàn thành.",
		backToClass: "Quay lại lớp",
		backToList: "Quay lại danh sách lớp",
		createClass: "Tạo lớp mới",
		list: {
			subtitle: "Tạo và quản lý các lớp học của bạn.",
			studentSubtitle: "Các lớp bạn đã tham gia.",
			empty: "Bạn chưa có lớp nào. Tạo lớp đầu tiên để bắt đầu.",
			studentEmpty: "Bạn chưa được thêm vào lớp nào.",
			createdAt: "Tạo ngày",
		},
		proRequired: {
			title: "Cần tài khoản Pro",
			description:
				"Quản lý lớp học dành cho giáo viên Pro. Nâng cấp để tạo lớp, thêm học viên và giao bài tập.",
		},
		createDialog: {
			title: "Tạo lớp mới",
			description: "Đặt tên và mô tả ngắn cho lớp học.",
			nameLabel: "Tên lớp",
			namePlaceholder: "VD: Lớp TOEIC tháng 7",
			descriptionLabel: "Mô tả",
			descriptionPlaceholder: "Ghi chú cho lớp (tuỳ chọn)",
			submit: "Tạo lớp",
			cancel: "Hủy",
		},
		finishedTime: {
			seconds: (seconds: number) => `${seconds}s`,
			minutesSeconds: (minutes: number, seconds: number) =>
				`${minutes}p ${seconds}s`,
		},
		scoreDetail: {
			examSections: (listening: number, reading: number) =>
				`L: ${listening} · R: ${reading}`,
			partScore: (part: number, correct: number, total: number) =>
				`Part ${part}: ${correct}/${total}`,
		},
		stats: {
			students: "Học viên",
			examsThisWeek: "Bài thi tuần này",
			recentActivity: "Hoạt động gần đây",
		},
		students: {
			title: "Danh sách học viên",
			add: "Thêm học viên",
			edit: "Sửa thông tin",
			remove: "Xóa khỏi lớp",
			restore: "Khôi phục",
			viewProgress: "Xem tiến độ",
			empty: "Chưa có học viên trong lớp.",
			searchPlaceholder: "Tìm theo tên hoặc email…",
			emptySearch: "Không tìm thấy học viên.",
			pageOf: (page: number, pageCount: number) =>
				`Trang ${page} / ${pageCount}`,
			previousPage: "Trang trước",
			nextPage: "Trang sau",
			columns: {
				name: "Tên",
				lastTest: "Bài thi gần nhất",
				score: "Điểm",
				actions: "Thao tác",
			},
			statusRemoved: "Đã xóa",
		},
		addDialog: {
			title: "Thêm học viên",
			description: "Nhập email Google đã đăng ký trên hệ thống.",
			emailLabel: "Email",
			emailPlaceholder: "student@example.com",
			submit: "Thêm",
			cancel: "Hủy",
		},
		editDialog: {
			title: "Sửa học viên",
			description: "Cập nhật tên hiển thị hoặc mã học viên.",
			nameLabel: "Tên hiển thị",
			namePlaceholder: "Tên trong lớp",
			studentIdLabel: "Mã học viên",
			studentIdPlaceholder: "VD: HV-001",
			submit: "Lưu",
			cancel: "Hủy",
		},
		removeDialog: {
			title: "Xóa học viên khỏi lớp?",
			description: (name: string) =>
				`${name} sẽ không còn trong danh sách lớp. Lịch sử học tập vẫn được giữ.`,
			confirm: "Xóa khỏi lớp",
			cancel: "Hủy",
		},
		studentDetail: {
			title: "Chi tiết học viên",
			joinedAt: "Tham gia",
			stats: {
				exams: "Bài thi",
				practice: "Luyện tập",
				words: "Từ vựng",
				latestExam: "Điểm thi gần nhất",
			},
			activityTitle: "Lịch sử hoạt động",
			examProgressTitle: "Tiến bộ",
			activityEmpty: "Chưa có hoạt động nào được ghi nhận.",
			columns: {
				type: "Loại",
				test: "Bài test",
				summary: "Kết quả",
				scoreDetail: "Chi tiết điểm",
				finishedTime: "Thời gian làm bài",
				completedAt: "Hoàn thành",
			},
		},
		activityType: {
			exam: "Bài thi",
			practice: "Luyện tập",
			vocabulary: "Từ vựng",
		},
		assignments: {
			title: "Bài tập",
			create: "Tạo bài tập",
			edit: "Sửa bài tập",
			empty: "Chưa có bài tập nào.",
			studentEmpty: "Chưa có bài tập cần làm.",
			due: "Hạn nộp",
			dueOverdue: "Đã hết hạn",
			dueRemainingDaysHours: (days: number, hours: number) =>
				hours > 0
					? `Còn ${days} ngày ${hours} giờ`
					: `Còn ${days} ngày`,
			dueRemainingHoursMinutes: (hours: number, minutes: number) =>
				minutes > 0
					? `Còn ${hours} giờ ${minutes} phút`
					: `Còn ${hours} giờ`,
			dueRemainingMinutes: (minutes: number) => `Còn ${minutes} phút`,
			attemptLimit: "Số lần làm",
			submittedCount: (submitted: number, total: number) =>
				`${submitted} / ${total} đã nộp`,
			attemptsUsed: (used: number, limit: number) =>
				`${used} / ${limit} lần`,
			score: (correct: number, total: number) =>
				`${correct}/${total} đúng`,
			publish: "Xuất bản",
			close: "Đóng bài",
			delete: "Xóa",
			saveDraft: "Lưu nháp",
			results: "Kết quả",
			start: "Làm bài",
			resume: "Tiếp tục",
			review: "Xem lại",
			locked: "Không thể làm",
			submit: "Nộp bài",
			next: "Câu sau",
			previous: "Câu trước",
			questionIndex: (current: number, total: number) =>
				`Câu ${current} / ${total}`,
			questionTotal: (total: number) => `${total} câu`,
			answeredStatus: (answered: number, total: number) =>
				`${answered}/${total}`,
			submitEarlyConfirm: (unanswered: number, total: number) =>
				`Bạn còn ${unanswered}/${total} câu chưa chọn. Vẫn nộp bài?`,
			explanationLabel: "Giải thích",
			yourAnswer: "Bạn chọn",
			correctAnswer: "Đáp án đúng",
			unanswered: "Chưa chọn",
			status: {
				draft: "Nháp",
				published: "Đã xuất bản",
				closed: "Đã đóng",
				notStarted: "Chưa làm",
				inProgress: "Đang làm",
				submitted: "Đã nộp",
				late: "Trễ hạn",
				overdue: "Hết hạn",
			},
			editor: {
				title: "Tạo bài tập",
				editTitle: "Sửa bài tập",
				nameLabel: "Tiêu đề",
				namePlaceholder: "VD: Part 5 — Tuần 3",
				descriptionLabel: "Mô tả",
				descriptionPlaceholder: "Ghi chú cho học viên (tuỳ chọn)",
				dueLabel: "Hạn nộp",
				attemptLabel: "Số lần làm tối đa",
				questionsTitle: "Câu hỏi Part 5",
				addQuestion: "Thêm câu",
				addFromBank: "Thêm từ exam",
				removeQuestion: "Xóa câu",
				bankBook: "Bộ đề",
				bankTest: "Đề",
				bankQuestionNo: "Câu số",
				bankPreview: "Xem trước",
				bankAdd: "Thêm câu",
				bankEmpty: "Chọn bộ đề, đề và số câu để xem trước.",
				bankCorrect: "Đáp án đúng",
				stemLabel: "Câu hỏi",
				stemPlaceholder: "Nhập câu điền từ / ngữ pháp…",
				optionLabel: "Đáp án đúng",
				explanationLabel: "Giải thích",
				explanationPlaceholder: "Giải thích đáp án (tuỳ chọn)",
				emptyQuestions: "Thêm ít nhất một câu hỏi trước khi xuất bản.",
				listMode: "Editor",
				previewMode: "Preview",
				previewEmpty: "Chưa có câu hỏi đủ nội dung để xem trước.",
			},
			resultsTitle: "Kết quả bài tập",
			resultsEmpty: "Chưa có học viên nộp bài.",
			columns: {
				name: "Học viên",
				status: "Trạng thái",
				score: "Điểm",
				submittedAt: "Nộp lúc",
				attempts: "Lần làm",
			},
		},
		errors: {
			notSignedIn: "Bạn cần đăng nhập.",
			notTeacher: "Bạn không có quyền quản lý lớp học.",
			notPro: "Bạn cần tài khoản Pro để quản lý lớp học.",
			notClassTeacher: "Bạn không có quyền quản lý lớp này.",
			notClassMember: "Bạn không thuộc lớp này.",
			classNameRequired: "Vui lòng nhập tên lớp.",
			generic: "Không thể thực hiện thao tác.",
			userNotFound: "Không tìm thấy tài khoản với email này.",
			alreadyMember: "Học viên đã có trong lớp.",
			assignmentTitleRequired: "Vui lòng nhập tiêu đề bài tập.",
			assignmentDueRequired: "Vui lòng chọn hạn nộp.",
			assignmentAttemptLimit: "Số lần làm phải từ 1 trở lên.",
			assignmentQuestionsRequired:
				"Cần ít nhất một câu hỏi đầy đủ (đề, bốn đáp án, một đáp án đúng).",
			assignmentNotFound: "Không tìm thấy bài tập.",
			assignmentNotEditable:
				"Không thể sửa câu hỏi sau khi đã có bài nộp.",
			assignmentCannotStart: "Bạn không thể bắt đầu bài tập này.",
			assignmentCannotSubmit: "Bạn không thể nộp bài tập này.",
			assignmentClosed: "Bài tập đã đóng.",
			bankQuestionNotFound:
				"Không tìm thấy câu Part 5 này trong ngân hàng đề.",
			bankQuestionIncomplete:
				"Câu này chưa đủ nội dung hoặc đáp án đúng.",
		},
		notifications: {
			assignmentPublishedTitle: "Bài tập mới",
			assignmentPublishedBody: (title: string) =>
				`Giáo viên vừa giao bài: ${title}`,
		},
	},
	admin: {
		title: "ADMIN",
		subtitle: "Import PDF đề, nội dung và quản lý CMS.",
		backToApp: "Về app học",
		nav: {
			dashboard: "Tổng quan",
			listening: "Listening",
			reading: "Reading",
			exams: "Bộ đề",
			entranceTest: "Đề đầu vào",
			answerKeys: "Đáp án",
			vocab: "Từ vựng",
			courses: "Khoá học",
			blog: "Blog",
			users: "Học viên",
			subscriptions: "Gói đăng ký",
			notifications: "Thông báo",
			classes: "Lớp học",
		},
		dashboard: "Tổng quan",
		dashboardIntro:
			"Quản lý Listening, Reading và đề thi (import PDF qua Gemini).",
		overview: {
			manage: "Quản lý",
			metrics: {
				users: "Học viên",
				pro: "Pro",
				liveExam: "Đang thi",
				tests: "Bài test",
				newRegistrationsToday: (count: number) =>
					`${count} đăng ký mới`,
				newProToday: (count: number) => `${count} đăng ký Pro mới`,
				liveExamInProgress: "Học viên đang làm bài thi",
				testsAvailable: "Có sẵn cho học viên",
			},
			todayLists: {
				registrationsTitle: "Đăng ký mới hôm nay",
				proTitle: "Đăng ký Pro mới hôm nay",
				description: (count: number) => `${count} học viên`,
				emptyRegistrations: "Chưa có học viên đăng ký mới hôm nay.",
				emptyPro: "Chưa có đăng ký Pro mới hôm nay.",
				openRegistrations: "Xem danh sách đăng ký mới hôm nay",
				openPro: "Xem danh sách đăng ký Pro mới hôm nay",
				columns: {
					user: "Học viên",
					time: "Thời gian",
					periodEnd: "Hết hạn",
				},
			},
			chart: {
				title: "Học viên mới",
				range7: "7 ngày",
				range30: "30 ngày",
			},
			examAttempts: {
				title: "Lượt thi",
				empty: "Chưa có lượt thi.",
				columns: {
					test: "Bài test",
					attempts: "Lượt thi",
					lastTakenAt: "Gần nhất",
					highest: "Cao nhất",
					lowest: "Thấp nhất",
				},
				sortBy: (column: string, direction: "asc" | "desc") =>
					`Sắp xếp ${column} ${direction === "asc" ? "tăng dần" : "giảm dần"}`,
				studentsDialog: {
					empty: "Chưa có học viên làm bài này.",
					description: (studentCount: number) =>
						`${studentCount} học viên`,
					openDetails: (testName: string) =>
						`Xem học viên đã làm ${testName}`,
					searchPlaceholder: "Tìm tên…",
					searchEmpty: "Không tìm thấy học viên phù hợp.",
					columns: {
						user: "Học viên",
						time: "Thời gian",
						totalScore: "Tổng điểm",
					},
				},
			},
			liveExams: {
				title: "Đang thi",
				empty: "Không có học viên nào đang làm bài thi.",
				count: (value: number) => `${value} học viên`,
				sectionListening: "Listening",
				sectionReading: "Reading",
				elapsedUnderMinute: "< 1 phút",
				elapsedMinutes: (minutes: number) => `${minutes} phút`,
				elapsedHoursMinutes: (hours: number, minutes: number) =>
					`${hours} giờ ${minutes} phút`,
				columns: {
					name: "Học viên",
					test: "Bài test",
					section: "Phần",
					elapsed: "Thời gian",
				},
			},
		},
		comingSoonAction: "Sắp có",
		emptyTable: "Chưa có dữ liệu hiển thị.",
		actions: {
			add: "Thêm mới",
			refresh: "Làm mới",
			filter: "Lọc",
			publish: "Publish",
			manage: "Quản lý",
			view: "Xem chi tiết",
		},
		listening: {
			title: "Listening",
			subtitle: "Luyện chung và nội dung đề — parts 1–4.",
			commonPractice: "Luyện chung",
			examBooks: "Bộ đề thi",
			addPractice: "Thêm bài luyện",
			publishListening: "Publish Listening",
			unpublishListening: "Gỡ publish Listening",
		},
		reading: {
			title: "Reading",
			subtitle: "Luyện chung và nội dung đề — parts 5–7.",
			commonPractice: "Luyện chung",
			examBooks: "Bộ đề thi",
			addPractice: "Thêm bài luyện",
			publishReading: "Publish Reading",
			unpublishReading: "Gỡ publish Reading",
		},
		commonPractice: {
			createTitle: "Thêm bài luyện chung",
			createDescription:
				"Tạo bài luyện không thuộc đề thi đầy đủ (book common).",
			label: "Tên hiển thị",
			slug: "Mã (tùy chọn)",
			slugHint: "Để trống sẽ tự tạo practice-xxxxxxxx",
			create: "Tạo",
			empty: "Chưa có bài luyện chung.",
		},
		entranceTest: {
			title: "Đề đầu vào",
			selectHint: "Chọn bài test. Import PDF qua nút Thêm.",
		},
		exams: {
			title: "Exam",
			selectHint: "Chọn bộ đề và bài test. Import PDF qua nút Thêm.",
			importAdd: "Import nội dung",
			addTest: "Thêm đề mới",
			uploadAllTest: "Upload toàn bộ đề",
			create: {
				title: "Thêm đề mới",
				uploadAllTitle: "Upload toàn bộ đề",
				book: "Bộ đề",
				bookNew: "Mới…",
				bookName: "Tên bộ đề",
				test: "Bài test",
				uploadSectionTitle: "Upload PDF",
				applyTranslationLabel: "Translate",
				applyTranslationReviewOn: "Có",
				applyTranslationReviewOff: "Không",
				applyTranslationReviewLabel: (moduleTitle: string) =>
					`Dịch — ${moduleTitle}`,
				applyVocabularyLabel: "Get vocab",
				applyVocabularyReviewOn: "Có",
				applyVocabularyReviewOff: "Không",
				applyVocabularyReviewLabel: (moduleTitle: string) =>
					`Từ vựng — ${moduleTitle}`,
				pdfRequired: "Chọn ít nhất một file PDF.",
				pdfInvalidType: "Chỉ chấp nhận file PDF.",
				pdfTooLarge: "File PDF quá lớn (tối đa 100MB).",
				geminiMissingApiKey:
					"Chưa cấu hình GEMINI_API_KEY trên máy chủ.",
				geminiInvalidJson: "Gemini trả về JSON không hợp lệ.",
				geminiFailed: "Không thể trích xuất nội dung từ PDF.",
				geminiCopyrightBlocked:
					"Gemini chặn yêu cầu do nội dung bản quyền. Hãy thử lại với PDF khác hoặc model dự phòng.",
				geminiCopyrightBlockedReadingPart7:
					"Gemini chặn yêu cầu do nội dung bản quyền. Hãy thử lại với PDF đã tách đúng phạm vi (147–175 và 176–200).",
				readingPart7PdfSingle: "P7 — Đoạn đơn (147–175)",
				readingPart7PdfMulti: "P7 — Đoạn đôi/ba (176–200)",
				readingPart7BothPdfsRequired:
					"Part 7 cần cả hai file PDF (147–175 và 176–200).",
				listeningPart3ProcessInvalidJson:
					"JSON Part 3 process không đúng định dạng.",
				listeningPart3ProcessMissingGroup: (questionId: string) =>
					`Thiếu conversation group ${questionId} trong JSON process.`,
				listeningPart3ProcessMissingTopic: (questionId: string) =>
					`Group ${questionId}: thiếu topic.`,
				listeningPart3ProcessMissingQuestion: (questionId: string) =>
					`Thiếu câu ${questionId} trong JSON process.`,
				listeningPart3ProcessMissingAnswer: (questionId: string) =>
					`Câu ${questionId}: thiếu correctOptionLabel.`,
				listeningPart3ProcessInvalidAnswer: (
					questionId: string,
					label: string,
				) =>
					`Câu ${questionId}: correctOptionLabel "${label}" không hợp lệ hoặc không có trong options.`,
				listeningPart3ProcessMissingExplanation: (questionId: string) =>
					`Câu ${questionId}: thiếu explanation (reasoning + reference).`,
				listeningPart3ProcessMissingExplanationAnswer: (
					questionId: string,
				) =>
					`Câu ${questionId}: explanation thiếu kết luận "Đáp án đúng là X".`,
				listeningPart3ProcessExplanationMismatch: (
					questionId: string,
					answer: string,
					explanation: string,
				) =>
					`Câu ${questionId}: correctOptionLabel ${answer} không khớp explanation (${explanation}).`,
				listeningPart3ProcessMissingHint: (questionId: string) =>
					`Câu ${questionId}: thiếu hint.`,
				listeningPart3ProcessHintRevealsAnswer: (
					questionId: string,
					label: string,
				) => `Câu ${questionId}: hint tiết lộ đáp án ${label}.`,
				listeningPart3ProcessMissingSkillsOrFocus: (
					questionId: string,
				) => `Câu ${questionId}: thiếu skills (1–3) hoặc focus.`,
				listeningPart3ProcessNotQualifiedPrefix:
					"JSON Part 3 process chưa đạt chuẩn",
				listeningPart3ProcessNotQualified: (
					issueCount: number,
					preview: string,
				) =>
					`JSON Part 3 process chưa đạt chuẩn (${issueCount} lỗi). ${preview}`,
				applyProcessReviewLabel: (moduleTitle: string) =>
					`Process — ${moduleTitle}`,
				applyProcessReviewAlways: "Tự động",
				readingPart7SegmentInvalidJson:
					"JSON Part 7 segment không đúng định dạng.",
				readingPart7SegmentWrongPart: "JSON segment phải có part: 7.",
				readingPart7SegmentEmptySets: "JSON segment thiếu passageSets.",
				readingPart7SegmentQuestionCount: (
					segmentId: string,
					expected: number,
					actual: number,
				) =>
					`${segmentId}: cần ${expected} câu, nhưng JSON có ${actual} câu.`,
				readingPart7SegmentPassageCount: (
					segmentId: string,
					min: number,
					max: number,
					actual: number,
				) =>
					`${segmentId}: mỗi set cần ${min}–${max} đoạn văn, nhưng có set với ${actual} đoạn.`,
				readingPart7SegmentEmptyQuestions: (segmentId: string) =>
					`${segmentId}: có passage set không có câu hỏi.`,
				readingPart7SegmentMissingGlobal: (segmentId: string) =>
					`${segmentId}: thiếu globalItemNumber trên một câu hỏi.`,
				readingPart7SegmentMissingNumberInPart: (segmentId: string) =>
					`${segmentId}: thiếu globalItemNumber trên một câu hỏi.`,
				readingPart7SegmentGlobalRange: (
					segmentId: string,
					first: number,
					last: number,
					actual: number,
				) =>
					`${segmentId}: globalItemNumber ${actual} ngoài phạm vi ${first}–${last}.`,
				readingPart7SegmentNumberInPartRange: (
					segmentId: string,
					first: number,
					last: number,
					actual: number,
				) =>
					`${segmentId}: globalItemNumber ${actual} ngoài phạm vi ${first}–${last}.`,
				readingPart7SegmentDuplicateGlobal: (
					globalItemNumber: number,
				) =>
					`Trùng globalItemNumber ${globalItemNumber} trong JSON segment.`,
				readingPart7SegmentDuplicateNumberInPart: (
					globalItemNumber: number,
				) =>
					`Trùng globalItemNumber ${globalItemNumber} trong JSON segment.`,
				readingPart7ExtractMissingPassageTitle: (segmentId: string) =>
					`${segmentId}: thiếu title trên một đoạn văn.`,
				readingPart7ExtractMissingPassageContent: (segmentId: string) =>
					`${segmentId}: thiếu content trên một đoạn văn.`,
				readingPart7ExtractMissingPrompt: (
					segmentId: string,
					globalItemNumber?: number,
				) =>
					globalItemNumber !== undefined
						? `${segmentId}: câu ${globalItemNumber} thiếu prompt.`
						: `${segmentId}: một câu thiếu prompt.`,
				readingPart7ExtractInvalidOptions: (
					segmentId: string,
					globalItemNumber?: number,
				) =>
					globalItemNumber !== undefined
						? `${segmentId}: câu ${globalItemNumber} cần đủ 4 options A–D với text.`
						: `${segmentId}: một câu cần đủ 4 options A–D với text.`,
				readingPart7ExtractNotQualifiedPrefix:
					"JSON Part 7 extract chưa đạt chuẩn",
				readingPart7ExtractNotQualified: (
					issueCount: number,
					preview: string,
				) =>
					`JSON Part 7 extract chưa đạt chuẩn (${issueCount} lỗi). ${preview}`,
				readingPart7ProcessInvalidJson:
					"JSON Part 7 process không đúng định dạng.",
				readingPart7ProcessMissingSet: (questionId: string) =>
					`Thiếu passage set ${questionId} trong JSON process.`,
				readingPart7ProcessMissingTopic: (questionId: string) =>
					`Set ${questionId}: thiếu topic.`,
				readingPart7ProcessMissingPassage: (
					questionId: string,
					passageSlug: string,
				) => `Set ${questionId}: thiếu passage ${passageSlug}.`,
				readingPart7ProcessMissingPassageTranslation: (
					questionId: string,
					passageSlug: string,
				) =>
					`Set ${questionId}: passage ${passageSlug} thiếu passageTranslation hoặc translations[].`,
				readingPart7ProcessMissingQuestion: (questionId: string) =>
					`Thiếu câu ${questionId} trong JSON process.`,
				readingPart7ProcessMissingAnswer: (questionId: string) =>
					`Câu ${questionId}: thiếu correctOptionLabel.`,
				readingPart7ProcessInvalidAnswer: (
					questionId: string,
					label: string,
				) =>
					`Câu ${questionId}: correctOptionLabel "${label}" không hợp lệ hoặc không có trong options.`,
				readingPart7ProcessMissingExplanation: (questionId: string) =>
					`Câu ${questionId}: thiếu explanation (reasoning + reference).`,
				readingPart7ProcessMissingExplanationAnswer: (
					questionId: string,
				) =>
					`Câu ${questionId}: explanation thiếu kết luận "Đáp án đúng là X".`,
				readingPart7ProcessExplanationMismatch: (
					questionId: string,
					answer: string,
					explanation: string,
				) =>
					`Câu ${questionId}: correctOptionLabel ${answer} không khớp explanation (${explanation}).`,
				readingPart7ProcessMissingHint: (questionId: string) =>
					`Câu ${questionId}: thiếu hint.`,
				readingPart7ProcessHintRevealsAnswer: (
					questionId: string,
					label: string,
				) => `Câu ${questionId}: hint tiết lộ đáp án ${label}.`,
				readingPart7ProcessMissingSkillsOrFocus: (questionId: string) =>
					`Câu ${questionId}: thiếu skills (1–3) hoặc focus.`,
				readingPart7ProcessNotQualifiedPrefix:
					"JSON Part 7 process chưa đạt chuẩn",
				readingPart7ProcessNotQualified: (
					issueCount: number,
					preview: string,
				) =>
					`JSON Part 7 process chưa đạt chuẩn (${issueCount} lỗi). ${preview}`,
				geminiRateLimited:
					"Gemini đang quá tải hoặc vượt giới hạn. Đã thử lại với backoff — vui lòng đợi vài phút rồi thử lại.",
				readingPartInvalid: (part: number) =>
					`JSON Part ${part} không đúng định dạng.`,
				readingPartWrongPart: (expected: number, actual: number) =>
					`File JSON phải là Part ${expected} (nhận Part ${actual}).`,
				readingPart5InvalidJson:
					"JSON Part 5 không đúng định dạng (thiếu part: 5 hoặc questions).",
				readingPart5QuestionCount: (expected: number, actual: number) =>
					`Part 5 cần ${expected} câu, nhưng JSON có ${actual} câu.`,
				readingPart5MissingAnswer: (globalItemNumber?: number) =>
					globalItemNumber !== undefined
						? `Câu ${globalItemNumber}: thiếu correctOptionLabel (bắt buộc).`
						: "Một câu thiếu correctOptionLabel (bắt buộc).",
				readingPart5InvalidAnswerLabel: (
					globalItemNumber: number | undefined,
					label: string,
				) =>
					globalItemNumber !== undefined
						? `Câu ${globalItemNumber}: correctOptionLabel "${label}" không hợp lệ.`
						: `correctOptionLabel "${label}" không hợp lệ.`,
				readingPart5AnswerNotInOptions: (
					globalItemNumber: number | undefined,
					label: string,
				) =>
					globalItemNumber !== undefined
						? `Câu ${globalItemNumber}: đáp án ${label} không có trong options.`
						: `Đáp án ${label} không có trong options.`,
				readingPart5MissingExplanationAnswer: (
					globalItemNumber?: number,
				) =>
					globalItemNumber !== undefined
						? `Câu ${globalItemNumber}: explanation thiếu kết luận "Đáp án phù hợp nhất là X".`
						: 'Explanation thiếu kết luận "Đáp án phù hợp nhất là X".',
				readingPart5ExplanationMismatch: (
					globalItemNumber: number | undefined,
					answer: string,
					explanation: string,
				) =>
					globalItemNumber !== undefined
						? `Câu ${globalItemNumber}: correctOptionLabel ${answer} không khớp explanation (${explanation}).`
						: `correctOptionLabel ${answer} không khớp explanation (${explanation}).`,
				readingPart5HintRevealsAnswer: (
					globalItemNumber: number | undefined,
					label: string,
				) =>
					globalItemNumber !== undefined
						? `Câu ${globalItemNumber}: hint tiết lộ đáp án ${label}.`
						: `Hint tiết lộ đáp án ${label}.`,
				readingPart5MissingBlank: (globalItemNumber?: number) =>
					globalItemNumber !== undefined
						? `Câu ${globalItemNumber}: prompt thiếu blank marker -------.`
						: "Một câu thiếu blank marker ------- trong prompt.",
				readingPart5NotQualifiedPrefix: "JSON Part 5 chưa đạt chuẩn",
				readingAnswerKeyBookTestRequired:
					"Thiếu bookId/testId để tải đáp án từ DB. Hãy chạy lại bước khởi tạo đề hoặc cập nhật module từ trang Exam.",
				readingPart5NotQualified: (
					issueCount: number,
					preview: string,
				) =>
					`JSON Part 5 chưa đạt chuẩn (${issueCount} lỗi). ${preview}`,
				readingPart5ValidationRetrying: (
					attempt: number,
					maxAttempts: number,
				) =>
					`Thử lại lần ${attempt}/${maxAttempts} — kết quả chưa đạt chuẩn, đang gọi lại Gemini…`,
				listeningPart12JsonInvalid:
					"JSON Part 1–2 không đúng định dạng (mảng [Part 1, Part 2] hoặc object có parts 1 và 2).",
				listeningPart12JsonPartsOnly12:
					"JSON Part 1–2 chỉ chấp nhận Part 1 và 2.",
				listeningPart12JsonRequires12:
					"JSON Part 1–2 phải có cả Part 1 và Part 2.",
				listeningPartJsonPartsOnly12: (part: number) =>
					`JSON Part ${part} không được chứa Part 2, 3, 4 hoặc part khác.`,
				listeningJsonInvalid:
					"JSON Part 3–4 không đúng định dạng (parts 3 và 4).",
				listeningJsonPartsOnly34:
					"JSON Part 3–4 chỉ chấp nhận Part 3 và 4.",
				listeningJsonRequires34:
					"JSON Listening phải có cả Part 3 và Part 4.",
				listeningPartJsonInvalid: (part: number) =>
					`JSON Part ${part} không đúng định dạng (object Part ${part} hoặc { parts: [Part ${part}] }).`,
				listeningPartJsonWrongPart: (
					expected: number,
					actual: number,
				) =>
					`File JSON phải là Part ${expected} (nhận Part ${actual}).`,
				listeningPartJsonPartsOnly34: (part: number) =>
					`JSON Part ${part} không được chứa Part 1, 2 hoặc part khác.`,
				listeningAudioTooLarge:
					"Mỗi file audio Listening tối đa 50MB. Hãy nén hoặc chia nhỏ file rồi thử lại.",
				submit: "Tạo",
				submitting: "Đang tạo…",
				submitFailed:
					"Không nhận được phản hồi từ máy chủ. Kiểm tra danh sách đề hoặc thử lại.",
				requestTimeout:
					"Yêu cầu mất quá nhiều thời gian. Nếu vừa restart dev server, thử lại — timeout đã được tăng lên 5 phút.",
				uploadBodyTooLarge:
					"File upload quá lớn hoặc tổng dung lượng vượt giới hạn. Mỗi file PDF tối đa 100MB; nếu vừa sửa cấu hình, hãy restart dev server rồi thử lại.",
				wizard: {
					stepInfo: "Thông tin",
					stepUpload: "Upload PDF",
					stepReview: "Xác nhận",
					next: "Tiếp",
					back: "Quay lại",
					create: "Tạo đề",
					uploadExisting: "Bắt đầu upload",
					progressTitle: "Đang tạo đề…",
					progressUploadTitle: "Đang upload đề…",
					progressSubtitle:
						"Gemini đang trích xuất PDF, import và (nếu bật) dịch nội dung Part 3–4 / 6–7 — có thể mất vài phút.",
					done: "Hoàn tất",
					skipped: "Bỏ qua",
					failed: "Thất bại",
					reviewHeading: "Kiểm tra trước khi tạo",
					reviewUploadHeading: "Kiểm tra trước khi upload",
					reviewBook: "Bộ đề",
					reviewTest: "Bài test",
					reviewModulePdf: (moduleTitle: string) =>
						`PDF — ${moduleTitle}`,
					reviewNone: "Không có",
					reviewCount: (count: number) => `${count} file`,
					progressInit: "Tạo bản ghi test",
					progressInitExisting: "Dùng bài test hiện có",
					progressGemini: (moduleTitle: string) =>
						`Gemini — ${moduleTitle}`,
					progressImport: (moduleTitle: string) =>
						`Import — ${moduleTitle}`,
					progressFinalize: "Hoàn tất",
					progressGeminiPhase: "Gemini",
					progressImportPhase: "Import",
					progressTranslationPhase: "Dịch nội dung",
					progressVocabularyPhase: "Từ vựng",
					progressTabSystem: "Hệ thống",
					progressPending: "Chờ",
					progressRunning: "Đang xử lý",
					progressWaiting: "Đang chờ phản hồi",
					progressSending: "Đang gửi",
					progressImporting: "Đang import Supabase",
					progressExporting: "Đang xuất đoạn văn",
					progressTranslating: "Đang dịch",
					progressValidationRetry: (
						attempt: number,
						maxAttempts: number,
					) =>
						`Thử lại lần ${attempt}/${maxAttempts} — kết quả chưa đạt chuẩn`,
					stepGeminiSend: "Gửi PDF tới Gemini",
					stepGeminiWait: "Chờ phản hồi Gemini",
					stepGeminiParse: "QA / xử lý kết quả JSON",
					downloadGeminiJson: "Tải JSON phản hồi Gemini",
					stepImportSupabase: "Import vào Supabase",
					stepTranslationExport: "Xuất đoạn văn từ Supabase",
					stepTranslationGeminiSend: "Gửi đoạn văn tới Gemini",
					stepTranslationGeminiWait: "Chờ bản dịch từ Gemini",
					stepTranslationImport: "Lưu bản dịch vào Supabase",
					stepInitRecord: "Tạo bản ghi test trên Supabase",
					stepFinalizeCache: "Hoàn tất & làm mới cache",
					moduleTabLabel: (
						moduleId: string,
						title: string,
					): string => {
						if (moduleId === "listening-parts-1-2") return "P1–2";
						if (moduleId === "listening-part-3") return "P3";
						if (moduleId === "listening-part-4") return "P4";
						if (moduleId === "reading-part-5") return "P5";
						if (moduleId === "reading-part-6") return "P6";
						if (moduleId === "reading-part-7") return "P7";
						return title;
					},
					resultAllSuccess: (count: number) =>
						`Import thành công ${count} phần.`,
					resultPartial: (success: number, failed: number) =>
						`Thành công ${success} phần, thất bại ${failed} phần. Các phần đã import được giữ lại.`,
					resultAllFailed:
						"Không phần nào import thành công. Bạn có thể thử lại từng phần trên trang đề.",
					retryHint:
						"Các phần thất bại có thể cập nhật lại qua nút sửa module trên trang đề.",
					viewTest: "Xem đề",
					closeRun: "Xác nhận",
				},
				pickFile: "Chọn file",
				noFile: "Chưa chọn file",
				bookRequired: "Chọn hoặc nhập bộ đề.",
				testRequired: "Nhập tên bài test.",
				duplicateTest: (bookId: string, testId: string) =>
					`Đề đã tồn tại: ${bookId}/${testId}`,
			},
			examReady: "Đã công khai — hiển thị trên app thi thử",
			examNotReady: "Chưa công khai",
			publishTest: "Publish bài test",
			publishFailed: "Không thể publish bài test",
			unpublishFailed: "Không thể gỡ công khai bài test",
			toast: {
				labelsSaved: "Đã lưu tên hiển thị.",
				booksReordered: "Đã lưu thứ tự bộ đề.",
				testsReordered: "Đã lưu thứ tự bài test.",
				testDeleted: "Đã xóa đề.",
				published: "Đã công khai bài test.",
				unpublished: "Đã gỡ công khai.",
				moduleUpdated: "Đã cập nhật module.",
				exported: "Đã xuất file.",
			},
			validationTitle: "Chưa đủ điều kiện publish",
			manageListening: "Quản lý Listening",
			manageReading: "Quản lý Reading",
			validation: {
				totalQuestions: (actual: number, expected: number) =>
					`Tổng số câu: ${actual}/${expected} (TOEIC chuẩn: 200 câu).`,
				partCount: (part: number, actual: number, expected: number) =>
					`Part ${part}: ${actual}/${expected} câu.`,
				part1ImageMissing: (globalItemNumber: number) =>
					`Part 1 câu ${globalItemNumber}: thiếu ảnh photograph.`,
				part1ImageInvalidUrl: (
					globalItemNumber: number,
					path: string,
				) =>
					`Part 1 câu ${globalItemNumber}: đường dẫn ảnh không hợp lệ (${path}).`,
				part6SetCount: (actual: number, expected: number) =>
					`Part 6: cần ${expected} passage set, hiện có ${actual}.`,
				part6QuestionsPerSet: (
					setIndex: number,
					actual: number,
					expected: number,
				) =>
					`Part 6 set ${setIndex}: cần ${expected} câu/set, hiện có ${actual}.`,
				part7QuestionsPerSet: (
					setIndex: number,
					actual: number,
					min: number,
					max: number,
				) =>
					`Part 7 set ${setIndex}: cần ${min}–${max} câu/set, hiện có ${actual}.`,
				partMissingPassage: (part: number, setIndex: number) =>
					`Part ${part} set ${setIndex}: thiếu đoạn văn.`,
				partPassageCount: (
					part: number,
					setIndex: number,
					actual: number,
					max: number,
				) =>
					`Part ${part} set ${setIndex}: tối đa ${max} đoạn/set, hiện có ${actual}.`,
				partOrphanQuestions: (part: number, count: number) =>
					`Part ${part}: ${count} câu chưa gắn passage set.`,
				partGroupedQuestionCount: (
					part: number,
					actual: number,
					expected: number,
				) =>
					`Part ${part}: tổng câu trong các set ${actual}/${expected}.`,
			},
			listeningSection: "Listening",
			readingSection: "Reading",
			listeningPublished: "Listening đã publish",
			listeningUnpublished: "Listening chưa publish",
			readingPublished: "Reading đã publish",
			readingUnpublished: "Reading chưa publish",
			draftCount: (draft: number, target: number) =>
				`${draft} / ${target}`,
			published: "Đã công khai",
			unpublished: "Chưa công khai",
			publishedAt: (at: string) =>
				`Đã công khai lúc ${new Date(at).toLocaleString("vi-VN")}`,
			unpublishTest: "Gỡ công khai",
			tabs: {
				overview: "Tổng quan",
				questions: "Câu hỏi",
			},
			questionSlug: "Slug",
			questionNumber: "Số câu",
			questionPrompt: "Đề bài",
			noQuestions: "Chưa có câu hỏi draft cho part này.",
			breadcrumbExams: "Nội dung đề",
			delete: {
				deleteTest: "Xóa đề",
				confirmTitle: "Xóa bài test?",
				confirmBody: (testLabel: string) =>
					`Bài test "${testLabel}" và toàn bộ câu hỏi, đoạn văn, nhóm listening liên quan sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`,
				notFound: "Không tìm thấy bài test.",
				notExamBook:
					"Chỉ có thể xóa đề thi, không phải bài luyện chung.",
				cancel: "Hủy",
			},
			editLabels: {
				action: "Sửa tên hiển thị",
				title: "Sửa tên hiển thị",
				description:
					"Đổi tên bộ đề hoặc bài test trên giao diện học viên. Mã định danh (slug) không đổi.",
				save: "Lưu",
				bookNameRequired: "Tên bộ đề không được để trống.",
				testLabelRequired: "Tên bài test không được để trống.",
				bookNotFound: "Không tìm thấy bộ đề.",
				testNotFound: "Không tìm thấy bài test.",
			},
			reorderTests: {
				action: "Sắp xếp bài test",
				title: "Sắp xếp bài test",
				description:
					"Kéo thả để đổi thứ tự các bài test trong cùng bộ đề. Thứ tự này dùng trên trang admin và danh sách học viên.",
				save: "Lưu thứ tự",
				saving: "Đang lưu…",
				cancel: "Hủy",
				empty: "Bộ đề chưa có bài test để sắp xếp.",
				bookRequired: "Thiếu mã bộ đề.",
				bookNotFound: "Không tìm thấy bộ đề hoặc bài test.",
				mismatch:
					"Danh sách bài test đã thay đổi. Đóng hộp thoại và thử lại.",
				dragHandle: "Kéo để đổi thứ tự",
			},
			reorderBooks: {
				action: "Sắp xếp bộ đề",
				title: "Sắp xếp bộ đề",
				description:
					"Kéo thả để đổi thứ tự các bộ đề. Thứ tự này dùng trên trang admin và danh sách học viên.",
				save: "Lưu thứ tự",
				saving: "Đang lưu…",
				cancel: "Hủy",
				empty: "Chưa có bộ đề để sắp xếp.",
				notExamBook:
					"Chỉ có thể sắp xếp bộ đề thi (không gồm luyện chung).",
				mismatch:
					"Danh sách bộ đề đã thay đổi. Đóng hộp thoại và thử lại.",
				dragHandle: "Kéo để đổi thứ tự",
			},
			accessTier: {
				label: "Quyền truy cập",
				free: "Free",
				pro: "Pro only",
				hint: "Pro only: ẩn khỏi học viên Free trên trang luyện / thi.",
			},
			freeExplanation: {
				label: "Giải thích miễn phí (Free)",
				hint: "Cho phép Free xem giải thích câu/đoạn này khi review.",
			},
			checkAnswerKey: {
				action: "Kiểm tra đáp án",
				title: "Kiểm tra đáp án vs answer key",
				description:
					"So sánh đáp án đúng trên câu hỏi với bảng answer_keys đã upload.",
				checking: "Đang kiểm tra…",
				summary: (
					matched: number,
					mismatched: number,
					questionCount: number,
					answerKeyCount: number,
				) =>
					`Khớp ${matched} · lệch ${mismatched} · ${questionCount} câu hỏi · ${answerKeyCount} đáp án key`,
				summaryExtras: (
					questionUnset: number,
					missingAnswerKey: number,
					missingQuestion: number,
				) => {
					const parts: string[] = [];
					if (questionUnset > 0)
						parts.push(`${questionUnset} câu chưa có đáp án`);
					if (missingAnswerKey > 0)
						parts.push(`${missingAnswerKey} câu thiếu key`);
					if (missingQuestion > 0)
						parts.push(`${missingQuestion} key thiếu câu`);
					return parts.length > 0 ? parts.join(" · ") : null;
				},
				allMatch: "Tất cả câu hỏi khớp với answer key.",
				noKeys: "Chưa có answer key cho bài test này. Upload tại trang Đáp án trước.",
				noKeysLink: "Mở trang Đáp án",
				colPart: "Part",
				colNumber: "Câu",
				colQuestion: "Câu hỏi",
				colAnswerKey: "Answer key",
				close: "Đóng",
				errors: {
					generic: "Kiểm tra đáp án thất bại. Vui lòng thử lại.",
				},
			},
			updateModule: {
				title: (moduleTitle: string) => `Cập nhật ${moduleTitle}`,
				submit: "Cập nhật",
				submitting: "Đang cập nhật…",
				noFiles: "Chọn file PDF để cập nhật.",
				editModule: "Chỉnh sửa module",
				editModuleListeningParts12: "Chỉnh sửa Part 1–2",
				progressTitle: "Đang cập nhật…",
				progressSubtitle:
					"Gemini trích xuất PDF, import, rồi xử lý nội dung (dịch, đáp án, gợi ý).",
				progressGemini: (moduleTitle: string) =>
					`Gemini — ${moduleTitle}`,
				progressImport: (moduleTitle: string) =>
					`Import — ${moduleTitle}`,
				progressProcessPhase: "Xử lý nội dung",
				progressProcessing: "Đang xử lý",
				stepProcessExport: "Xuất dữ liệu từ Supabase",
				stepProcessGeminiSend: "Gửi tới Gemini (process)",
				stepProcessGeminiWait: "Chờ kết quả process",
				stepProcessImport: "Lưu kết quả vào Supabase",
			},
		},
		cms: {
			overviewHint:
				"Dữ liệu lấy từ Supabase (questions, answer_options).",
			noData: "Chưa có câu hỏi cho part này — thêm câu hoặc import JSON.",
			colOrder: "#",
			colGlobalToeic: "TOEIC",
			colQuestion: "Câu hỏi",
			colTranscript: "Transcript",
			colCorrect: "Đúng",
			addQuestion: "Thêm câu",
			reorderQuestions: "Sắp xếp",
			reorderQuestionsHint: "Kéo thả để đổi thứ tự câu hỏi trong part.",
			reorderQuestionsActive: "Đang sắp xếp",
			reorderQuestionsSaving: "Đang lưu thứ tự…",
			publishTest: "Publish bài test",
			emptyAnswer: "Trống",
			saved: "Đã lưu.",
			questionDetailTitle: (number: number) => `Câu ${number}`,
			groupDetailTitle: (from: number, to: number) =>
				`Nhóm câu ${from}–${to}`,
			groupGridEmpty:
				"Chưa có nhóm transcript — import JSON hoặc thêm câu.",
			groupCardQuestionCount: (count: number) => `${count} câu`,
			groupGridHint: (groups: number, questions: number) =>
				`${groups} nhóm · ${questions} câu`,
			saveChanges: "Cập nhật",
			cancel: "Hủy",
			deleteQuestion: "Xóa câu",
			deleteConfirmTitle: "Xóa câu hỏi?",
			deleteConfirmBody: "Hành động này không thể hoàn tác.",
			colTutorHint: "Hint",
			tutorHintPlaceholder: "Gợi ý cho chế độ luyện tập (Part 5)…",
			tutorHintPlaceholderListening:
				"Gợi ý trước khi nghe (chiến lược nghe, loại câu hỏi…)…",
			colExplanation: "Giải thích (review)",
			colExplanationReference: "Trích dẫn (transcript/đoạn văn)",
			explanationReasoningPlaceholder:
				'Điền từ: 1 câu mở đầu → - Chọn X là sai… (mỗi đáp án sai một dòng) → → Đáp án phù hợp nhất… | Chèn câu: Câu trước "…" → dịch Việt / Câu sau "…" → dịch Việt → → Đáp án X… → Vì sao các đáp án sai? (A. B. C. riêng từng dòng)',
			explanationReasoningPlaceholderListeningPart1:
				"**A.** She is … — Cô ấy đang …\n**B.** … — …\n**C.** … — …\n**D.** … — …",
			explanationReasoningPlaceholderListeningPart2:
				'"When does …?" nghĩa là "…"\n\nCâu hỏi hỏi về thời gian… → **Đáp án đúng là A**',
			listeningAudio: {
				label: "Audio",
				missing: "Chưa có file tại URL này. Tải lên để tạo audio mới.",
				replace: "Cập nhật audio",
				uploading: "Cập nhật audio…",
				uploaded: "Đã cập nhật audio.",
				hint: "File mới ghi đè đúng URL hiện tại.",
				invalidType: "Chỉ chấp nhận MP3, M4A hoặc WAV.",
				pathMismatch: "Đường dẫn audio không đúng định dạng.",
			},
			listeningImage: {
				label: "Ảnh",
				missing: "Chưa có file tại URL này. Tải lên để tạo ảnh mới.",
				replace: "Tải ảnh khác",
				uploading: "Đang tải ảnh…",
				uploaded: "Đã cập nhật ảnh.",
				hint: "File PNG mới ghi đè đúng URL hiện tại.",
				invalidType: "Chỉ chấp nhận file PNG.",
				pathMismatch: "Đường dẫn ảnh không đúng định dạng.",
				entranceOnly: "Chỉ đề đầu vào được tải ảnh tại đây.",
			},
			part1ImageLabel: "Ảnh Part 1",
			part1ImageMissing: "Chưa có ảnh photograph cho câu này.",
			part1OptionTranslationPlaceholder:
				"Bản dịch tiếng Việt của đáp án…",
			part1OptionReferencePlaceholder:
				"Câu tham chiếu / ghi chú cho câu hỏi này…",
			explanationReferencePlaceholder:
				"Sao chép nguyên văn câu trong transcript hoặc đoạn văn…",
			explanationReferencePlaceholderListening:
				"Từ/cụm từ nguyên văn trong transcript để highlight (VD: Not yet, gate 12)…",
			referenceRow: (index: number) => `Trích dẫn ${index}`,
			addReference: "Thêm trích dẫn",
			removeReference: "Xóa trích dẫn",
			noReferences:
				'Chưa có câu trích dẫn. Nhấn "Thêm trích dẫn" để thêm câu từ transcript hoặc đoạn văn.',
			noReferencesListening:
				'Chưa có từ khóa. Nhấn "Thêm trích dẫn" để thêm từ/cụm từ từ transcript.',
			colTags: "Tags",
			tagsPlaceholder: "grammar, vocabulary",
			tagsHint:
				"Chọn ít nhất 1 dạng câu + 1 trọng tâm (tối đa 3 dạng câu). Chủ đề tùy chọn.",
			tagGroupTopic: "Chủ đề (tùy chọn)",
			tagGroupClassification: "Phân loại",
			tagGroupSkill: "Dạng câu",
			tagGroupFocus: "Trọng tâm",
			tagGroupQuestionType: "Dạng câu",
			passageSetTopicLabel: "Topic",
			passageSetTopicPlaceholder: "VD: Thông báo bảo trì tòa nhà",
			translationsTitle: "Bản dịch câu",
			passageTranslationPassageLabel: (index: number) => `Đoạn ${index}`,
			passageTranslationHtmlTitle: "Bản dịch HTML đoạn văn",
			passageTranslationHtmlPreviewLabel: "Xem trước bản dịch",
			passageTranslationHtmlPlaceholder:
				"<p>Thẻ cá nhân sẽ <strong>[131] không</strong> được hoàn trả.</p>",
			part6TranslationVietnamesePlaceholder:
				"Tiếng Việt — chỗ điền: **[131] đáp_án**",
			part7PassageTranslationHtmlHint:
				"HTML tiếng Việt mirror layout đoạn văn (xem review stacked).",
			translationEnglish: "Tiếng Anh",
			translationVietnamese: "Tiếng Việt",
			translationRow: (index: number) => `Câu ${index}`,
			addTranslation: "Thêm câu dịch",
			removeTranslation: "Xóa câu dịch",
			noTranslations:
				"Chưa có bản dịch — thêm câu để học viên xem song ngữ.",
			passageCardQuestions: (count: number) => `${count} câu hỏi`,
			passageDetailTitle: (index: number) => `Đoạn văn ${index}`,
			passageTitleLabel: "Đoạn văn",
			passageContentLabel: "Nội dung",
			noPassageQuestions: "Chưa có câu hỏi trong nhóm đoạn văn này.",
			documentTypeLabel: "Loại đoạn văn",
			passageBodyLabel: "Nội dung chính",
			passagePreviewLabel: "Xem trước",
			legacyContentHint:
				"Đoạn văn dạng văn bản thuần. Chọn loại khác để dùng biểu mẫu có cấu trúc.",
			paragraphLabel: "Đoạn",
			addParagraph: "Thêm đoạn",
			addMessage: "Thêm tin nhắn",
			addSection: "Thêm mục",
			addField: "Thêm trường",
			addRow: "Thêm dòng",
			removeRow: "Xóa dòng",
			messageRow: (index: number) => `Tin nhắn ${index}`,
			fieldFrom: "Từ (From)",
			fieldTo: "Đến (To)",
			fieldCc: "Cc",
			fieldSubject: "Tiêu đề (Subject)",
			fieldDate: "Ngày",
			fieldSignature: "Chữ ký",
			fieldRecipient: "Người nhận",
			fieldSalutation: "Lời chào",
			fieldClosing: "Lời kết",
			fieldHeadline: "Tiêu đề",
			fieldTagline: "Khẩu hiệu",
			fieldCallToAction: "Kêu gọi hành động",
			fieldCompany: "Tên công ty",
			fieldIssuer: "Đơn vị phát hành",
			fieldByline: "Tác giả",
			fieldDateline: "Ngày đăng",
			fieldSections: "Các mục",
			fieldSectionHeading: "Tiêu đề mục",
			fieldFormTitle: "Tiêu đề biểu mẫu",
			fieldInstructions: "Hướng dẫn",
			fieldFormFields: "Các trường",
			fieldLabel: "Nhãn",
			fieldValue: "Giá trị",
			fieldScheduleRows: "Lịch trình",
			fieldTime: "Thời gian",
			fieldEvent: "Sự kiện",
			fieldLocation: "Địa điểm",
			fieldRating: "Đánh giá",
			fieldReviewer: "Người đánh giá",
			fieldSource: "Nguồn",
			fieldPageTitle: "Tiêu đề trang",
			fieldUrl: "URL",
			fieldBreadcrumb: "Breadcrumb",
			fieldMessages: "Tin nhắn",
			fieldSpeaker: "Người nói",
			fieldMessageText: "Nội dung tin nhắn",
			documentTypes: {
				email: "E-mail",
				memo: "Memo",
				letter: "Thư",
				article: "Bài báo",
				advertisement: "Quảng cáo",
				brochure: "Brochure",
				notice: "Thông báo",
				form: "Biểu mẫu",
				schedule: "Lịch trình",
				review: "Đánh giá",
				web_page: "Trang web",
				conversation: "Hội thoại",
				other: "Khác",
			},
			editQuestion: "Sửa câu",
			noPassageSets:
				"Chưa có đoạn văn — import JSON hoặc thêm nội dung qua CMS.",
			passageSetCount: (sets: number, questions: number) =>
				`${sets} đoạn văn · ${questions} câu`,
			addPassageTranslations: "Thêm dịch nghĩa",
			addContentVocabulary: "Lấy từ vựng",
			addPart5Tags: "Gắn tag",
			turnAlignment: {
				title: "Chế độ dictation",
				generate: "Tạo dictation",
				generating: "Đang tạo...",
				empty: "Chưa có mốc thời gian cho nhóm này.",
				emptyQuestion: "Chưa có mốc thời gian cho câu này.",
				markedBadge: "Đã chấm",
				unmarkedBadge: "Chưa chấm",
				rawSeconds: (startSec: number, endSec: number) =>
					`${startSec.toFixed(2)}s–${endSec.toFixed(2)}s`,
				success: (count: number) => `Đã chấm ${count} lượt nói.`,
				saved: "Đã lưu.",
				alignAll: "Tách dictation",
				alignAllGenerating: (done: number, total: number) =>
					`Đang tách ${done}/${total}...`,
				alignAllSuccess: (count: number) =>
					`Đã tách dictation cho ${count} nhóm.`,
				alignAllPartial: (ok: number, total: number) =>
					`Đã tách ${ok}/${total} nhóm.`,
				alignAllEmpty: "Chưa có nhóm hội thoại để tách.",
				alignAllQuestionsSuccess: (count: number) =>
					`Đã tách dictation cho ${count} câu.`,
				alignAllQuestionsPartial: (ok: number, total: number) =>
					`Đã tách ${ok}/${total} câu.`,
				alignAllQuestionsEmpty: "Chưa có câu để tách.",
				wholeTest: "Tách dictation toàn bài",
				wholeTestGenerating: (done: number, total: number) =>
					`Đang tách ${done}/${total}...`,
				wholeTestSuccess: (count: number) =>
					`Đã cập nhật dictation cho ${count} mục.`,
				wholeTestPartial: (ok: number, total: number) =>
					`Đã tách ${ok}/${total} mục. Dictation đã được cập nhật với các mục thành công.`,
				wholeTestEmpty: "Bài test chưa có câu Listening.",
				editTimes: "Sửa mốc thời gian",
				saveTimes: "Lưu mốc",
				cancelTimes: "Hủy sửa mốc",
				startSec: "Bắt đầu (giây)",
				endSec: "Kết thúc (giây)",
				transcriptPlaceholder: "Transcript lượt nói",
				errors: {
					generic: "Không chấm được mốc audio. Vui lòng thử lại.",
					notFound: "Không tìm thấy nhóm transcript.",
					notFoundQuestion: "Không tìm thấy câu hỏi.",
					unsupportedPart:
						"Chấm mốc audio chỉ dùng cho Part 3 và Part 4.",
					unsupportedShortPart:
						"Chấm mốc audio chỉ dùng cho Part 1 và Part 2.",
					noQuestionAudio: "Câu này chưa có file audio.",
					noTurns: "Transcript chưa có dòng lượt nói.",
					noSentences: "Transcript chưa có câu nói.",
					noAudio: "Nhóm này chưa có file audio.",
					geminiMissing: "Chưa cấu hình GEMINI_API_KEY.",
					invalidMarks:
						"Gemini trả mốc không khớp số lượt nói hoặc thời điểm. Thử chấm lại.",
					invalidTimes:
						"Mốc thời gian không hợp lệ. Bắt đầu phải nhỏ hơn kết thúc và không chồng lượt nói.",
					emptyEnglish: "Transcript lượt nói không được trống.",
				},
			},
			errors: {
				generic: "Không thể lưu. Vui lòng thử lại.",
				notFound: "Không tìm thấy bản ghi.",
				maxOptions: "Đã đủ 4 đáp án.",
				reorderUnavailable:
					"Không thể sắp xếp lại câu hỏi. Cần chạy migration reorder_part_questions trên Supabase.",
				invalidStructuredContent:
					"Nội dung có cấu trúc không hợp lệ. Kiểm tra các trường bắt buộc.",
			},
		},
		import: {
			title: "Import nội dung JSON",
			description:
				"Hai luồng riêng: Listening (part 1–4) và Reading (part 5–7). Mỗi file .json có bookId, testId, title và parts — không tự publish.",
			errors: {
				notSignedIn: "Vui lòng đăng nhập để import.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				generic: "Import thất bại. Vui lòng thử lại.",
			},
		},
		listeningImport: {
			title: "Import Listening JSON",
			description:
				"Upload JSON phần Listening (part 1–4). Ghi draft vào Supabase; gắn media nếu imageUrl/audioUrl trỏ tới Storage.",
			selectFile: "Chọn file JSON",
			importButton: "Import Listening vào Supabase",
			requiredFieldsNote:
				"JSON: parts[] (mảng object part 1–4). Part 1: items; Part 2: questionTranscript + question; Part 3–4: groups + transcript. Import qua «Thêm đề mới» không cần bookId/testId/title trong file. Import độc lập cần thêm bookId, testId, title.",
			success: (
				bookId: string,
				testId: string,
				count: number,
				parts: number[],
				mediaCount: number,
				missingAnswerKeys: boolean,
			) =>
				`Đã import ${bookId}/${testId}: ${count} câu (part ${parts.join(", ")}), ${mediaCount} media.${
					missingAnswerKeys
						? " Một số câu chưa có đáp án — cập nhật trong CMS trước khi publish."
						: ""
				}`,
			errors: {
				notSignedIn: "Vui lòng đăng nhập để import.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				missingFile: "Chọn file JSON.",
				invalidType: "Chỉ chấp nhận file .json.",
				fileTooLarge: "File vượt quá 10 MB.",
				invalidJson: "JSON không hợp lệ.",
				invalidSchema:
					"File không khớp schema Listening import (parts 1–4). Kiểm tra cấu trúc parts hoặc thêm bookId/testId/title nếu import độc lập.",
				fullTestFile:
					"Đây là file full test (meta + listening + reading). Chỉ dùng cho script/CLI — hoặc tách thành file Listening riêng (parts 1–4).",
				wrongSectionReading:
					"File này là Reading (part 5–7). Dùng nút « Import Reading JSON ».",
				mixedParts:
					"File chứa cả Listening và Reading trong một parts[]. Tách thành hai file riêng.",
				generic: "Import Listening thất bại. Vui lòng thử lại.",
			},
		},
		readingImport: {
			title: "Import Reading JSON",
			description:
				"Upload JSON phần Reading (part 5–7). File phải có bookId, testId, title và parts. Không tự publish — cần gán đáp án trong CMS trước khi publish.",
			selectFile: "Chọn file JSON",
			importButton: "Import Reading vào Supabase",
			requiredFieldsNote:
				"JSON: bookId, testId, title, parts 5–7 (hoặc file full test có meta + reading). Mỗi câu: globalItemNumber, globalItemNumber (số in trên PDF), prompt, options.",
			success: (
				bookId: string,
				testId: string,
				count: number,
				parts: number[],
				missingAnswerKeys: boolean,
				globalMin: number,
				globalMax: number,
			) =>
				`Đã import ${bookId}/${testId}: ${count} câu (part ${parts.join(", ")}), số TOEIC ${globalMin}–${globalMax}.${
					missingAnswerKeys
						? " Một số câu chưa có đáp án — cập nhật trong CMS trước khi publish."
						: ""
				}`,
			errors: {
				notSignedIn: "Vui lòng đăng nhập để import.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				missingFile: "Chọn file JSON.",
				invalidType: "Chỉ chấp nhận file .json.",
				fileTooLarge: "File vượt quá 10 MB.",
				invalidJson: "JSON không hợp lệ.",
				invalidSchema:
					"File không khớp schema Reading import (bookId, testId, parts 5–7; Part 5 mỗi câu ≥2 tags: 1–3 dạng câu + trọng tâm).",
				fullTestFile:
					"Đây là file full test (meta + 7 part). Dùng script import full test — hoặc tách file Reading (parts 5–7).",
				wrongSectionListening:
					"File này là Listening (part 1–4). Dùng nút « Import Listening JSON ».",
				mixedParts:
					"File chứa cả Listening và Reading trong một parts[]. Tách thành hai file riêng.",
				generic: "Import Reading thất bại. Vui lòng thử lại.",
			},
		},
		answerKey: {
			title: "Đáp án",
			subtitle:
				"Upload JSON đáp án trước (Listening 1–100 hoặc Reading 101–200). Nếu bookId/testId chưa có, hệ thống sẽ tạo bộ đề/bài test mới — rồi mới import PDF trên trang Exam.",
			promptSectionTitle: "Prompt trích xuất từ PDF",
			promptSectionDescription:
				"Sao chép prompt bên dưới, dán vào chat AI khác cùng file PDF đáp án (Listening hoặc Reading), rồi lưu JSON trả về.",
			copyPrompt: "Sao chép prompt",
			copiedPrompt: "Đã sao chép",
			downloadListeningTemplate: "Tải mẫu Listening",
			downloadReadingTemplate: "Tải mẫu Reading",
			downloadPreview: "Tải JSON",
			uploadSectionTitle: "Upload JSON đáp án",
			uploadSectionDescription:
				"Upload file .json hoặc dán nội dung JSON. bookId/testId chưa tồn tại sẽ được tạo tự động. JSON: bookId, testId và answers { số câu: chữ cái } hoặc parts[].",
			selectFile: "Chọn file JSON",
			pasteJsonLabel: "Hoặc dán JSON",
			pasteJsonPlaceholder:
				'{\n  "bookId": "ets-2026",\n  "testId": "test-1",\n  "answers": { "1": "A", "2": "B" }\n}',
			uploadPlaceholder: "Chưa chọn file JSON",
			uploadHint:
				"Kéo thả file .json, hoặc dán JSON từ chat AI. PDF Listening (1–100) và Reading (101–200) có thể upload riêng.",
			uploadDropRelease: "Thả file JSON để tải lên",
			saveButton: "Lưu đáp án",
			previewTitle: "Xem trước theo part",
			previewEmpty: "Chọn file hoặc dán JSON hợp lệ để xem trước.",
			sectionLabel: (section: "listening" | "reading" | "full") => {
				if (section === "listening") {
					return "Phần Listening (câu 1–100)";
				}
				if (section === "reading") {
					return "Phần Reading (câu 101–200)";
				}
				return "Full test (Listening + Reading)";
			},
			partSummary: (part: number, count: number, expected: number) =>
				`Part ${part}: ${count} / ${expected} câu`,
			bookTestLabel: (bookId: string, testId: string) =>
				`${bookId} / ${testId}`,
			success: (
				bookId: string,
				testId: string,
				entriesSaved: number,
				parts: number[],
				createdBook: boolean,
				createdTest: boolean,
			) => {
				const partsLabel =
					parts.length > 0 ? ` (part ${parts.join(", ")})` : "";
				const catalogNote =
					createdBook || createdTest
						? createdBook && createdTest
							? " Đã tạo bộ đề và bài test mới."
							: createdBook
								? " Đã tạo bộ đề mới."
								: " Đã tạo bài test mới."
						: "";
				return `Đã lưu ${entriesSaved} đáp án vào answer_keys cho ${bookId}/${testId}${partsLabel}.${catalogNote} Mở trang Exam để import PDF (không tạo lại đề trùng). Câu hỏi không bị ghi đè — dùng Kiểm tra đáp án / Gemini process để đồng bộ.`;
			},
			errors: {
				notSignedIn: "Vui lòng đăng nhập.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				missingFile: "Chọn file JSON.",
				missingInput: "Chọn file JSON hoặc dán nội dung JSON.",
				invalidType: "Chỉ chấp nhận file .json.",
				fileTooLarge: "File vượt quá 2 MB.",
				invalidJson: "JSON không hợp lệ.",
				invalidSchema: "File không khớp schema đáp án",
				parsePreview: "Không đọc được file JSON.",
				invalidBookTestId:
					"bookId/testId không hợp lệ. Dùng dạng slug (ví dụ ets-2026, test-1).",
				commonBookNotAllowed:
					"Không thể lưu đáp án vào bộ đề luyện chung (common).",
				missingForPart: (
					bookId: string,
					testId: string,
					part: number | null,
					missingPreview: number[],
					missingCount: number,
					answerKeysPath: string,
				) => {
					const partLabel = part != null ? `Part ${part}` : "Reading";
					const preview =
						missingPreview.length > 0
							? ` (thiếu câu ${missingPreview.join(", ")}${missingCount > missingPreview.length ? ", …" : ""})`
							: "";
					return `Chưa đủ đáp án ${partLabel} trong DB cho ${bookId}/${testId}${preview}. Upload đáp án tại ${answerKeysPath} trước khi chạy Gemini.`;
				},
				mismatchAgainstKey: (
					part: number,
					mismatches: string[],
					mismatchCount: number,
				) => {
					const preview =
						mismatches.length > 0
							? ` ${mismatches.join("; ")}${mismatchCount > mismatches.length ? "; …" : ""}`
							: "";
					return `JSON Part ${part} không khớp ANSWER_KEY_JSON:${preview}`;
				},
				processMismatchAgainstKey: (
					globalItemNumber: number,
					expected: string,
					actual: string,
				) =>
					`Câu ${globalItemNumber}: ANSWER_KEY_JSON yêu cầu ${expected}, Gemini trả về ${actual || "?"}.`,
				generic: "Lưu đáp án thất bại. Vui lòng thử lại.",
			},
		},
		passageTranslationExport: {
			button: (part: number) => `Xuất Part ${part}`,
			groupLabel: "Xuất đoạn văn (JSON)",
			description:
				"JSON đầu vào cho prompt dịch — mỗi mục có questionId (slug câu neo) và passages[].",
			errors: {
				notSignedIn: "Vui lòng đăng nhập để xuất.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				wrongPart: "Chỉ xuất Reading Part 6 hoặc 7.",
				generic: "Xuất đoạn văn thất bại. Vui lòng thử lại.",
			},
		},
		listeningTranslationExport: {
			button: (part: number) => `Xuất Part ${part}`,
			groupLabel: "Xuất transcript (JSON)",
			description:
				"JSON đầu vào cho prompt dịch — mỗi mục có questionId (slug câu neo) và transcript.",
			errors: {
				notSignedIn: "Vui lòng đăng nhập để xuất.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				wrongPart: "Chỉ xuất Listening Part 3 hoặc 4.",
				generic: "Xuất transcript thất bại. Vui lòng thử lại.",
			},
		},
		readingPart5TranslationExport: {
			button: "Xuất Part 5",
			description:
				"JSON đầu vào cho prompt dịch — mỗi câu có questionId và texts[] (câu điền đáp án + 4 lựa chọn).",
			errors: {
				notSignedIn: "Vui lòng đăng nhập để xuất.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				empty: "Part 5 chưa có câu hỏi đủ nội dung tiếng Anh để dịch.",
				generic: "Xuất Part 5 thất bại. Vui lòng thử lại.",
			},
		},
		readingPart5TranslationImport: {
			jsonDescription:
				"Part 5: { questionId, translations[] } — 5 dòng: câu điền đáp án (**đáp án in đậm** bằng markdown), rồi A–D.",
		},
		contentVocabularyImport: {
			title: "Lấy từ vựng",
			description:
				"Tạo lại (ghi đè) từ vựng TOEIC từ script/đoạn văn và câu hỏi bằng Gemini — dùng khi cần regenerate vocabulary đã có từ digitize/process.",
			geminiDescription:
				"Xuất nội dung tiếng Anh từ đề → gửi Gemini → ghi đè vocabulary[] (kèm example).",
			geminiButton: "Tạo lại từ vựng với Gemini",
			geminiSuccess: "Đã tạo lại và lưu từ vựng với Gemini.",
		},
		part5TagsImport: {
			title: "Gắn tag Part 5",
			description:
				"Gắn lại tag ngữ pháp (slug tiếng Anh) cho mọi câu Part 5 của đề này. Thân câu và đáp án không đổi — tag hiện có sẽ bị ghi đè.",
			geminiDescription:
				"Xuất thân câu + A–D → gửi Gemini → ghi đè questions.tags.",
			geminiButton: "Gắn tag với Gemini",
			geminiSuccess: "Đã gắn lại tag Part 5.",
		},
		listeningPartTagsImport: {
			title: (part: 1 | 2) => `Gắn tag Part ${part}`,
			description: (part: 1 | 2) =>
				part === 1
					? "Gắn lại tag phân loại tranh cho mọi câu Part 1. Câu nói và ảnh không đổi — tag hiện có sẽ bị ghi đè."
					: "Gắn lại tag loại câu cho mọi câu Part 2 từ transcript. Câu nói không đổi — tag hiện có sẽ bị ghi đè.",
			geminiDescription: (part: 1 | 2) =>
				part === 1
					? "Xuất câu nói A–D và ảnh → gửi Gemini → ghi đè questions.tags."
					: "Xuất transcript → gửi Gemini → ghi đè questions.tags.",
			geminiButton: "Gắn tag với Gemini",
			geminiSuccess: (part: 1 | 2) => `Đã gắn lại tag Part ${part}.`,
		},
		examTagsImport: {
			title: "Gắn tag cả đề",
			description:
				"Chạy lần lượt Part 1 đến Part 7. Tag hiện có sẽ bị ghi đè. Phần chưa có câu hỏi được bỏ qua.",
			geminiButton: "Gắn tag với Gemini",
			geminiSuccess: "Đã gắn tag các phần có câu hỏi (Part 1–7).",
			partLabel: (part: number) => `Part ${part}`,
		},
		passageTranslationImport: {
			title: "Thêm dịch nghĩa",
			description:
				"Tạo bản dịch tự động bằng Gemini từ đoạn văn trong đề, hoặc upload JSON bản dịch đã có.",
			tabGemini: "Gemini",
			tabJson: "JSON",
			geminiDescription:
				"Lấy nội dung đoạn văn từ đề → gửi Gemini → lưu bản dịch (cùng quy trình bước 2 khi import PDF Part 6/7).",
			geminiButton: "Tạo bản dịch với Gemini",
			geminiSuccess: "Đã tạo và lưu bản dịch với Gemini.",
			jsonDescription:
				"Part 6: { questionId, passageTranslation?, translations[] } — passageTranslation dùng <strong>[N] đáp_án</strong>; translations[].vietnamese dùng **[N] đáp_án** tại chỗ trống. Part 7: { questionId, passages: [{ passageSlug, passageTranslation?, translations[] }] }.",
			selectFile: "Chọn file JSON",
			importButton: "Cập nhật bản dịch",
			requiredFieldsNote:
				"Part 6: passageTranslation = HTML (<strong>[N] đáp_án</strong> tại chỗ trống); translations[] = câu hover (**[N] đáp_án** trong cột Vi). Part 7: { questionId, passages: [{ passageSlug, passageTranslation?, translations[] }] }.",
			success: (
				questionsUpdated: number,
				passagesUpdated: number,
				translationRows: number,
				notFoundQuestions: string[],
				notFoundPassageSlugs: string[],
			) => {
				const parts: string[] = [];
				if (passagesUpdated > 0) {
					parts.push(`${passagesUpdated} đoạn văn`);
				}
				if (questionsUpdated > 0) {
					parts.push(`${questionsUpdated} câu`);
				}
				const base = `Đã cập nhật ${parts.join(" và ")} (${translationRows} dòng dịch).`;
				const missing = [...notFoundQuestions, ...notFoundPassageSlugs];
				if (missing.length === 0) return base;
				return `${base} Không tìm thấy: ${missing.join(", ")}.`;
			},
			errors: {
				notSignedIn: "Vui lòng đăng nhập để import.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				missingFile: "Chọn file JSON.",
				invalidType: "Chỉ chấp nhận file .json.",
				fileTooLarge: "File vượt quá 10 MB.",
				invalidJson: "JSON không hợp lệ.",
				invalidSchema:
					"File không khớp schema bản dịch (Part 7: passageSlug + translations per passage; Part 6: questionId + translations[]).",
				wrongPart:
					"Chỉ dùng cho Listening Part 3–4 hoặc Reading Part 6–7.",
				generic: "Cập nhật bản dịch thất bại. Vui lòng thử lại.",
			},
		},
		vocabulary: {
			sectionTitle: "Từ vựng",
			emptySection: "Chưa có từ vựng. Upload file để bắt đầu.",
			detail: {
				fields: {
					term: "Từ / cụm",
					lemma: "Lemma",
					meaningVi: "Dịch nghĩa",
					definitionEn: "Định nghĩa (EN)",
					ipaUs: "IPA (Mỹ)",
					ipaUk: "IPA (Anh)",
					wordTypes: "Loại từ (phân cách bằng dấu phẩy)",
					synonyms: "Từ đồng nghĩa (mỗi dòng một từ)",
					collocations: "Collocation (mỗi dòng một cụm)",
					example: "Ví dụ",
					level: "CEFR",
					levelOptional: "Không bắt buộc",
					image: "Hình minh họa",
				},
				imageOptional: "Không bắt buộc",
				imagePick: "Chọn ảnh",
				imageRemove: "Xóa ảnh",
				imageHint: "JPEG, PNG hoặc WebP, tối đa 2MB.",
				imageDrop: "Kéo thả ảnh vào đây, hoặc bấm để chọn",
				imageDropRelease: "Thả ảnh để tải lên",
			},
			errors: {
				termRequired: "Từ / cụm không được để trống.",
				saveFailed: "Lưu từ vựng thất bại. Vui lòng thử lại.",
				imageMissing: "Chọn ảnh để tải lên.",
				imageInvalidType: "Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.",
				imageTooLarge: "Ảnh vượt quá 2MB.",
				imageUploadFailed: "Tải ảnh thất bại. Vui lòng thử lại.",
				imageNotCommonDeck: "Chỉ quản lý ảnh trên bộ từ chung (admin).",
			},
		},
		dictationManage: {
			title: "Chép chính tả",
			subtitle:
				"Danh sách bài dictation hiện có. Import từ bài Listening đã có mốc thời gian; bài mới được lưu ở dạng nháp.",
			import: "Import",
			importTitle: "Import dictation",
			importDescription:
				"Chọn bộ đề và bài test. Chỉ câu Listening đã có mốc thời gian được ghi vào dictation.",
			bookLabel: "Bộ đề",
			testLabel: "Bài test",
			bookPlaceholder: "Chọn bộ đề",
			testPlaceholder: "Chọn bài test",
			importSubmit: "Import",
			importing: "Đang import…",
			importSuccess: (count: number) =>
				`Đã cập nhật dictation cho ${count} mục.`,
			publish: "Publish",
			publishTitle: "Publish dictation",
			publishDescription:
				"Chọn bộ đề và bài test để publish mọi mục dictation đã có của bài đó cho học viên.",
			publishSubmit: "Publish",
			publishing: "Đang publish…",
			publishSuccess: (count: number) => `Đã publish ${count} mục.`,
			publishEmpty: "Bài test này chưa có dictation.",
			publishAlready: "Các mục của bài test này đã được publish.",
			empty: "Chưa có bài chép chính tả.",
			unknownSource: "Không xác định",
			published: "published",
			draft: "Nháp",
			groupCount: (count: number) => `${count} mục`,
			columns: {
				audio: "Audio",
				title: "Tiêu đề",
				topic: "Chủ đề",
				part: "Part",
				level: "Trình độ",
				status: "Trạng thái",
				segments: "Câu",
			},
		},
		vocabManage: {
			title: "Từ vựng",
			subtitle: "Tạo bộ từ, upload file và publish cho học viên.",
			createDeck: "Thêm mới",
			createDeckTitle: "Tạo mới",
			createDeckDescription:
				"Đặt tên bộ từ và upload file (.pdf, .docx, .txt, .json). Gemini sẽ trích xuất danh sách từ.",
			createDeckSubmit: "Import",
			deckNameLabel: "Tên bộ từ",
			deckNamePlaceholder: "VD: TOEIC Business Verbs",
			uploadLabel: "File từ vựng",
			uploadHint: "Hỗ trợ PDF, Word (.docx), TXT, JSON.",
			published: "published",
			draft: "Nháp",
			publishLabel: "Publish",
			wordCount: (count: number) => `${count} từ`,
			emptyDecks: "Chưa có bộ từ nào. Tạo bộ từ đầu tiên để bắt đầu.",
			reupload: "Upload lại",
			reuploadTitle: "Cập nhật từ vựng",
			reuploadDescription:
				"Upload file mới để cập nhật hoặc bổ sung từ trong bộ này (trùng tên sẽ được ghi đè).",
			reuploadSubmit: "Import",
			regenerate: "Tạo lại từ vựng",
			regenerateTitle: "Tạo lại từ vựng",
			regenerateConfirm: "Tạo lại",
			regenerateProgress: "Đang tạo lại từ vựng…",
			regenerateSuccess: (wordCount: number) =>
				`Đã tạo lại ${wordCount} từ.`,
			deleteDeckTitle: "Xóa bộ từ",
			deleteDeckDescription: (name: string) =>
				`Xóa «${name}» và toàn bộ từ bên trong? Thao tác không thể hoàn tác.`,
			deleteDeckConfirm: "Xóa bộ từ",
			deleteWord: "Xóa từ",
			errors: {
				nameRequired: "Tên bộ từ không được để trống.",
				emptyDeck: "Bộ từ chưa có từ nào để tạo lại.",
				notCommonDeck: "Chỉ tạo lại được bộ từ chung (admin).",
				generic: "Thao tác thất bại. Vui lòng thử lại.",
			},
		},
		vocabularyImport: {
			title: "Import Vocabulary JSON",
			selectFile: "Chọn file JSON",
			importButton: "Import từ vựng",
			requiredFieldsNote:
				"JSON: { name, words[] } — mỗi object gồm term, meaningVi, definitionEn, ipaUs, ipaUk, wordTypes, level (A1–C1, tùy chọn), …",
			progressTitle: "Đang import từ vựng",
			progressSubtitle: "Đang lưu từ vào Supabase…",
			progressValidate: "Kiểm tra file JSON",
			progressImport: "Import từ",
			progressFinalize: "Hoàn tất",
			progressProcessed: (done: number, total: number) =>
				`${done} / ${total} từ`,
			success: (wordCount: number) =>
				`Đã import thành công ${wordCount} từ.`,
			errors: {
				notSignedIn: "Vui lòng đăng nhập để import.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				missingFile: "Chọn file để upload.",
				invalidType: "Chỉ chấp nhận .pdf, .docx, .txt, .json.",
				fileTooLarge: "File vượt quá giới hạn cho phép.",
				invalidJson: "JSON không hợp lệ.",
				invalidSchema:
					"File không khớp schema (name, words[] với object từ hoặc chuỗi term).",
				generic: "Import từ vựng thất bại. Vui lòng thử lại.",
				geminiMissingApiKey: "GEMINI_API_KEY chưa được cấu hình.",
				geminiInvalidJson: "Gemini trả về JSON không hợp lệ.",
				geminiRateLimited: "Gemini đang bận. Vui lòng thử lại sau.",
				geminiFailed: "Gemini trích xuất thất bại.",
			},
		},
		blog: {
			title: "Blog",
			subtitle: "Quản lý bài viết cộng đồng — nội dung HTML.",
			newPost: "Bài viết mới",
			editPost: "Sửa bài viết",
			backToList: "Quay lại danh sách",
			fields: {
				title: "Tiêu đề",
				slug: "Slug (URL)",
				slugHint: "Để trống sẽ tự tạo từ tiêu đề.",
				excerpt: "Mô tả ngắn",
				excerptHint: "Hiển thị trên thẻ bài viết và meta SEO.",
				tags: "Thẻ",
				tagsHint: "Phân tách bằng dấu phẩy, ví dụ: listening, mẹo thi",
				content: "Nội dung (HTML)",
				published: "published",
				draft: "Nháp",
			},
			previewTab: "Xem trước",
			editTab: "Sửa",
			htmlEditorLabel: (title: string) => `Nội dung HTML — ${title}`,
			save: "Lưu",
			create: "Tạo bài viết",
			delete: "Xóa",
			deleteConfirm: "Xóa bài viết này? Hành động không thể hoàn tác.",
			publish: "Publish",
			unpublish: "Gỡ publish",
			columns: {
				title: "Tiêu đề",
				status: "Trạng thái",
				tags: "Thẻ",
				engagement: "Tương tác",
				publishedAt: "Ngày publish",
				updatedAt: "Cập nhật",
				actions: "Thao tác",
			},
			engagementSummary: (
				likes: number,
				comments: number,
				shares: number,
			) => `${likes} thích · ${comments} BL · ${shares} chia sẻ`,
			errors: {
				notSignedIn: "Vui lòng đăng nhập.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				titleRequired: "Tiêu đề không được để trống.",
				contentRequired: "Nội dung không được để trống.",
				slugTaken: "Slug đã được sử dụng.",
				saveFailed: "Lưu bài viết thất bại.",
				deleteFailed: "Xóa bài viết thất bại.",
				generic: "Có lỗi xảy ra. Vui lòng thử lại.",
			},
		},
		users: {
			title: "Người dùng",
			subtitle: "Quản lý gói Free / Pro.",
			planFree: "Free",
			planPro: "Pro",
			adminBadge: "Admin",
			noExpiry: "Không hết hạn",
			setPro: "Cấp Pro",
			setFree: "Hạ Free",
			upPro: "Up Pro",
			filterAll: "Tất cả",
			searchEmail: "Tìm theo email…",
			selectedCount: (count: number) => `Đã chọn ${count}`,
			selectAll: "Chọn tất cả trên trang này",
			selectRow: "Chọn người dùng",
			sortBy: (column: string, direction: "asc" | "desc") =>
				`Sắp xếp ${column} ${direction === "asc" ? "tăng dần" : "giảm dần"}`,
			pageOf: (page: number, pageCount: number) =>
				`Trang ${page} / ${pageCount}`,
			previousPage: "Trang trước",
			nextPage: "Trang sau",
			columns: {
				user: "Người dùng",
				plan: "Gói",
				periodEnd: "Hết hạn",
				actions: "Thao tác",
			},
			errors: {
				notSignedIn: "Vui lòng đăng nhập.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				userRequired: "Thiếu user id.",
				invalidPlan: "Gói không hợp lệ.",
				noFreeSelected: "Không có người dùng Free trong lựa chọn.",
				generic: "Có lỗi xảy ra. Vui lòng thử lại.",
			},
		},
		subscriptions: {
			title: "Gói đăng ký",
			subtitle:
				"Quản lý bài test Free/Pro theo bộ đề, và giải thích miễn phí áp dụng chung cho mọi đề.",
			testsTitle: "Giới hạn bộ đề",
			selectBookTitle: "Chọn bộ đề",
			testCount: (count: number) => `${count} bài test`,
			proTestCount: (count: number) => `${count} Pro`,
			unitsTitle: "Cài đặt giải thích",
			slotActive: "Free được xem giải thích",
			slotInactive: "Chỉ Pro xem giải thích",
			columns: {
				test: "Bài test",
				testId: "testId",
				accessTier: "Gói truy cập",
			},
			errors: {
				notSignedIn: "Vui lòng đăng nhập.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				unitRequired: "Thiếu thông tin đơn vị.",
				unitNotFound: "Không tìm thấy đơn vị.",
				generic: "Có lỗi xảy ra. Vui lòng thử lại.",
			},
		},
		notifications: {
			title: "Thông báo",
			subtitle:
				"Gửi thông báo nội dung mới hoặc marketing tới người dùng (gửi ngay).",
			newCampaign: "Chiến dịch mới",
			editCampaign: "Sửa chiến dịch",
			sendNow: "Gửi ngay",
			sendConfirm:
				"Gửi chiến dịch này tới đối tượng đã chọn? Không thể hoàn tác.",
			runReminders: "Chạy nhắc học ngay",
			runRemindersConfirm:
				"Chạy job nhắc học ngay (Edge Function)? Dùng để kiểm tra.",
			runRemindersOk: (body: string) => `Đã chạy nhắc học. ${body}`,
			cancel: "Hủy chiến dịch",
			cancelConfirm: "Hủy chiến dịch nháp này?",
			saveDraft: "Lưu nháp",
			fields: {
				title: "Tiêu đề",
				body: "Nội dung",
				deepLink: "Deep link (đường dẫn trong app)",
				deepLinkHint: "Ví dụ: /exam hoặc /vocab",
				category: "Loại",
				audience: "Đối tượng",
			},
			categories: {
				content_release: "Nội dung mới",
				marketing: "Marketing",
			},
			audiences: {
				all: "Tất cả",
				free: "Free",
				pro: "Pro",
				active_7d: "Hoạt động 7 ngày",
			},
			status: {
				draft: "Nháp",
				sending: "Đang gửi",
				sent: "Đã gửi",
				cancelled: "Đã hủy",
			},
			columns: {
				title: "Tiêu đề",
				category: "Loại",
				audience: "Đối tượng",
				status: "Trạng thái",
				sentAt: "Gửi lúc",
				actions: "Thao tác",
			},
			empty: "Chưa có chiến dịch nào.",
			errors: {
				notSignedIn: "Vui lòng đăng nhập.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				titleRequired: "Tiêu đề không được để trống.",
				notDraft: "Chỉ gửi được chiến dịch ở trạng thái nháp.",
				sendFailed: "Gửi thông báo thất bại.",
				saveFailed: "Lưu chiến dịch thất bại.",
				remindersFailed: "Không chạy được job nhắc học.",
				generic: "Có lỗi xảy ra. Vui lòng thử lại.",
			},
		},
		lectures: {
			title: "Khoá học",
			subtitle:
				"Tạo khoá học, upload PDF cho từng bài giảng, sửa nội dung rồi xuất bản.",
			newCollection: "Tạo khoá học",
			collectionTitle: "Tên khoá học",
			collectionExcerpt: "Mô tả ngắn",
			collectionDescription: "Mô tả",
			collectionDescriptionHint:
				"Hiện dưới tên khoá trên trang học viên. Có thể in đậm, nghiêng, và danh sách.",
			stages: "Giai đoạn lịch học",
			stagesHint:
				"Mỗi giai đoạn là một khoảng ngày trên lịch. Để trống nếu khoá chưa dùng lịch.",
			stageTitle: "Tên giai đoạn",
			dayStart: "Ngày bắt đầu",
			dayEnd: "Ngày kết thúc",
			addStage: "Thêm giai đoạn",
			removeStage: "Xóa giai đoạn",
			accessTier: "Gói",
			accessFree: "Free",
			accessPro: "Pro",
			published: "Đã xuất bản",
			draft: "Nháp",
			lecturesCount: (count: number) => `${count} bài giảng`,
			exerciseCount: (count: number) =>
				count === 0 ? "Chưa có bài tập" : `${count} câu`,
			emptyCollections:
				"Chưa có khoá học. Tạo khoá trước, rồi upload PDF.",
			emptyLectures:
				"Chưa có bài giảng. Upload PDF để Gemini trích xuất.",
			uploadPdf: "Upload PDF",
			reuploadPdf: "Upload lại",
			uploadHint:
				"Một PDF = một bài giảng. Gemini lấy lý thuyết và bài tập; file không được lưu.",
			reuploadHint:
				"Upload PDF để ghi đè nội dung bài giảng này. File không được lưu.",
			extracting: "Đang trích xuất…",
			extractFailed: "Trích xuất thất bại",
			save: "Cập nhật",
			reindexCatalog: "Index lại catalog (RAG)",
			reindexCatalogHint: "Tạo lại vector index cho các bài đã xuất bản.",
			openChat: "chatbot",
			chatTitle: "Chatbot",
			chatEmpty: "Hỏi về lý thuyết, bài tập, hoặc bài nên học tiếp.",
			chatContext: "Ngữ cảnh",
			chatNoLectures: "Chưa có bài giảng đã xuất bản để chat.",
			chatThinking: "Đang trả lời…",
			chatSuggestions: [
				"Giới từ sau interested là gì?",
				"Giải thích câu 3 giúp mình",
				"Nên học bài nào tiếp theo?",
			],
			publish: "Xuất bản",
			unpublish: "Gỡ xuất bản",
			delete: "Xóa",
			deleteConfirm: "Xóa bài giảng này?",
			deleteCollectionConfirm: "Xóa khoá học này?",
			backToCollections: "Tất cả khoá học",
			reorder: {
				action: "Sắp xếp bài giảng",
				title: "Sắp xếp bài giảng",
				description:
					"Kéo thả để đổi thứ tự các bài giảng trong khoá. Thứ tự này dùng trên trang admin và danh sách học viên.",
				save: "Lưu thứ tự",
				saving: "Đang lưu…",
				cancel: "Hủy",
				empty: "Khoá học chưa có bài để sắp xếp.",
				mismatch:
					"Danh sách bài giảng đã thay đổi. Đóng hộp thoại và thử lại.",
				dragHandle: "Kéo để đổi thứ tự",
			},
			toast: {
				reordered: "Đã lưu thứ tự bài giảng.",
				reindexed: (indexed: number) =>
					`Đã index ${indexed} bài đã xuất bản.`,
			},
			fields: {
				title: "Tiêu đề",
				excerpt: "Phụ đề",
				body: "Nội dung HTML",
				insertImage: "Chèn ảnh",
				insertingImage: "Đang tải ảnh…",
				alignTags: "Căn chỉnh thẻ",
				itemType: "Loại bài",
				itemTypes: {
					normal: "Bài học",
					practice: "Luyện đề",
					test: "Mini test",
					final: "Final test",
					rest: "Ngày nghỉ",
					vocab: "Từ vựng",
				},
				tags: "Kỹ năng",
				tagsHint: "Chọn kỹ năng bài này xây hoặc kiểm tra.",
				skillGroupGrammar: "Ngữ pháp",
				skillGroupVocabulary: "Từ vựng",
				minutes: "Số phút",
				dayNumber: "Ngày trong lịch",
				dayNumberHint:
					"Một bài giảng một ngày. Để trống nếu chưa xếp lịch.",
				reviewGoal: "Bài luyện tập",
				reviewGoalHint: "Hiện trên thẻ luyện tập của ngày.",
				restDay: "Ngày nghỉ",
				miniTestDay: "Mini test",
				format: "Dạng bài",
				formatLesson: "Lý thuyết",
				formatPractice: "Luyện đề",
				practiceBank: "Luyện đề cuối bài",
				practiceEmpty: "Chưa gắn câu nào.",
				practiceAdd: "Thêm",
				practiceAdded: "Đã thêm",
				practiceRemove: "Bỏ",
				practiceMoveUp: "Lên",
				practiceMoveDown: "Xuống",
				vocabAdd: "Thêm từ",
				vocabWord: "Từ",
				vocabTerm: "Từ vựng",
				vocabIpa: "Phiên âm",
				vocabType: "Loại từ",
				vocabMeaning: "Nghĩa tiếng Việt",
				vocabExampleEn: "Ví dụ",
				vocabExampleVi: "Dịch ví dụ",
				preview: "Xem trước",
				exercise: "Phần luyện tập",
				exerciseEmpty: "Chưa có phần luyện tập.",
				addSection: "Thêm phần",
				sectionTitle: "Tên phần",
				insertExerciseLink: "Chèn liên kết",
				addQuestion: "Thêm câu",
				testSections: "Nội dung test",
				testSectionKind: "Dạng phần",
				testSectionKindMcq: "Bài luyện tập",
				testSectionKindPart1: "Part 1",
				searchBank: "Tìm kiếm",
				searchConfirm: "Thêm câu",
				addFromBank: "Từ Bộ đề Part 5",
				bankFilter: "Lọc câu",
				bankSource: "Từ Bộ đề",
				questionSource: "Nguồn câu",
				questionSourcePlaceholder: "Chọn nguồn",
				sourceManual: "Nhập tay",
				sourceBank: "Từ Bộ đề",
				bankQuestionNo: "Câu số",
				bankPickHint: "Chọn bộ đề, đề và số câu để điền form.",
				addToSection: "Thêm câu",
				questionNumber: (number: number) => `Câu ${number}`,
				outlineSection: (index: number, title: string) =>
					title.trim()
						? `Phần ${index} · ${title.trim()}`
						: `Phần ${index}`,
				saveSection: "Lưu phần",
				discardItem: "Bỏ",
				discardChanges: "Bỏ thay đổi",
				saveQuestion: "Lưu câu",
				deleteQuestion: "Xóa câu",
				deleteQuestionConfirm: "Xóa câu này?",
				deleteSection: "Xóa phần",
				deleteSectionConfirm: (count: number) =>
					count > 0
						? `Xóa phần này và ${count} câu?`
						: "Xóa phần này?",
				unsavedChoice:
					"Mục đang mở chưa được lưu. OK để lưu và tiếp tục, Cancel để bỏ thay đổi và tiếp tục.",
				unsavedBlock: "Lưu hoặc bỏ mục đang mở trước khi lưu bài.",
				questionIncomplete: "Hoàn thành câu trước khi lưu.",
				sectionNoQuestions: "Chưa có câu trong phần này.",
				stem: "Câu hỏi",
				kind: "Dạng bài",
				kinds: {
					multiple_choice: "Trắc nghiệm",
					highlight: "Tô từ",
					rewrite: "Viết lại câu",
					fill_blank: "Điền chỗ trống",
				},
				sentence: "Câu cần tô",
				labelName: "Tên nhãn",
				addLabel: "Thêm nhãn",
				prompt: "Đề bài",
				accepted: "Câu chấp nhận",
				addAccepted: "Thêm câu",
				fillTemplate: "Câu có chỗ trống",
				fillTemplateHint: "Dùng ______ cho mỗi chỗ trống.",
				explanation: "Giải thích",
				explanationDetails: "Giải thích và trích dẫn",
				correct: "Đáp án đúng",
			},
			errors: {
				notSignedIn: "Vui lòng đăng nhập.",
				notAdmin: "Tài khoản chưa có quyền admin.",
				titleRequired: "Tiêu đề không được để trống.",
				bodyRequired: "Cần nội dung lý thuyết trước khi xuất bản.",
				vocabRequired: "Mỗi từ cần có từ vựng và nghĩa tiếng Việt.",
				dayInvalid: "Ngày phải là số nguyên dương.",
				dayTaken: "Ngày này đã có bài giảng khác.",
				stageTitleRequired: "Tên giai đoạn không được để trống.",
				stageDayInvalid: "Ngày giai đoạn phải là số nguyên dương.",
				stageRange:
					"Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.",
				stageOverlap: "Các giai đoạn không được trùng ngày.",
				collectionNotEmpty:
					"Xóa hết bài giảng trong khoá trước khi xóa khoá học.",
				hasProgress: "Không xóa được bài giảng đã có học viên học.",
				imageMissing: "Chọn file ảnh.",
				imageInvalidType: "Chỉ chấp nhận JPG, PNG, hoặc WebP.",
				imageTooLarge: "Ảnh quá lớn.",
				imageUploadFailed: "Không tải được ảnh.",
				pdfRequired: "Chọn file PDF.",
				pdfInvalidType: "Chỉ chấp nhận PDF.",
				pdfTooLarge: "File PDF quá lớn.",
				geminiMissing: "Chưa cấu hình GEMINI_API_KEY.",
				extractFailed: "Gemini không trích xuất được bài giảng.",
				reindexFailed: "Không index được catalog.",
				generic: "Có lỗi xảy ra. Thử lại.",
				questionNotFound: "Không tìm thấy câu này trong đề.",
			},
		},
	},
} as const;
