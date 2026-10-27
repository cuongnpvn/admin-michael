"use client";

import { NotebookAddToDeckInline } from "@/components/notebook/notebook-add-to-deck-inline";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { copy } from "@/lib/copy/vi";
import { formatNotebookNoteTime } from "@/lib/notebook/format-date";
import { isHtmlNoteBody } from "@/lib/notebook/note-body";
import { wrapExampleQuotes } from "@/lib/notebook/wrap-example-quotes";
import type { VocabularyItemPayload } from "@/lib/vocabulary/vocabulary-item-payload";
import { cn } from "@/lib/utils";

interface DictionaryLookupResultCardProps {
  word: string;
  body: string;
  lookedUpAt: string;
  payload?: VocabularyItemPayload | null;
  highlighted?: boolean;
  className?: string;
}

function formatIpaLine(
  ipaUs: string | null | undefined,
  ipaUk: string | null | undefined,
): string | null {
  const us = ipaUs?.trim();
  const uk = ipaUk?.trim();
  if (us && uk && us !== uk) {
    return `US: ${us} · UK: ${uk}`;
  }
  return us || uk || null;
}

function LookupStructuredBody({
  word,
  payload,
}: {
  word: string;
  payload: VocabularyItemPayload;
}) {
  const wordTypes = payload.wordTypes.filter(Boolean);
  const synonyms = payload.synonyms.filter(Boolean);
  const collocations = payload.collocations.filter(Boolean);
  const lemma = payload.lemma?.trim() ?? "";
  const showLemma =
    lemma.length > 0 &&
    lemma.localeCompare(word, undefined, { sensitivity: "accent" }) !== 0;
  const meaningVi = payload.meaningVi?.trim();
  const definitionEn = payload.definitionEn?.trim();
  const example = payload.example?.trim();

  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
      {payload.level || wordTypes.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {payload.level ? (
            <Badge variant="default">{payload.level}</Badge>
          ) : null}
          {wordTypes.map((type) => (
            <Badge key={type} variant="secondary">
              {type}
            </Badge>
          ))}
        </div>
      ) : null}

      {showLemma ? (
        <p>
          <strong>{copy.vocab.manage.fields.lemma}:</strong> {lemma}
        </p>
      ) : null}

      {meaningVi ? (
        <p>
          <span className="font-medium">{copy.notebook.lookupMeaningVi}:</span>{" "}
          {meaningVi}
        </p>
      ) : null}

      {definitionEn ? (
        <p>
          <span className="font-medium">{copy.notebook.lookupMeaningEn}:</span>{" "}
          {definitionEn}
        </p>
      ) : null}

      {example ? (
        <p className="italic">{wrapExampleQuotes(example)}</p>
      ) : null}

      {synonyms.length > 0 ? (
        <p>
          <strong>{copy.vocab.practice.synonymsLabel}:</strong>{" "}
          {synonyms.join(", ")}
        </p>
      ) : null}

      {collocations.length > 0 ? (
        <p>
          <strong>{copy.vocab.practice.collocationsLabel}:</strong>{" "}
          {collocations.join("; ")}
        </p>
      ) : null}
    </div>
  );
}

function LookupHtmlBody({ body }: { body: string }) {
  if (isHtmlNoteBody(body)) {
    return (
      <div
        className={cn(
          "notebook-note-content text-sm leading-relaxed text-foreground/90",
          "[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_strong]:font-semibold [&_em]:italic",
        )}
        dangerouslySetInnerHTML={{ __html: body }}
      />
    );
  }

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
      {body}
    </p>
  );
}

export function DictionaryLookupResultCard({
  word,
  body,
  lookedUpAt,
  payload,
  highlighted = false,
  className,
}: DictionaryLookupResultCardProps) {
  const ipaLine = payload
    ? formatIpaLine(payload.ipaUs, payload.ipaUk)
    : null;

  return (
    <Card
      className={cn(
        "shadow-none",
        highlighted && "ring-2 ring-primary/40",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 p-4 pb-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
          <CardTitle className="min-w-0 break-words text-base leading-snug">
            {word}
          </CardTitle>
          {ipaLine ? (
            <span className="text-sm italic text-muted-foreground">
              {ipaLine}
            </span>
          ) : null}
        </div>
        <time
          dateTime={lookedUpAt}
          className="shrink-0 pt-0.5 text-xs text-muted-foreground"
        >
          {formatNotebookNoteTime(lookedUpAt)}
        </time>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {payload ? (
          <LookupStructuredBody word={word} payload={payload} />
        ) : (
          <LookupHtmlBody body={body} />
        )}
        {payload ? <NotebookAddToDeckInline payload={payload} /> : null}
      </CardContent>
    </Card>
  );
}

interface DictionaryLookupShimmerCardProps {
  word: string;
}

export function DictionaryLookupShimmerCard({
  word,
}: DictionaryLookupShimmerCardProps) {
  return (
    <Card
      className="shadow-none"
      aria-busy="true"
      aria-label={copy.notebook.lookupLoading}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 p-4 pb-2">
        <CardTitle className="min-w-0 flex-1 break-words text-base leading-snug">
          {word}
        </CardTitle>
        <span className="h-3 w-16 shrink-0 animate-pulse rounded-full bg-muted/70" />
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        <div className="h-4 w-full animate-pulse rounded-[10px] bg-muted/70" />
        <div className="h-4 w-5/6 animate-pulse rounded-[10px] bg-muted/70" />
        <div className="h-4 w-2/3 animate-pulse rounded-[10px] bg-muted/70" />
      </CardContent>
    </Card>
  );
}
