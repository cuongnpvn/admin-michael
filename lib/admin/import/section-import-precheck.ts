import {
  classifySectionImport,
  isFullTestImportFileShape,
  listeningPartNumbersFromJson,
} from "@/lib/content/import-shape";
import { copy } from "@/lib/copy/vi";

export type SectionImportTarget = "listening" | "reading";

export function sectionImportPrecheck(
  raw: string,
  target: SectionImportTarget,
): string | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }

  if (isFullTestImportFileShape(json)) {
    if (target === "reading") {
      return null;
    }
    return copy.admin.listeningImport.errors.fullTestFile;
  }

  const kind = classifySectionImport(json);

  if (kind === "mixed") {
    return target === "listening"
      ? copy.admin.listeningImport.errors.mixedParts
      : copy.admin.readingImport.errors.mixedParts;
  }

  if (target === "listening" && kind === "reading") {
    return copy.admin.listeningImport.errors.wrongSectionReading;
  }

  if (target === "reading" && kind === "listening") {
    return copy.admin.readingImport.errors.wrongSectionListening;
  }

  return null;
}

/** Create-exam dialog: single listening part JSON (Part 1–4). */
export function createExamListeningSinglePartJsonPrecheck(
  raw: string,
  expectedPart: 1 | 2 | 3 | 4,
): string | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return copy.admin.listeningImport.errors.invalidJson;
  }

  if (isFullTestImportFileShape(json)) {
    return copy.admin.listeningImport.errors.fullTestFile;
  }

  const parts = listeningPartNumbersFromJson(json);
  if (!parts || parts.length === 0) {
    return copy.admin.exams.create.listeningPartJsonInvalid(expectedPart);
  }

  if (parts.length !== 1 || parts[0] !== expectedPart) {
    const actual = parts[0];
    if (typeof actual === "number" && actual !== expectedPart) {
      return copy.admin.exams.create.listeningPartJsonWrongPart(
        expectedPart,
        actual,
      );
    }
    return copy.admin.exams.create.listeningPartJsonInvalid(expectedPart);
  }

  if (
    (expectedPart === 1 || expectedPart === 2) &&
    parts.some((part) => part >= 3)
  ) {
    return copy.admin.exams.create.listeningPartJsonPartsOnly12(expectedPart);
  }

  if (
    (expectedPart === 3 || expectedPart === 4) &&
    parts.some((part) => part === 1 || part === 2)
  ) {
    return copy.admin.exams.create.listeningPartJsonPartsOnly34(expectedPart);
  }

  const kind = classifySectionImport(json);
  if (kind === "reading") {
    return copy.admin.listeningImport.errors.wrongSectionReading;
  }
  if (kind === "mixed") {
    return copy.admin.listeningImport.errors.mixedParts;
  }

  return null;
}

/** Create-exam dialog: Part 1–2 JSON (parts array or wrapped object). */
export function createExamListeningPart12JsonPrecheck(raw: string): string | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return copy.admin.listeningImport.errors.invalidJson;
  }

  if (isFullTestImportFileShape(json)) {
    return copy.admin.listeningImport.errors.fullTestFile;
  }

  const parts = listeningPartNumbersFromJson(json);
  if (!parts || parts.length === 0) {
    return copy.admin.exams.create.listeningPart12JsonInvalid;
  }

  if (parts.some((part) => part >= 3)) {
    return copy.admin.exams.create.listeningPart12JsonPartsOnly12;
  }

  if (!parts.includes(1) || !parts.includes(2)) {
    return copy.admin.exams.create.listeningPart12JsonRequires12;
  }

  const kind = classifySectionImport(json);
  if (kind === "reading") {
    return copy.admin.listeningImport.errors.wrongSectionReading;
  }
  if (kind === "mixed") {
    return copy.admin.listeningImport.errors.mixedParts;
  }

  return null;
}

/** @deprecated Use createExamListeningSinglePartJsonPrecheck per part. */
export function createExamListeningJsonPrecheck(raw: string): string | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return copy.admin.listeningImport.errors.invalidJson;
  }

  if (isFullTestImportFileShape(json)) {
    return copy.admin.listeningImport.errors.fullTestFile;
  }

  const parts = listeningPartNumbersFromJson(json);
  if (!parts || parts.length === 0) {
    return copy.admin.exams.create.listeningJsonInvalid;
  }

  if (parts.some((part) => part === 1 || part === 2)) {
    return copy.admin.exams.create.listeningJsonPartsOnly34;
  }

  if (!parts.includes(3) || !parts.includes(4)) {
    return copy.admin.exams.create.listeningJsonRequires34;
  }

  const kind = classifySectionImport(json);
  if (kind === "reading") {
    return copy.admin.listeningImport.errors.wrongSectionReading;
  }
  if (kind === "mixed") {
    return copy.admin.listeningImport.errors.mixedParts;
  }

  return null;
}
