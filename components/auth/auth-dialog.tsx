"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_NAME, copy } from "@/lib/copy/vi";
import { LEGAL_PATHS } from "@/lib/legal/constants";

function AuthLegalNotice({ className, linkClassName }: { className: string; linkClassName: string }) {
  return (
    <p className={className}>
      {copy.auth.termsPrefix}{" "}
      <Link href={LEGAL_PATHS.terms} className={linkClassName}>
        {copy.auth.termsLink}
      </Link>{" "}
      {copy.auth.termsAnd}{" "}
      <Link href={LEGAL_PATHS.privacy} className={linkClassName}>
        {copy.auth.privacyLink}
      </Link>{" "}
      {copy.auth.termsSuffix}
    </p>
  );
}

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
};

function AuthBrandPanel() {
  return (
    <aside className="relative flex min-h-[280px] flex-col justify-between gap-10 overflow-hidden bg-primary px-10 py-12 text-primary-foreground lg:min-h-[520px] lg:gap-14 lg:px-14 lg:py-16">
      <div
        className="pointer-events-none absolute -left-16 top-8 size-64 rounded-full bg-primary-foreground/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 bottom-16 size-52 rounded-full bg-primary-foreground/8 blur-2xl"
        aria-hidden
      />

      <div className="relative space-y-5">
        <p className="text-sm font-medium tracking-wide text-primary-foreground/80">
          {APP_NAME}
        </p>
        <h2 className="font-serif text-2xl leading-snug text-primary-foreground lg:text-3xl lg:leading-snug">
          {copy.auth.brandSlogan}
        </h2>
      </div>

      <ul className="relative space-y-5">
        {copy.auth.brandFeatures.map((feature) => (
          <li key={feature} className="flex items-start gap-4 text-sm leading-relaxed lg:text-base">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
              <Check className="size-3.5" strokeWidth={2.5} />
            </span>
            <span className="text-primary-foreground/90">{feature}</span>
          </li>
        ))}
      </ul>

      <AuthLegalNotice
        className="relative text-xs leading-relaxed text-primary-foreground/70 lg:text-sm lg:leading-relaxed"
        linkClassName="underline decoration-primary-foreground/40 underline-offset-2 hover:text-primary-foreground"
      />
    </aside>
  );
}

export function AuthDialog({ open, onOpenChange, redirectTo }: AuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={[
          "grid max-h-[min(760px,calc(100vh-2rem))] max-w-4xl gap-0 overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl",
          "[&>button]:right-6 [&>button]:top-6 [&>button]:text-muted-foreground",
          "[&>button]:hover:text-foreground md:[&>button]:text-primary-foreground/80",
          "md:[&>button]:hover:text-primary-foreground",
        ].join(" ")}
      >
        <div className="grid md:min-h-[520px] md:grid-cols-2">
          <section className="flex flex-col justify-center px-10 py-12 lg:px-14 lg:py-16">
            <DialogHeader className="space-y-5 text-left">
              <DialogTitle className="text-2xl font-semibold tracking-tight lg:text-3xl">
                {copy.auth.dialogTitle}
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed lg:text-lg lg:leading-relaxed">
                {copy.auth.dialogDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-12">
              <GoogleSignInButton redirectTo={redirectTo} />
            </div>

            <AuthLegalNotice
              className="mt-10 text-center text-xs leading-relaxed text-muted-foreground md:hidden lg:text-sm"
              linkClassName="text-foreground/80 underline underline-offset-2"
            />
          </section>

          <AuthBrandPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
}
