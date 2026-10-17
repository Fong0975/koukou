"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "./Icons";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Max width utility for the panel. */
  widthClass?: string;
}

/**
 * Glass dialog built on the native <dialog>, which provides focus trapping,
 * Esc-to-close and inert background for free. Mount it to open; unmount to close.
 * Only the panel scrolls: the browser's default `max-height` and `overflow: auto` on
 * <dialog> are lifted so a tall form does not get a second scrollbar.
 */
export function Modal({ title, onClose, children, widthClass = "max-w-lg" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={`m-auto max-h-none w-[calc(100%-2rem)] ${widthClass} overflow-visible bg-transparent p-0 text-ink`}
    >
      <div className="dialog-panel glass max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[1.75rem] bg-white/80 p-6 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-xl">
            {title}
          </h2>
          <button type="button" className="icon-btn -mr-2" onClick={onClose} aria-label="關閉">
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
