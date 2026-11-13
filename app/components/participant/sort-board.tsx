"use client";
import { useState } from "react";
import dragIcon from "@jetbrains/icons/drag";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import Dialog from "@jetbrains/ring-ui-built/components/dialog/dialog";
import { ControlsHeight } from "@jetbrains/ring-ui-built/components/global/controls-height";
import { H2 } from "@jetbrains/ring-ui-built/components/heading/heading";
import Icon from "@jetbrains/ring-ui-built/components/icon/icon";
import Input, { Size } from "@jetbrains/ring-ui-built/components/input/input";
import { Content, Header } from "@jetbrains/ring-ui-built/components/island/island";
import Panel from "@jetbrains/ring-ui-built/components/panel/panel";
import { Directions } from "@jetbrains/ring-ui-built/components/popup/popup.consts";
import Select from "@jetbrains/ring-ui-built/components/select/select";
import Text from "@jetbrains/ring-ui-built/components/text/text";
import { MAX_PILES, type Card, type ResponseBody } from "@/lib/model";
import PileZone from "./pile-zone";

export type Update = (change: (body: ResponseBody) => ResponseBody) => void;

// "1 pile", "2 piles": participants read these counts.
export const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

export type BoardView = "unsorted" | "piles";

const UNSORTED = "unsorted";
const NEW_PILE = "new-pile";

export function SortCard({ card, body, disabled, onMove, onNewPile }: {
  card: Card;
  body: ResponseBody;
  disabled: boolean;
  onMove: (card: string, pile: string | null) => void;
  onNewPile: (card: string) => void;
}) {
  const current = body.assignments[card.id] || UNSORTED;
  const options = [
    ...(current === UNSORTED ? [] : [{ key: UNSORTED, label: "Unsorted" }]),
    ...body.piles.map((p) => ({ key: p.id, label: p.name || "Unnamed pile" })),
    ...(body.piles.length < MAX_PILES ? [{ key: NEW_PILE, label: "New pile…" }] : []),
  ];
  return (
    <article
      className="sort-card"
      draggable={!disabled}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", card.id)}
    >
      <p className="sort-card__text">
        <Text>{card.text}</Text>
      </p>
      <Select
        type={Select.Type.CUSTOM}
        popupClassName="touch-menu"
        renderOptimization={false}
        directions={[Directions.BOTTOM_LEFT, Directions.TOP_LEFT]}
        label={`Move ${card.text} to pile`}
        disabled={disabled}
        data={options}
        selected={options.find((o) => o.key === current) ?? null}
        onSelect={(option) => {
          if (!option) return;
          if (option.key === NEW_PILE) onNewPile(card.id);
          else onMove(card.id, option.key === UNSORTED ? null : String(option.key));
        }}
        customAnchor={({ wrapperProps, buttonProps, popup }) => (
          <span {...wrapperProps}>
            {/* Always "Move": the pile a card is in is already clear from where it sits. */}
            <Button {...buttonProps} dropdown height={ControlsHeight.L} className="touch-button">
              Move
            </Button>
            {popup}
          </span>
        )}
      />
      <Icon glyph={dragIcon} className="sort-card__grip pointer-only" aria-hidden="true" />
    </article>
  );
}

// Cards go in at most one pile or stay unsorted; drag and drop, or the per-card menu (touch and keyboard).
export default function SortBoard({ cards, body, disabled, view, onChange }: {
  cards: Card[];
  body: ResponseBody;
  disabled: boolean;
  view: BoardView;
  onChange: Update;
}) {
  const [newPile, setNewPile] = useState("");
  const [namingFor, setNamingFor] = useState<string | null>(null);
  const [menuPile, setMenuPile] = useState("");
  const unsorted = cards.filter((c) => !body.assignments[c.id]);
  const move = (card: string, pile: string | null) =>
    onChange((b) => ({ ...b, assignments: { ...b.assignments, [card]: pile } }));
  const drop = (e: React.DragEvent, pile: string | null) => {
    e.preventDefault();
    const card = e.dataTransfer.getData("text/plain");
    if (!disabled && cards.some((c) => c.id === card)) move(card, pile);
  };
  function createPile(rawName: string, card?: string) {
    const name = rawName.trim();
    if (!name || body.piles.length >= MAX_PILES) return;
    const id = crypto.randomUUID();
    onChange((b) => ({
      ...b,
      piles: [...b.piles, { id, name, description: "" }],
      assignments: card ? { ...b.assignments, [card]: id } : b.assignments,
    }));
  }
  function addPile() {
    createPile(newPile);
    setNewPile("");
  }
  function addPileFromMenu() {
    createPile(menuPile, namingFor ?? undefined);
    setNamingFor(null);
    setMenuPile("");
  }
  const renderCard = (card: Card) => (
    <SortCard key={card.id} card={card} body={body} disabled={disabled} onMove={move} onNewPile={setNamingFor} />
  );
  return (
    <>
      <div className="new-pile">
        <Input
          className="touch-input"
          size={Size.FULL}
          aria-label="New pile name"
          placeholder="Name a new pile"
          maxLength={120}
          value={newPile}
          disabled={disabled}
          onChange={(e) => setNewPile(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addPile();
            }
          }}
        />
        <Button
          primary
          height={ControlsHeight.L}
          className="touch-button"
          disabled={disabled || !newPile.trim() || body.piles.length >= MAX_PILES}
          onClick={addPile}
        >
          Create pile
        </Button>
      </div>
      <p>
        <Text info>
          <span className="hint-pointer pointer-only">Drag cards into a pile, or use the Move menu on each card. Menus work with touch and keyboard.</span>
          <span className="hint-touch">Use the Move menu on each card to put it in a pile.</span>
        </Text>
      </p>
      <div className="sorting-board" data-view={view}>
        <section className="unsorted-zone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => drop(e, null)}>
          <div className="zone-heading">
            <H2 className="zone-title">Unsorted</H2>
            <span className="count-badge">{unsorted.length}</span>
          </div>
          <Text info>Cards can stay here.</Text>
          <div className="card-stack">{unsorted.map(renderCard)}</div>
          {unsorted.length === 0 && <Text info>All cards are in piles.</Text>}
        </section>
        <div className="piles-grid">
          {body.piles.map((pile, i) => (
            <PileZone
              key={pile.id}
              pile={pile}
              index={i}
              disabled={disabled}
              onChange={onChange}
              onDrop={(e) => drop(e, pile.id)}
            >
              {cards.filter((c) => body.assignments[c.id] === pile.id).map(renderCard)}
            </PileZone>
          ))}
          {!body.piles.length && (
            <div className="board-empty">
              <H2 className="zone-title">Start with your first pile</H2>
              <Text info>Give it a name above, then add cards that belong together.</Text>
            </div>
          )}
        </div>
      </div>
      <Dialog
        show={namingFor !== null}
        label="New pile"
        contentClassName="ui-dialog"
        trapFocus
        showCloseButton
        closeButtonInside
        onCloseAttempt={() => setNamingFor(null)}
      >
        <Header>New pile</Header>
        <Content>
          <Input
            className="touch-input"
            size={Size.FULL}
            label="Pile name"
            maxLength={120}
            autoFocus
            value={menuPile}
            onChange={(e) => setMenuPile(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPileFromMenu();
              }
            }}
          />
        </Content>
        <Panel>
          <Button primary height={ControlsHeight.L} className="touch-button" disabled={!menuPile.trim()} onClick={addPileFromMenu}>
            Create pile
          </Button>
          <Button height={ControlsHeight.L} className="touch-button" onClick={() => setNamingFor(null)}>
            Cancel
          </Button>
        </Panel>
      </Dialog>
    </>
  );
}
