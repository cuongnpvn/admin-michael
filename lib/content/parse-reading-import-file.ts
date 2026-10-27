import {
  isFullTestImportFileShape,
  isReadingSectionImportShape,
} from "@/lib/content/import-shape";
import { readingImportFileFromFullTest } from "@/lib/content/reading-import-from-full-test";
import {
  isReadingPartsBundleShape,
  readingImportFromPartsBundle,
} from "@/lib/content/reading-import-from-parts-bundle";
import {
  readingImportFileSchema,
  type ReadingImportFile,
} from "@/lib/content/reading-import-schema";
import { parseTestImportFile } from "@/lib/content/schemas";

export function parseReadingImportFile(raw: string): ReadingImportFile {
  const json: unknown = JSON.parse(raw);

  if (isReadingSectionImportShape(json)) {
    return readingImportFileSchema.parse(json);
  }

  if (isFullTestImportFileShape(json)) {
    const fullTest = parseTestImportFile(raw);
    const converted = readingImportFileFromFullTest(fullTest);
    return readingImportFileSchema.parse(converted);
  }

  if (isReadingPartsBundleShape(json)) {
    const converted = readingImportFromPartsBundle(json);
    return readingImportFileSchema.parse(converted);
  }

  return readingImportFileSchema.parse(json);
}
