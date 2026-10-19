import { z } from "zod";
import { BACKUP_FORMAT, BACKUP_VERSION } from "@/lib/constants/backupFormat";
import { categoryInputSchema } from "./categorySchema";
import { MAX_INT_ID, type IssueSink } from "./common";
import { paymentMethodInputSchema } from "./paymentMethodSchema";
import { checkSubscriptionDates, subscriptionFieldsSchema } from "./subscriptionSchema";

/** Smallest value of the signed 32-bit INT columns. */
const MIN_INT = -MAX_INT_ID - 1;

/**
 * The stored id of a backed-up record, kept so the records can keep referencing each other.
 *
 * @param label - Name of the record kind, used in error messages.
 */
const recordId = (label: string) => {
  const message = `${label}編號格式錯誤`;
  return z.number({ error: message }).int(message).positive(message).max(MAX_INT_ID, message);
};

const backupCategorySchema = categoryInputSchema.extend({
  id: recordId("類型"),
  sortOrder: z
    .number({ error: "類型排序格式錯誤" })
    .int("類型排序格式錯誤")
    .min(MIN_INT, "類型排序格式錯誤")
    .max(MAX_INT_ID, "類型排序格式錯誤"),
});

const backupPaymentMethodSchema = paymentMethodInputSchema.extend({ id: recordId("扣款方式") });

const backupSubscriptionSchema = subscriptionFieldsSchema
  .extend({ id: recordId("扣款項目"), createdAt: z.iso.datetime({ error: "建立時間格式錯誤" }) })
  .superRefine(checkSubscriptionDates);

/**
 * Reports each item whose key was already used by an earlier item of the same list.
 *
 * @param ctx - Where the issues are reported.
 * @param list - Name of the list in the backup, used in the issue path.
 * @param items - The list's items.
 * @param field - Field the issue points at.
 * @param keyOf - The key that must be unique.
 * @param message - Message for a duplicated item.
 */
function checkUnique<T>(
  ctx: IssueSink,
  list: string,
  items: T[],
  field: string,
  keyOf: (item: T) => string | number,
  message: (item: T) => string,
): void {
  const seen = new Set<string | number>();
  items.forEach((item, index) => {
    const key = keyOf(item);
    if (seen.has(key)) ctx.addIssue({ code: "custom", path: [list, index, field], message: message(item) });
    seen.add(key);
  });
}

interface BackupLists {
  categories: { id: number; name: string }[];
  paymentMethods: { id: number; type: string; name: string }[];
  subscriptions: { id: number; name: string; categoryId: number; paymentMethodId: number }[];
}

/**
 * Checks what the database would reject on import: ids and names must be unique, and every
 * subscription must reference a category and a payment method that are in the backup.
 *
 * @param data - The parsed backup.
 * @param ctx - Where the issues are reported.
 */
export function checkBackupIntegrity(data: BackupLists, ctx: IssueSink): void {
  const duplicateId = () => "編號重複";
  checkUnique(ctx, "categories", data.categories, "id", (c) => c.id, duplicateId);
  checkUnique(
    ctx,
    "categories",
    data.categories,
    "name",
    (c) => c.name,
    (c) => `類型「${c.name}」重複`,
  );
  checkUnique(ctx, "paymentMethods", data.paymentMethods, "id", (p) => p.id, duplicateId);
  checkUnique(
    ctx,
    "paymentMethods",
    data.paymentMethods,
    "name",
    (p) => `${p.type}|${p.name}`,
    (p) => `扣款方式「${p.name}」重複`,
  );
  checkUnique(ctx, "subscriptions", data.subscriptions, "id", (s) => s.id, duplicateId);

  const categoryIds = new Set(data.categories.map((c) => c.id));
  const paymentMethodIds = new Set(data.paymentMethods.map((p) => p.id));
  data.subscriptions.forEach((subscription, index) => {
    if (!categoryIds.has(subscription.categoryId)) {
      ctx.addIssue({
        code: "custom",
        path: ["subscriptions", index, "categoryId"],
        message: `「${subscription.name}」的類型不在備份檔中`,
      });
    }
    if (!paymentMethodIds.has(subscription.paymentMethodId)) {
      ctx.addIssue({
        code: "custom",
        path: ["subscriptions", index, "paymentMethodId"],
        message: `「${subscription.name}」的扣款方式不在備份檔中`,
      });
    }
  });
}

/** A backup file to import. Fields other than the listed ones are ignored. */
export const backupSchema = z
  .object(
    {
      format: z.literal(BACKUP_FORMAT, { error: "這不是 KouKou 的備份檔" }),
      version: z.literal(BACKUP_VERSION, { error: "不支援這個版本的備份檔" }),
      appVersion: z.string().optional(),
      exportedAt: z.string().optional(),
      categories: z.array(backupCategorySchema, { error: "類型資料格式錯誤" }),
      paymentMethods: z.array(backupPaymentMethodSchema, { error: "扣款方式資料格式錯誤" }),
      subscriptions: z.array(backupSubscriptionSchema, { error: "扣款項目資料格式錯誤" }),
    },
    { error: "這不是 KouKou 的備份檔" },
  )
  .superRefine(checkBackupIntegrity);

export type BackupData = z.output<typeof backupSchema>;
export type BackupSubscriptionData = BackupData["subscriptions"][number];
