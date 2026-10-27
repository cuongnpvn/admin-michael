"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy/vi";
import {
  emptyLectureVocabDraft,
  type LectureVocabDraft,
} from "@/lib/lectures/vocab";

export function AdminLectureVocabEditor({
  items,
  onChange,
}: {
  items: LectureVocabDraft[];
  onChange: (items: LectureVocabDraft[]) => void;
}) {
  function update(index: number, patch: Partial<LectureVocabDraft>) {
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    const [row] = next.splice(index, 1);
    next.splice(nextIndex, 0, row);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={item.clientKey}
          className="space-y-3 rounded-[12px] border border-border p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {copy.admin.lectures.fields.vocabWord} {index + 1}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                {copy.admin.lectures.fields.practiceMoveUp}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                {copy.admin.lectures.fields.practiceMoveDown}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              >
                {copy.admin.lectures.fields.practiceRemove}
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label={copy.admin.lectures.fields.vocabTerm}
              value={item.term}
              onChange={(term) => update(index, { term })}
            />
            <Field
              label={copy.admin.lectures.fields.vocabIpa}
              value={item.ipa}
              onChange={(ipa) => update(index, { ipa })}
            />
            <Field
              label={copy.admin.lectures.fields.vocabType}
              value={item.wordType}
              onChange={(wordType) => update(index, { wordType })}
            />
            <Field
              label={copy.admin.lectures.fields.vocabMeaning}
              value={item.meaningVi}
              onChange={(meaningVi) => update(index, { meaningVi })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={copy.admin.lectures.fields.vocabExampleEn}
              value={item.exampleEn}
              onChange={(exampleEn) => update(index, { exampleEn })}
            />
            <Field
              label={copy.admin.lectures.fields.vocabExampleVi}
              value={item.exampleVi}
              onChange={(exampleVi) => update(index, { exampleVi })}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...items, emptyLectureVocabDraft()])}
      >
        {copy.admin.lectures.fields.vocabAdd}
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
