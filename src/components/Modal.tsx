"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "./Icons";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Controls shown in the header beside the close button, e.g. a primary action. */
  actions?: ReactNode;
  /** Max width utility for the panel. */
  widthClass?: string;
}

/**
 * Glass dialog built on the native <dialog>, which provides focus trapping,
 * Esc-to-close and inert background for free. Mount it to open; unmount to close.
 * The header (title, actions and close button) stays put while only the body below it
 * scrolls: the browser's default `max-height` and `overflow: auto` on <dialog> are lifted
 * so a tall form does not get a second scrollbar.
 *
 * @param props.title - Heading, also the dialog's accessible name.
 * @param props.onClose - Called on the close button, Esc or a backdrop click.
 * @param props.actions - Extra header controls placed before the close button.
 * @param props.widthClass - Max width utility for the panel.
 */
export function Modal({ title, onClose, children, actions, widthClass = "max-w-lg" }: ModalProps) {
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
      <div className="dialog-panel glass flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[1.75rem] bg-white/80">
        <div className="flex shrink-0 items-center justify-between gap-4 px-6 pt-6 pb-5 sm:px-7 sm:pt-7">
          <h2 id={titleId} className="text-xl">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {actions}
            <button type="button" className="icon-btn -mr-2" onClick={onClose} aria-label="關閉">
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className="dialog-body min-h-0 overflow-y-auto px-6 pb-6 sm:px-7 sm:pb-7">{children}</div>
      </div>
    </dialog>
  );
}
