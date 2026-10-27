"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { CreateVocabDeckDialog } from "@/components/admin/vocab/create-vocab-deck-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteVocabularyDeck } from "@/lib/admin/vocabulary/actions";
import type { VocabularyDeckSummary } from "@/lib/admin/vocabulary/types";
import { copy } from "@/lib/copy/vi";
import { adminVocabDeckPath } from "@/lib/vocabulary/vocabulary-paths";

interface AdminVocabDeckGridProps {
  decks: VocabularyDeckSummary[];
}

function AdminVocabDeckCard({ deck }: { deck: VocabularyDeckSummary }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteVocabularyDeck(deck.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            <Link
              href={adminVocabDeckPath(deck.id)}
              className="hover:text-primary"
            >
              {deck.name}
            </Link>
          </CardTitle>
          <Badge variant={deck.published ? "default" : "secondary"}>
            {deck.published
              ? copy.admin.vocabManage.published
              : copy.admin.vocabManage.draft}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {copy.admin.vocabManage.wordCount(deck.wordCount)}
        </p>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between gap-2 pt-0">
        <Button asChild variant="outline" size="sm">
          <Link href={adminVocabDeckPath(deck.id)}>
            {copy.admin.actions.manage}
          </Link>
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              disabled={isPending}
            >
              <Trash2 className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {copy.admin.vocabManage.deleteDeckTitle}
              </DialogTitle>
              <DialogDescription>
                {copy.admin.vocabManage.deleteDeckDescription(deck.name)}
              </DialogDescription>
            </DialogHeader>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {copy.admin.cms.cancel}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={handleDelete}
              >
                {copy.admin.vocabManage.deleteDeckConfirm}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export function AdminVocabDeckGrid({ decks }: AdminVocabDeckGridProps) {
  if (decks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {copy.admin.vocabManage.emptyDecks}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <AdminVocabDeckCard key={deck.id} deck={deck} />
      ))}
    </div>
  );
}
