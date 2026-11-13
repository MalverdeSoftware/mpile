"use client";
import { Children, useId, useState, type ReactNode } from "react";
import trashIcon from "@jetbrains/icons/trash";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import Icon from "@jetbrains/ring-ui-built/components/icon/icon";
import Input, { Size } from "@jetbrains/ring-ui-built/components/input/input";
import Text from "@jetbrains/ring-ui-built/components/text/text";
import { ConfirmDialog } from "@malverdesoftware/ui/controls";
import type { ResponseBody } from "@/lib/model";
import type { Update } from "./sort-board";

type Pile = ResponseBody["piles"][number];

export default function PileZone({ pile, index, disabled, onChange, onDrop, children }: {
  pile: Pile;
  index: number;
  disabled: boolean;
  onChange: Update;
  onDrop: (e: React.DragEvent) => void;
  children: ReactNode;
}) {
  const [explaining, setExplaining] = useState(Boolean(pile.description));
  const [confirming, setConfirming] = useState(false);
  const explanationId = useId();
  const cardCount = Children.count(children);
  const edit = (change: Partial<Pile>) =>
    onChange((b) => ({ ...b, piles: b.piles.map((p) => (p.id === pile.id ? { ...p, ...change } : p)) }));
  const remove = () =>
    onChange((b) => ({
      ...b,
      piles: b.piles.filter((p) => p.id !== pile.id),
      assignments: Object.fromEntries(
        Object.entries(b.assignments).map(([card, p]) => [card, p === pile.id ? null : p]),
      ),
    }));
  return (
    <section className="pile-zone" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <Input
        className="touch-input"
        inputClassName="pile-name"
        size={Size.FULL}
        aria-label={`Pile ${index + 1} name`}
        maxLength={120}
        value={pile.name}
        disabled={disabled}
        onChange={(e) => edit({ name: e.target.value })}
      />
      <Button
        inline
        className="pile-zone__toggle"
        aria-expanded={explaining}
        aria-controls={explanationId}
        onClick={() => setExplaining((open) => !open)}
      >
        {explaining ? "Hide explanation" : "Explain this pile (optional)"}
      </Button>
      <div id={explanationId} hidden={!explaining}>
        <Input
          multiline
          className="touch-input"
          size={Size.FULL}
          aria-label={`Explanation for ${pile.name}`}
          rows={2}
          maxLength={1000}
          disabled={disabled}
          value={pile.description}
          onChange={(e) => edit({ description: e.target.value })}
        />
      </div>
      <div className="card-stack">{children}</div>
      {cardCount === 0 && (
        <div className="drop-hint">
          <Text info>Move cards here</Text>
        </div>
      )}
      {/* An empty pile with no explanation has nothing to lose, so it goes straight away. */}
      <Button
        inline
        danger
        className="pile-zone__remove"
        disabled={disabled}
        onClick={() => (cardCount === 0 && !pile.description ? remove() : setConfirming(true))}
      >
        <Icon glyph={trashIcon} /> Remove pile · return cards to unsorted
      </Button>
      <ConfirmDialog
        touch
        danger
        show={confirming}
        title={`Remove ${pile.name || "this pile"}?`}
        confirmLabel="Remove pile"
        cancelLabel="Keep pile"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          remove();
        }}
      >
        <p>
          {cardCount > 0 && `${cardCount === 1 ? "Its 1 card goes" : `Its ${cardCount} cards go`} back to Unsorted. `}
          The pile&apos;s name{pile.description ? " and explanation" : ""} can&apos;t be brought back.
        </p>
      </ConfirmDialog>
    </section>
  );
}
