import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  ADMIN_INSTRUCTIONS,
  type AdminInstructionDoc,
  type AdminInstructionId,
} from "@/lib/admin/instructions/catalog";

const INSTRUCTIONS_DIR = path.join(
  process.cwd(),
  "content",
  "admin",
  "instructions",
);

export async function loadAdminInstruction(
  id: AdminInstructionId,
): Promise<AdminInstructionDoc | null> {
  const entry = ADMIN_INSTRUCTIONS.find((item) => item.id === id);
  if (!entry) return null;

  const filePath = path.join(INSTRUCTIONS_DIR, entry.filename);
  const content = await readFile(filePath, "utf8");
  return {
    id: entry.id,
    title: entry.title,
    content,
  };
}

export async function loadAdminInstructions(): Promise<AdminInstructionDoc[]> {
  return Promise.all(
    ADMIN_INSTRUCTIONS.map(async (entry) => {
      const filePath = path.join(INSTRUCTIONS_DIR, entry.filename);
      const content = await readFile(filePath, "utf8");
      return {
        id: entry.id,
        title: entry.title,
        content,
      };
    }),
  );
}
