/** Official ETS TOEIC Listening section sizes (full test). */
export const LISTENING_PART12_OFFICIAL_SPEC = {
  1: {
    items: 6,
    globalItemFirst: 1,
    globalItemLast: 6,
  },
  2: {
    items: 25,
    globalItemFirst: 7,
    globalItemLast: 31,
  },
} as const;

export type ListeningPart12 = keyof typeof LISTENING_PART12_OFFICIAL_SPEC;

export const LISTENING_PART_OFFICIAL_SPEC = {
  3: {
    groups: 13,
    questionsPerGroup: 3,
    questions: 39,
    globalItemFirst: 32,
    globalItemLast: 70,
    stimulusLabel: "conversations",
  },
  4: {
    groups: 10,
    questionsPerGroup: 3,
    questions: 30,
    globalItemFirst: 71,
    globalItemLast: 100,
    stimulusLabel: "talks",
  },
} as const;

export type ListeningPart34 = keyof typeof LISTENING_PART_OFFICIAL_SPEC;

/** Official TOEIC Parts 3–4 groups that include a graphic stimulus in the test booklet. */
export const LISTENING_GROUP_STIMULUS_IMAGE_GROUP_COUNT: Record<ListeningPart34, number> =
  {
    3: 3,
    4: 2,
  };

/** Global item numbers for the first question in each image group (e.g. Part 3 → 62, 65, 68). */
export function getListeningGroupStimulusImageStarts(part: ListeningPart34): number[] {
  const spec = LISTENING_PART_OFFICIAL_SPEC[part];
  const imageGroupCount = LISTENING_GROUP_STIMULUS_IMAGE_GROUP_COUNT[part];
  const firstImageGroupIndex = spec.groups - imageGroupCount;

  return Array.from({ length: imageGroupCount }, (_, index) =>
    spec.globalItemFirst +
    (firstImageGroupIndex + index) * spec.questionsPerGroup,
  );
}

export function isListeningGroupWithStimulusImage(
  part: number,
  groupStart: number,
): boolean {
  if (part !== 3 && part !== 4) return false;
  return getListeningGroupStimulusImageStarts(part).includes(groupStart);
}

export function countListeningPartItems(part: {
  part: number;
  items: unknown[];
}): number {
  return part.items.length;
}

export function listeningPart12ImportCountError(
  part: ListeningPart12,
  actualItems: number,
): string {
  const spec = LISTENING_PART12_OFFICIAL_SPEC[part];
  return (
    `Listening Part ${part} thiếu dữ liệu so với TOEIC chuẩn: cần ${spec.items} câu ` +
    `(global ${spec.globalItemFirst}–${spec.globalItemLast}), nhưng JSON chỉ có ${actualItems} câu. ` +
    `PDF đã đủ nội dung — hãy chạy lại Gemini extract (thường do output bị cắt sớm).`
  );
}

export function countListeningPartGroupsAndQuestions(part: {
  part: number;
  groups: { questions: unknown[] }[];
}): { groups: number; questions: number } {
  return {
    groups: part.groups.length,
    questions: part.groups.reduce(
      (total, group) => total + group.questions.length,
      0,
    ),
  };
}

export function listeningPartImportCountError(
  part: ListeningPart34,
  actualGroups: number,
  actualQuestions: number,
): string {
  const spec = LISTENING_PART_OFFICIAL_SPEC[part];
  return (
    `Listening Part ${part} thiếu dữ liệu so với TOEIC chuẩn: cần ${spec.groups} ${spec.stimulusLabel} × ${spec.questionsPerGroup} câu = ${spec.questions} câu ` +
    `(global ${spec.globalItemFirst}–${spec.globalItemLast}), nhưng JSON chỉ có ${actualGroups} nhóm và ${actualQuestions} câu. ` +
    `PDF đã đủ nội dung — hãy chạy lại Gemini extract (thường do output bị cắt sớm).`
  );
}
