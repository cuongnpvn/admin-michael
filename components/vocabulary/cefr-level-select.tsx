"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VOCABULARY_CEFR_LEVELS,
  type VocabularyCefrLevel,
} from "@/lib/vocabulary/cefr-level";

const NONE_VALUE = "none";

interface CefrLevelSelectProps {
  id?: string;
  value: VocabularyCefrLevel | "";
  onChange: (value: VocabularyCefrLevel | "") => void;
  disabled?: boolean;
  noneLabel: string;
}

export function CefrLevelSelect({
  id,
  value,
  onChange,
  disabled,
  noneLabel,
}: CefrLevelSelectProps) {
  return (
    <Select
      value={value || NONE_VALUE}
      onValueChange={(next) =>
        onChange(next === NONE_VALUE ? "" : (next as VocabularyCefrLevel))
      }
      disabled={disabled}
    >
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>{noneLabel}</SelectItem>
        {VOCABULARY_CEFR_LEVELS.map((level) => (
          <SelectItem key={level} value={level}>
            {level}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
