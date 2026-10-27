"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminTestOverview } from "@/components/admin/exams/admin-test-overview";
import { AdminSectionTestOverview } from "@/components/admin/section/admin-section-test-overview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAdminTestTitle } from "@/lib/admin/admin-paths";
import type { AdminTestStats } from "@/lib/admin/content/stats";
import { loadAdminTestTabData } from "@/lib/admin/load-admin-test-tab-data";
import { copy } from "@/lib/copy/vi";
import type { PublishSection } from "@/lib/content/publish-test";
import { cn } from "@/lib/utils";
import type { BookCatalogEntry } from "@/types/test-data";

interface AdminSectionBookTabsProps {
	books: BookCatalogEntry[];
	section: PublishSection | "exam";
	lazyLoadTests?: boolean;
	testStatsMapByBook?: Record<
		string,
		Record<string, AdminTestStats | null | undefined>
	>;
	/** Single locked book (entrance test). Test tabs stay; book tabs do not. */
	hideBookTabs?: boolean;
	className?: string;
}

function getDefaultTestId(book: BookCatalogEntry): string {
	return book.tests[0]?.id ?? "";
}

function resolveBookId(
	books: BookCatalogEntry[],
	bookId: string | null,
): string {
	if (bookId && books.some((book) => book.id === bookId)) {
		return bookId;
	}
	return books[0]?.id ?? "";
}

function resolveTestId(
	book: BookCatalogEntry | undefined,
	testId: string | null,
): string {
	if (!book) return "";
	if (testId && book.tests.some((test) => test.id === testId)) {
		return testId;
	}
	return getDefaultTestId(book);
}

function readSelectionFromLocation(
	books: BookCatalogEntry[],
	hideBookTabs: boolean,
) {
	const params = new URLSearchParams(window.location.search);
	const bookId = hideBookTabs
		? (books[0]?.id ?? "")
		: resolveBookId(books, params.get("bookId"));
	const book = books.find((entry) => entry.id === bookId) ?? books[0];
	const testId = resolveTestId(book, params.get("testId"));
	return { bookId, testId };
}

function pushSelectionToUrl(
	bookId: string,
	testId: string,
	options?: { omitBookId?: boolean },
) {
	const params = new URLSearchParams(window.location.search);
	const currentTestId = params.get("testId") ?? "";
	const bookMatches = options?.omitBookId
		? !params.has("bookId")
		: params.get("bookId") === bookId;
	if (bookMatches && currentTestId === testId) {
		return;
	}

	if (options?.omitBookId) {
		params.delete("bookId");
	} else {
		params.set("bookId", bookId);
	}
	if (testId) {
		params.set("testId", testId);
	} else {
		params.delete("testId");
	}
	params.delete("part");
	params.delete("question");
	const query = params.toString();
	const next = query
		? `${window.location.pathname}?${query}`
		: window.location.pathname;
	window.history.pushState(window.history.state, "", next);
}

function AdminTestTabPanel({
	section,
	book,
	test,
	testTitle,
	testStats,
	isLoading,
}: {
	section: PublishSection | "exam";
	book: BookCatalogEntry;
	test: import("@/types/test-data").TestCatalogEntry;
	testTitle: string;
	testStats?: AdminTestStats | null;
	isLoading: boolean;
}) {
	if (isLoading) {
		return (
			<p className="py-8 text-center text-sm text-muted-foreground">
				{copy.exam.loadingLobby}
			</p>
		);
	}

	if (section === "exam") {
		return (
			<AdminTestOverview
				book={book}
				test={test}
				testTitle={testTitle}
				testStats={testStats ?? undefined}
				showBackLink={false}
			/>
		);
	}

	const backHref = "/admin/exams";
	const backLabel = copy.admin.exams.breadcrumbExams;

	return (
		<AdminSectionTestOverview
			book={book}
			test={test}
			testTitle={testTitle}
			testStats={testStats ?? undefined}
			section={section}
			backHref={backHref}
			backLabel={backLabel}
			showBackLink={false}
		/>
	);
}

function AdminSectionBookTabsInner({
	books,
	section,
	lazyLoadTests = false,
	testStatsMapByBook: initialTestStatsMapByBook,
	hideBookTabs = false,
	className,
}: AdminSectionBookTabsProps) {
	const searchParams = useSearchParams();
	const defaultBookId = hideBookTabs
		? (books[0]?.id ?? "")
		: resolveBookId(books, searchParams.get("bookId"));
	const defaultBook =
		books.find((book) => book.id === defaultBookId) ?? books[0];
	const defaultTestId = resolveTestId(
		defaultBook,
		searchParams.get("testId"),
	);

	const [activeBookId, setActiveBookId] = useState(defaultBookId);
	const [selectedTestByBook, setSelectedTestByBook] = useState<
		Record<string, string>
	>(() => {
		if (!defaultBookId || !defaultTestId) return {};
		return { [defaultBookId]: defaultTestId };
	});
	const [testStatsMapByBook, setTestStatsMapByBook] = useState(
		initialTestStatsMapByBook ?? {},
	);
	const [loadingTestKey, setLoadingTestKey] = useState<string | null>(null);

	const activeTestId =
		selectedTestByBook[activeBookId] ??
		getDefaultTestId(
			books.find((book) => book.id === activeBookId) ?? books[0],
		);

	useEffect(() => {
		const onPopState = () => {
			const { bookId, testId } = readSelectionFromLocation(
				books,
				hideBookTabs,
			);
			if (!bookId) return;
			setActiveBookId(bookId);
			if (!testId) return;
			setSelectedTestByBook((previous) => ({
				...previous,
				[bookId]: testId,
			}));
		};

		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, [books, hideBookTabs]);

	const isTestDataLoaded = useCallback(
		(bookId: string, testId: string) => {
			const statsLoaded =
				testStatsMapByBook[bookId] !== undefined &&
				testId in (testStatsMapByBook[bookId] ?? {});

			return statsLoaded;
		},
		[testStatsMapByBook],
	);

	const fetchTestData = useCallback(
		async (bookId: string, testId: string) => {
			const key = `${bookId}:${testId}`;
			if (isTestDataLoaded(bookId, testId)) {
				return;
			}

			setLoadingTestKey(key);
			try {
				const data = await loadAdminTestTabData(bookId, testId);

				setTestStatsMapByBook((previous) => ({
					...previous,
					[bookId]: {
						...(previous[bookId] ?? {}),
						[testId]: data.testStats,
					},
				}));
			} finally {
				setLoadingTestKey((current) => (current === key ? null : current));
			}
		},
		[isTestDataLoaded],
	);

	useEffect(() => {
		if (!lazyLoadTests || !activeBookId || !activeTestId) {
			return;
		}

		void fetchTestData(activeBookId, activeTestId);
	}, [lazyLoadTests, activeBookId, activeTestId, fetchTestData]);

	const handleBookChange = (bookId: string) => {
		const book = books.find((entry) => entry.id === bookId);
		const testId =
			selectedTestByBook[bookId] ??
			(book ? getDefaultTestId(book) : "");

		setActiveBookId(bookId);
		if (testId) {
			setSelectedTestByBook((previous) => ({
				...previous,
				[bookId]: testId,
			}));
		}
		pushSelectionToUrl(bookId, testId, { omitBookId: hideBookTabs });
	};

	const handleTestChange = (bookId: string, testId: string) => {
		setSelectedTestByBook((previous) => ({
			...previous,
			[bookId]: testId,
		}));
		pushSelectionToUrl(bookId, testId, { omitBookId: hideBookTabs });
	};

	if (books.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				{copy.admin.emptyTable}
			</p>
		);
	}

	return (
		<div className={cn("space-y-6", className)}>
			<Tabs
				value={activeBookId}
				onValueChange={handleBookChange}
				className="gap-4"
			>
				{hideBookTabs ? null : (
				<TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-[16px] p-1.5">
					{books.map((book) => (
						<TabsTrigger
							key={book.id}
							value={book.id}
							className="shrink-0 px-4 py-2 text-sm"
						>
							{book.name}
						</TabsTrigger>
					))}
				</TabsList>
				)}
				{books.map((book) => {
					const testStatsMap = testStatsMapByBook[book.id];
					const bookDefaultTest = getDefaultTestId(book);
					const selectedTestId =
						book.id === activeBookId
							? activeTestId
							: (selectedTestByBook[book.id] ?? bookDefaultTest);
					const isActiveBook = book.id === activeBookId;

					return (
						<TabsContent
							key={book.id}
							value={book.id}
							className="mt-0"
						>
							{book.tests.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									{copy.admin.emptyTable}
								</p>
							) : (
							<Tabs
								value={selectedTestId}
								onValueChange={(testId) =>
									handleTestChange(book.id, testId)
								}
								className="gap-6"
							>
								<TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-[14px] bg-muted/60 p-1">
									{book.tests.map((test) => (
										<TabsTrigger
											key={test.id}
											value={test.id}
											className="shrink-0 px-3 py-1.5 text-xs sm:text-sm"
										>
											{test.label}
										</TabsTrigger>
									))}
								</TabsList>
								{book.tests.map((test) => {
									const testStats = testStatsMap?.[test.id];
									const testTitle = formatAdminTestTitle(
										book,
										test.label,
									);
									const testKey = `${book.id}:${test.id}`;
									const isLoading =
										lazyLoadTests &&
										isActiveBook &&
										loadingTestKey === testKey &&
										!isTestDataLoaded(book.id, test.id);

									return (
										<TabsContent
											key={test.id}
											value={test.id}
											className="mt-6"
										>
											{lazyLoadTests ? (
												<AdminTestTabPanel
													section={section}
													book={book}
													test={test}
													testTitle={testTitle}
													testStats={testStats}
													isLoading={isLoading}
												/>
											) : section === "exam" ? (
												<AdminTestOverview
													book={book}
													test={test}
													testTitle={testTitle}
													testStats={
														testStats ?? undefined
													}
													showBackLink={false}
												/>
											) : (
												<AdminSectionTestOverview
													book={book}
													test={test}
													testTitle={testTitle}
													testStats={
														testStats ?? undefined
													}
													section={section}
													backHref="/admin/exams"
													backLabel={
														copy.admin.exams
															.breadcrumbExams
													}
													showBackLink={false}
												/>
											)}
										</TabsContent>
									);
								})}
							</Tabs>
							)}
						</TabsContent>
					);
				})}
			</Tabs>
		</div>
	);
}

export function AdminSectionBookTabs(props: AdminSectionBookTabsProps) {
	return (
		<Suspense
			fallback={
				<p className="py-8 text-center text-sm text-muted-foreground">
					{copy.exam.loadingLobby}
				</p>
			}
		>
			<AdminSectionBookTabsInner {...props} />
		</Suspense>
	);
}
