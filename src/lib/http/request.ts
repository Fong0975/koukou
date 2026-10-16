import { NotFoundError, ValidationError } from "@/lib/errors";
import { MAX_INT_ID } from "@/lib/validation/common";

/**
 * Reads the request body as JSON.
 *
 * @param request - Incoming request.
 * @throws ValidationError when the body is not valid JSON.
 */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("請求內容不是有效的 JSON");
  }
}

/**
 * Parses a dynamic route `[id]` segment.
 *
 * @param raw - The raw segment value.
 * @returns The positive integer id.
 * @throws NotFoundError when the segment is not a positive integer.
 */
export function parseId(raw: string): number {
  const id = Number(raw);
  if (!/^[1-9]\d*$/.test(raw) || id > MAX_INT_ID) throw new NotFoundError(`找不到資源 #${raw}`);
  return id;
}
