export function lectureCatalogPath(): string {
  return "/course";
}

export function lectureCollectionPath(collectionSlug: string): string {
  return `/course/${collectionSlug}`;
}

export function lecturePath(collectionSlug: string, lectureSlug: string): string {
  return `/course/${collectionSlug}/${lectureSlug}`;
}

export function lectureExercisePath(
  collectionSlug: string,
  lectureSlug: string,
  questionSortOrder?: number,
): string {
  const base = lecturePath(collectionSlug, lectureSlug);
  if (questionSortOrder == null) return `${base}#exercise`;
  return `${base}#exercise-${questionSortOrder}`;
}

export function adminLecturesPath(): string {
  return "/admin/courses";
}

export function adminLectureChatPath(): string {
  return "/admin/courses/chat";
}

export function adminLectureCollectionPath(collectionId: string): string {
  return `/admin/courses/${collectionId}`;
}

export function adminLectureEditorPath(
  collectionId: string,
  lectureId: string,
): string {
  return `/admin/courses/${collectionId}/${lectureId}`;
}
