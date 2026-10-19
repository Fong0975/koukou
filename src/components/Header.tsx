import Image from "next/image";
import { APP_VERSION_LABEL } from "@/lib/appVersion";
import { DataMenu } from "./DataMenu";
import { ChartIcon, ListIcon } from "./Icons";

interface HeaderProps {
  onOpenList: () => void;
  onOpenReport: () => void;
  /** Saves all data to a backup file. */
  onExport: () => Promise<void>;
  /** Reads a chosen backup file, ahead of confirming its import. */
  onImportFile: (file: File) => Promise<void>;
  /** Version label shown next to the brand; defaults to the running build's version. */
  versionLabel?: string;
}

/**
 * Top bar with the KouKou brand, the app version, the backup menu and the buttons that open the annual report
 * (in the menu on narrow screens) and the full subscription list.
 *
 * @param props.onOpenList - Opens the subscription list dialog.
 * @param props.onOpenReport - Opens the annual report dialog.
 * @param props.onExport - Saves all data to a backup file.
 * @param props.onImportFile - Reads a chosen backup file.
 * @param props.versionLabel - Overrides the displayed version (used by tests).
 */
export function Header({
  onOpenList,
  onOpenReport,
  onExport,
  onImportFile,
  versionLabel = APP_VERSION_LABEL,
}: HeaderProps) {
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
        <DataMenu onOpenReport={onOpenReport} onExport={onExport} onImportFile={onImportFile} />
        {/* Narrow screens have no room for a third button, so the report moves into the menu there. */}
        <button type="button" className="btn btn-ghost hidden sm:inline-flex" onClick={onOpenReport}>
          <ChartIcon />
          年度報表
        </button>
        {/* Icon only on narrow screens; the label stays as the accessible name. */}
        <button
          type="button"
          className="btn btn-primary w-10 px-0 sm:w-auto sm:px-4.5"
          onClick={onOpenList}
          aria-label="所有扣款"
        >
          <ListIcon />
          <span className="hidden sm:inline">所有扣款</span>
        </button>
      </div>
    </header>
  );
}
