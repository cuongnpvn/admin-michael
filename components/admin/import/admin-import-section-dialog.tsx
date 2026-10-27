"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ImportListeningJsonDialog } from "@/components/admin/import/import-listening-json-dialog";
import { ImportReadingJsonDialog } from "@/components/admin/import/import-reading-json-dialog";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminImportSectionDialogProps {
  disabled?: boolean;
  disabledReason?: string;
}

export function AdminImportSectionDialog({
  disabled,
  disabledReason,
}: AdminImportSectionDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <Plus className="size-4" />
          {copy.admin.exams.importAdd}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.admin.import.title}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="listening" className="gap-4">
          <TabsList className="w-full">
            <TabsTrigger value="listening" className="flex-1">
              Listening
            </TabsTrigger>
            <TabsTrigger value="reading" className="flex-1">
              Reading
            </TabsTrigger>
          </TabsList>
          <TabsContent value="listening" className="mt-4">
            <ImportListeningJsonDialog
              disabled={disabled}
              disabledReason={disabledReason}
              embedded
              onSuccess={() => setOpen(false)}
            />
          </TabsContent>
          <TabsContent value="reading" className="mt-4">
            <ImportReadingJsonDialog
              disabled={disabled}
              disabledReason={disabledReason}
              embedded
              onSuccess={() => setOpen(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
