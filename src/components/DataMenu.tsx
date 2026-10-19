"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useDismiss } from "@/hooks/useDismiss";
import { DownloadIcon, MoreIcon, UploadIcon } from "./Icons";

interface DataMenuProps {
  /** Saves all data to a backup file. */
  onExport: () => Promise<void>;
  /** Reads a chosen backup file, ahead of confirming its import. */
  onImportFile: (file: File) => Promise<void>;
}

interface MenuItemProps {
  icon: ReactNode;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}

/** One action of the menu. */
function MenuItem({ icon, onClick, disabled, children }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-left whitespace-nowrap hover:bg-leaf-100/80 disabled:opacity-55"
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * "More" button opening a menu to export all data to a backup file or pick one to import. The menu
 * stays open while an action runs and shows why it failed; it closes once the action succeeds.
 *
 * @param props.onExport - Saves all data to a backup file.
 * @param props.onImportFile - Reads the chosen backup file.
 */
export function DataMenu({ onExport, onImportFile }: DataMenuProps) {
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
