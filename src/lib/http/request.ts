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

/** The context Next.js passes to a dynamic `[id]` route handler. */
export interface IdRouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Reads and parses the `[id]` segment of a dynamic route.
 *
 * @param context - The route handler's context.
 * @returns The positive integer id.
 * @throws NotFoundError when the segment is not a positive integer.
 */
export async function routeId({ params }: IdRouteContext): Promise<number> {
  return parseId((await params).id);
}
