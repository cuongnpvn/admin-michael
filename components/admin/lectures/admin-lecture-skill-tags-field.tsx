"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy/vi";
import {
  courseSkillsInGroup,
  type CourseSkillGroup,
} from "@/lib/lectures/course-skills";
import { normalizeLectureTags } from "@/lib/lectures/tags";

function toggleTag(selected: string[], value: string): string[] {
  if (selected.includes(value)) {
    return selected.filter((tag) => tag !== value);
  }
  return [...selected, value];
}

function SkillChipGroup({
  title,
  group,
  selectedTags,
  onToggle,
}: {
  title: string;
  group: CourseSkillGroup;
  selectedTags: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {courseSkillsInGroup(group).map((skill) => {
          const active = selectedTags.includes(skill.value);
          return (
            <button
              key={skill.value}
              type="button"
              onClick={() => onToggle(skill.value)}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Badge
                variant={active ? "default" : "outline"}
                className="cursor-pointer font-normal"
              >
                {skill.label}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AdminLectureSkillTagsField({
  selectedTags,
  onChange,
}: {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}) {
  return (
    <div className="space-y-3">
      <Label>{copy.admin.lectures.fields.tags}</Label>
      <SkillChipGroup
        title={copy.admin.lectures.fields.skillGroupGrammar}
        group="grammar"
        selectedTags={selectedTags}
        onToggle={(value) => onChange(normalizeLectureTags(toggleTag(selectedTags, value)))}
      />
      <SkillChipGroup
        title={copy.admin.lectures.fields.skillGroupVocabulary}
        group="vocabulary"
        selectedTags={selectedTags}
        onToggle={(value) => onChange(normalizeLectureTags(toggleTag(selectedTags, value)))}
      />
      <p className="text-xs text-muted-foreground">{copy.admin.lectures.fields.tagsHint}</p>
    </div>
  );
}
