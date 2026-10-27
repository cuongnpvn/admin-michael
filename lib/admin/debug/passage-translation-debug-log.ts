const DEBUG_ENDPOINT =
  "http://127.0.0.1:7400/ingest/2782048d-6d33-46e4-887e-4e9258b89b41";
const DEBUG_SESSION_ID = "c21f8b";

export function passageTranslationDebugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
): void {
  const payload = {
    sessionId: DEBUG_SESSION_ID,
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
  };

  // #region agent log
  console.error("[passage-translation-import]", message, data);
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": DEBUG_SESSION_ID,
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
}
