import type { KeyboardEventHandler } from "react";

interface CategoryFieldsProps {
  icon: string;
  name: string;
  onIconChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onKeyDown: KeyboardEventHandler;
  /** Accessible label of the name input. */
  nameLabel: string;
  namePlaceholder?: string;
}

/** The emoji and name inputs shared by the category add and edit forms. */
export function CategoryFields({
  icon,
  name,
  onIconChange,
  onNameChange,
  onKeyDown,
  nameLabel,
  namePlaceholder,
}: CategoryFieldsProps) {
  return (
    <div className="flex gap-2">
      <input
        className="field w-16 text-center"
        placeholder="🏷️"
        aria-label="類型圖示（可留空）"
        value={icon}
        maxLength={16}
        onChange={(event) => onIconChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <input
        className="field"
        placeholder={namePlaceholder}
        aria-label={nameLabel}
        value={name}
        maxLength={50}
        autoFocus
        onChange={(event) => onNameChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
