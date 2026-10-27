export function formatFinishedTime(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "—";

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes === 0) {
    return `${remainder}s`;
  }

  return `${minutes}p ${remainder}s`;
}
