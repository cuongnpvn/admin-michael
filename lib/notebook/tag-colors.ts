import type { NotebookNoteTagId } from "@/lib/notebook/tags";

export type NotebookTagColor = {
  bg: string;
  text: string;
  border: string;
  pickerBg: string;
};

export const NOTEBOOK_TAG_COLORS: Record<NotebookNoteTagId, NotebookTagColor> = {
  meaning: {
    bg: "bg-sky-100",
    text: "text-sky-950",
    border: "border-sky-300/80",
    pickerBg: "hover:bg-sky-50",
  },
  example: {
    bg: "bg-amber-100",
    text: "text-amber-950",
    border: "border-amber-300/80",
    pickerBg: "hover:bg-amber-50",
  },
  collocation: {
    bg: "bg-violet-100",
    text: "text-violet-950",
    border: "border-violet-300/80",
    pickerBg: "hover:bg-violet-50",
  },
  expression: {
    bg: "bg-indigo-100",
    text: "text-indigo-950",
    border: "border-indigo-300/80",
    pickerBg: "hover:bg-indigo-50",
  },
  grammar: {
    bg: "bg-emerald-100",
    text: "text-emerald-950",
    border: "border-emerald-300/80",
    pickerBg: "hover:bg-emerald-50",
  },
  pronunciation: {
    bg: "bg-rose-100",
    text: "text-rose-950",
    border: "border-rose-300/80",
    pickerBg: "hover:bg-rose-50",
  },
  usage: {
    bg: "bg-teal-100",
    text: "text-teal-950",
    border: "border-teal-300/80",
    pickerBg: "hover:bg-teal-50",
  },
  tips: {
    bg: "bg-orange-100",
    text: "text-orange-950",
    border: "border-orange-300/80",
    pickerBg: "hover:bg-orange-50",
  },
};

export function getNotebookTagColor(tagId: NotebookNoteTagId): NotebookTagColor {
  return NOTEBOOK_TAG_COLORS[tagId];
}
