import Image from "next/image";
import { PlusIcon } from "./Icons";

/**
 * Shown when no subscriptions exist yet; invites the first entry.
 *
 * @param props.onAdd - Opens the add-subscription form.
 */
export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="glass stitched mx-auto flex max-w-md flex-col items-center gap-4 rounded-[1.5rem] px-8 py-12 text-center">
      <Image src="/logo192.png" alt="" width={88} height={88} />
      <h2 className="text-xl">還沒有任何定期扣款</h2>
      <p className="text-ink-soft">把每個月會自動扣的帳單記下來，什麼時候扣、從哪張卡扣，一眼就看得到。</p>
      <button type="button" className="btn btn-primary" onClick={onAdd}>
        <PlusIcon />
        新增第一筆扣款
      </button>
    </div>
  );
}
