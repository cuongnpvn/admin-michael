"use client";

import { Plus, Trash2 } from "lucide-react";
import type { TranslationDraft } from "@/components/admin/exams/admin-question-detail-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy/vi";

interface AdminPassageTranslationsEditorProps {
	translations: TranslationDraft[];
	onChange: (translations: TranslationDraft[]) => void;
	/** When set, labels the editor for a passage in a multi-passage set. */
	passageNumber?: number;
	partNum?: number;
}

export function AdminPassageTranslationsEditor({
	translations,
	onChange,
	passageNumber,
	partNum,
}: AdminPassageTranslationsEditorProps) {
	function patchTranslation(index: number, patch: Partial<TranslationDraft>) {
		onChange(
			translations.map((row, i) =>
				i === index ? { ...row, ...patch } : row,
			),
		);
	}

	const isPart6 = partNum === 6;
	const vietnamesePlaceholder = isPart6
		? copy.admin.cms.part6TranslationVietnamesePlaceholder
		: copy.admin.cms.translationVietnamese;

	return (
		<div className="space-y-3 border-t border-border pt-6">
			<div className="flex items-center justify-between gap-2">
				<div>
					<Label>
						{passageNumber
							? `${copy.admin.cms.translationsTitle} — ${copy.admin.cms.passageTranslationPassageLabel(passageNumber)}`
							: copy.admin.cms.translationsTitle}
					</Label>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						onChange([
							...translations,
							{ english: "", vietnamese: "" },
						])
					}
				>
					<Plus className="size-4" />
					{copy.admin.cms.addTranslation}
				</Button>
			</div>

			{translations.length === 0 ? (
				<p className="rounded-[10px] border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
					{copy.admin.cms.noTranslations}
				</p>
			) : (
				<div className="space-y-3">
					{translations.map((row, index) => (
						<div
							key={index}
							className="space-y-2 rounded-[12px] border border-border bg-muted/20 p-3"
						>
							<div className="flex items-center justify-between gap-2">
								<span className="text-xs font-medium text-muted-foreground">
									{copy.admin.cms.translationRow(index + 1)}
								</span>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="size-8 text-muted-foreground hover:text-destructive"
									aria-label={
										copy.admin.cms.removeTranslation
									}
									onClick={() =>
										onChange(
											translations.filter(
												(_, i) => i !== index,
											),
										)
									}
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
							<textarea
								value={row.english}
								rows={2}
								placeholder={copy.admin.cms.translationEnglish}
								onChange={(event) =>
									patchTranslation(index, {
										english: event.target.value,
									})
								}
								className="min-h-[56px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
							<textarea
								value={row.vietnamese}
								rows={2}
								placeholder={vietnamesePlaceholder}
								onChange={(event) =>
									patchTranslation(index, {
										vietnamese: event.target.value,
									})
								}
								className="min-h-[56px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
