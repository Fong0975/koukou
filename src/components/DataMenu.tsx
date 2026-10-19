"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useDismiss } from "@/hooks/useDismiss";
import { ChartIcon, DownloadIcon, MoreIcon, UploadIcon } from "./Icons";

interface DataMenuProps {
  /** Opens the annual report; offered here only on narrow screens, where the header has no room for its button. */
  onOpenReport: () => void;
  /** Saves all data to a backup file. */
  onExport: () => Promise<void>;
  /** Reads a chosen backup file, ahead of confirming its import. */
  onImportFile: (file: File) => Promise<void>;
}

interface MenuItemProps {
  icon: ReactNode;
  onClick: () => void;
  disabled: boolean;
  /** Extra classes, e.g. to show the item only at some widths. */
  className?: string;
  children: ReactNode;
}

/** One action of the menu. */
function MenuItem({ icon, onClick, disabled, className = "", children }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left whitespace-nowrap hover:bg-leaf-100/80 disabled:opacity-55 ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * "More" button opening a menu to export all data to a backup file or pick one to import, and on narrow
 * screens to open the annual report. The menu stays open while a backup action runs and shows why it
 * failed; it closes once the action succeeds.
 *
 * @param props.onOpenReport - Opens the annual report.
 * @param props.onExport - Saves all data to a backup file.
 * @param props.onImportFile - Reads the chosen backup file.
 */
export function DataMenu({ onOpenReport, onExport, onImportFile }: DataMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const { pending, error, run, reset } = useAsyncAction(async (action: () => Promise<void>) => {
    await action();
    close();
  });

  const toggle = () => {
    reset();
    setOpen((current) => !current);
  };

  const openReport = () => {
    close();
    onOpenReport();
  };

  const importChosenFile = (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = "";
    if (file) void run(() => onImportFile(file));
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="icon-btn"
        aria-label="資料備份"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <MoreIcon />
      </button>
      {open && (
        <div role="menu" aria-label="資料備份" className="popup right-0 flex max-w-none flex-col text-sm">
          <MenuItem icon={<ChartIcon />} onClick={openReport} disabled={pending} className="sm:hidden">
            年度報表
          </MenuItem>
          <MenuItem icon={<DownloadIcon />} onClick={() => void run(onExport)} disabled={pending}>
            匯出備份
          </MenuItem>
          <MenuItem icon={<UploadIcon />} onClick={() => fileInput.current?.click()} disabled={pending}>
            匯入備份
          </MenuItem>
          {error && (
            <p role="alert" className="field-error max-w-56 px-3">
              {error}
            </p>
          )}
        </div>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        aria-label="選擇備份檔"
        onChange={(event) => importChosenFile(event.target.files?.[0])}
      />
    </div>
  );
}
