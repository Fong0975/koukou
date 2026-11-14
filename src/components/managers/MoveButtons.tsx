import { ChevronDownIcon, ChevronUpIcon } from "../ui/Icons";

interface MoveButtonsProps {
  /** Name of the item, used in the buttons' accessible labels. */
  name: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/** The move up and move down icon buttons of a manager row; each is disabled at its end of the list. */
export function MoveButtons({ name, canMoveUp, canMoveDown, onMoveUp, onMoveDown }: MoveButtonsProps) {
  return (
    <>
      <button
        type="button"
        className="icon-btn icon-btn-sm"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        aria-label={`上移「${name}」`}
      >
        <ChevronUpIcon />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn-sm"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        aria-label={`下移「${name}」`}
      >
        <ChevronDownIcon />
      </button>
    </>
  );
}
