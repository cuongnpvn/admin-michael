"use client";

import { copy } from "@/lib/copy/vi";
import { cn } from "@/lib/utils";

const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

const DOT_FILLED_COLORS = [
  "bg-red-200",
  "bg-red-300",
  "bg-red-300",
  "bg-red-400",
  "bg-red-400",
  "bg-red-500",
  "bg-red-500",
  "bg-red-600",
  "bg-red-600",
  "bg-red-700",
] as const;

const METER_HEIGHTS = [
  "h-1.5",
  "h-1.5",
  "h-2",
  "h-2",
  "h-2.5",
  "h-2.5",
  "h-3",
  "h-3",
  "h-3.5",
  "h-4",
] as const;

const METER_FILLED_COLORS = [
  "bg-primary-200",
  "bg-primary-200",
  "bg-primary-300",
  "bg-primary-300",
  "bg-primary-400",
  "bg-primary-400",
  "bg-primary-500",
  "bg-primary-500",
  "bg-primary-600",
  "bg-primary-700",
] as const;

interface DifficultyScaleBarProps {
  score: number;
  className?: string;
  variant?: "dots" | "meter";
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(10, Math.max(0, score));
}

export function DifficultyScaleBar({
  score,
  className,
  variant = "dots",
}: DifficultyScaleBarProps) {
  const clampedScore = clampScore(score);
  const filledLevels = Math.round(clampedScore);
  const isMeter = variant === "meter";

  return (
    <div
      className={cn(
        "flex",
        isMeter ? "items-end gap-0.5" : "items-center gap-1",
        className,
      )}
      role="img"
      aria-label={copy.practice.difficulty.barAriaLabel(clampedScore)}
    >
      {DIFFICULTY_LEVELS.map((level) => {
        const filled = level <= filledLevels;

        return (
          <span
            key={level}
            className={cn(
              "rounded-[2px]",
              isMeter ? cn("w-1.5", METER_HEIGHTS[level - 1]) : "h-2 w-2",
              filled
                ? isMeter
                  ? METER_FILLED_COLORS[level - 1]
                  : DOT_FILLED_COLORS[level - 1]
                : "bg-muted",
            )}
          />
        );
      })}
    </div>
  );
}
