/** Words processed per import chunk (progress updates in admin UI). */
export const VOCABULARY_IMPORT_CHUNK_SIZE = 5;

export const VOCABULARY_UPLOAD_ACCEPT =
  ".pdf,.docx,.txt,.json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/json";

export const VOCABULARY_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/json",
]);

export const VOCABULARY_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export const VOCABULARY_IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export const VOCABULARY_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
