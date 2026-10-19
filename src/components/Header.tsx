import Image from "next/image";
import { APP_VERSION_LABEL } from "@/lib/appVersion";
import { DataMenu } from "./DataMenu";
import { ListIcon } from "./Icons";

interface HeaderProps {
  onOpenList: () => void;
  /** Saves all data to a backup file. */
  onExport: () => Promise<void>;
  /** Reads a chosen backup file, ahead of confirming its import. */
  onImportFile: (file: File) => Promise<void>;
  /** Version label shown next to the brand; defaults to the running build's version. */
  versionLabel?: string;
}

/**
 * Top bar with the KouKou brand, the app version, the backup menu and the button that opens the full
 * subscription list.
 *
 * @param props.onOpenList - Opens the subscription list dialog.
 * @param props.onExport - Saves all data to a backup file.
 * @param props.onImportFile - Reads a chosen backup file.
 * @param props.versionLabel - Overrides the displayed version (used by tests).
 */
export function Header({ onOpenList, onExport, onImportFile, versionLabel = APP_VERSION_LABEL }: HeaderProps) {
  return (
    <header className="glass sticky top-3 z-20 flex items-center justify-between gap-3 rounded-full py-2 pr-2 pl-3">
      <div className="flex items-center gap-2.5">
        <Image src="/logo192.png" alt="" width={40} height={40} priority className="cycle-turn" />
        {/* One baseline row so the subtitle and the version badge sit on the same text line. */}
        <div className="flex items-baseline gap-2">
          <h1 className="flex items-baseline gap-2">
            <span className="font-num text-2xl font-semibold tracking-tight text-leaf-800">KouKou</span>
            <span className="hidden text-sm text-ink-soft sm:inline">扣扣帳本</span>
          </h1>
          <span
            className="rounded-full bg-leaf-100/80 px-2 py-0.5 font-num text-xs text-leaf-800"
            aria-label={`版本 ${versionLabel}`}
          >
            {versionLabel}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <DataMenu onExport={onExport} onImportFile={onImportFile} />
        <button type="button" className="btn btn-primary" onClick={onOpenList}>
          <ListIcon />
          所有扣款
        </button>
      </div>
    </header>
  );
}
