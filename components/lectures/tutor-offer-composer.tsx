"use client";

import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy/vi";

export function TutorOfferComposer({
  onYes,
  onNo,
  yesPending,
}: {
  onYes: () => void;
  onNo: () => void;
  yesPending?: boolean;
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full"
        disabled={yesPending}
        onClick={onNo}
      >
        {copy.lectures.tutorOfferNo}
      </Button>
      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={yesPending}
        onClick={onYes}
      >
        {copy.lectures.tutorOfferYes}
      </Button>
    </div>
  );
}
