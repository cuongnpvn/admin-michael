import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  ADMIN_INSTRUCTIONS,
  type AdminInstructionId,
} from "@/lib/admin/instructions/catalog";

const INSTRUCTIONS_DIR = path.join(
  process.cwd(),
  "content",
  "admin",
  "instructions",
);

export async function loadAdminInstructionContent(
  id: AdminInstructionId,
): Promise<string> {
  const entry = ADMIN_INSTRUCTIONS.find((doc) => doc.id === id);
  if (!entry) {
    if (id === "reading-part-7") {
      throw new Error(
        "reading-part-7 has no instruction file; use reading-part-7-single or reading-part-7-multi.",
      );
    }
    throw new Error(`Unknown instruction id: ${id}`);
  }

  const filePath = path.join(INSTRUCTIONS_DIR, entry.filename);
  return readFile(filePath, "utf8");
}
