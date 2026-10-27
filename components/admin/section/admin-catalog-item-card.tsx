"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  CatalogItemSubtitle,
  catalogItemShowsSubtitle,
} from "@/components/catalog/catalog-item-subtitle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminPartPath } from "@/lib/admin/admin-paths";
import type { StudyCatalogItem } from "@/lib/catalog/study-section-items";
import { copy } from "@/lib/copy/vi";
import type { PublishSection } from "@/lib/content/validate-section-counts";
import { cn } from "@/lib/utils";

interface AdminCatalogItemCardProps {
  bookId: string;
  testId: string;
  item: StudyCatalogItem;
  section: PublishSection;
  className?: string;
}

export function AdminCatalogItemCard({
  bookId,
  testId,
  item,
  section,
  className,
}: AdminCatalogItemCardProps) {
  const showSubtitle = catalogItemShowsSubtitle(item);

  return (
    <Card
      className={cn(
        "flex h-full flex-col transition-calm hover:-translate-y-px hover:shadow-card",
        className,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-2 min-h-11 text-base leading-snug">
          {item.title}
        </CardTitle>
        {showSubtitle ? <CatalogItemSubtitle item={item} /> : null}
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        <div className="flex w-full justify-end">
          <Button asChild variant="secondary" size="sm" className="shrink-0">
            <Link href={adminPartPath(bookId, testId, item.part, undefined, section)}>
              {copy.admin.actions.manage}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
