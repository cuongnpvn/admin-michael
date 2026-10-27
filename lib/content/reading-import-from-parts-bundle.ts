import type { ReadingImportFile } from "@/lib/content/reading-import-schema";
import { readingImportFileFromFullTest } from "@/lib/content/reading-import-from-full-test";
import {
  listeningPart1DataSchema,
  listeningPart2DataSchema,
  listeningPart3DataSchema,
  listeningPart4DataSchema,
  readingPart5DataSchema,
  readingPart6DataSchema,
  readingPart7DataSchema,
  type TestImportFile,
} from "@/lib/content/schemas";

/** Legacy export shape: `{ meta, part5, part6, part7 }` at top level. */
export function isReadingPartsBundleShape(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;
  const record = json as Record<string, unknown>;
  if (isFullTestLike(record)) return false;

  const meta = record.meta;
  if (!meta || typeof meta !== "object") return false;
  const metaRecord = meta as Record<string, unknown>;

  return (
    typeof metaRecord.bookId === "string" &&
    typeof metaRecord.testId === "string" &&
    record.part5 != null &&
    record.part6 != null &&
    record.part7 != null
  );
}

function isFullTestLike(record: Record<string, unknown>): boolean {
  return "listening" in record && "reading" in record;
}

export function readingImportFromPartsBundle(json: unknown): ReadingImportFile {
  const record = json as Record<string, unknown>;
  const meta = record.meta as {
    bookId: string;
    testId: string;
    title: string;
  };

  const part5 = readingPart5DataSchema.parse(record.part5);
  const part6 = readingPart6DataSchema.parse(record.part6);
  const part7 = readingPart7DataSchema.parse(record.part7);

  const emptyListening = {
    part1: listeningPart1DataSchema.parse({ part: 1, title: "Photographs", items: [] }),
    part2: listeningPart2DataSchema.parse({
      part: 2,
      title: "Question-Response",
      items: [],
    }),
    part3: listeningPart3DataSchema.parse({
      part: 3,
      title: "Conversations",
      groups: [],
    }),
    part4: listeningPart4DataSchema.parse({ part: 4, title: "Talks", groups: [] }),
  };

  const part5Count = part5.items.length;
  const part6Count = part6.passageSets.reduce(
    (sum, set) => sum + set.questions.length,
    0,
  );
  const part7Count = part7.passageSets.reduce(
    (sum, set) => sum + set.questions.length,
    0,
  );

  const fullTest: TestImportFile = {
    meta: {
      bookId: meta.bookId,
      testId: meta.testId,
      title: meta.title,
      parts: [
        { part: 1, title: "Photographs", questionCount: 0 },
        { part: 2, title: "Question-Response", questionCount: 0 },
        { part: 3, title: "Conversations", questionCount: 0 },
        { part: 4, title: "Talks", questionCount: 0 },
        { part: 5, title: part5.title, questionCount: part5Count },
        { part: 6, title: part6.title, questionCount: part6Count },
        { part: 7, title: part7.title, questionCount: part7Count },
      ],
    },
    listening: emptyListening,
    reading: { part5, part6, part7 },
  };

  return readingImportFileFromFullTest(fullTest);
}
