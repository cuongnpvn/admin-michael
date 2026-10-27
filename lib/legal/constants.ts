import { APP_NAME } from "@/lib/copy/vi";
import { LANDING_CONTACT } from "@/lib/mock/landing";

export const LEGAL_PATHS = {
  privacy: "/privacy-policy",
  terms: "/terms-of-service",
} as const;

export const LEGAL_CONTACT_EMAIL = LANDING_CONTACT.gmail.display;
export const LEGAL_CONTACT_MAILTO = LANDING_CONTACT.gmail.href;

export const LEGAL_LAST_UPDATED_ISO = "2026-08-14";
export const LEGAL_LAST_UPDATED_VI = "14 tháng 8, 2026";
export const LEGAL_LAST_UPDATED_EN = "August 14, 2026";

export const LEGAL_SERVICE_NAME = APP_NAME;
