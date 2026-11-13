"use client";
import { useMemo, useState } from "react";
import helpIcon from "@jetbrains/icons/help";
import { SessionError, type ParticipantSession } from "@malverdesoftware/session-client";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import ButtonGroup from "@jetbrains/ring-ui-built/components/button-group/button-group";
import Dialog from "@jetbrains/ring-ui-built/components/dialog/dialog";
import { ControlsHeight } from "@jetbrains/ring-ui-built/components/global/controls-height";
import { H1 } from "@jetbrains/ring-ui-built/components/heading/heading";
import Input, { Size } from "@jetbrains/ring-ui-built/components/input/input";
import { Content, Header } from "@jetbrains/ring-ui-built/components/island/island";
import ProgressBar from "@jetbrains/ring-ui-built/components/progress-bar/progress-bar";
import Text from "@jetbrains/ring-ui-built/components/text/text";
import { ConfirmDialog, ErrorMessage } from "@malverdesoftware/ui/controls";
import { checkResponse, generationOf, orderCards, type SortDefinition } from "@/lib/session";
import type { ResponseBody } from "@/lib/model";
import OwnCards from "./own-cards";
import SortBoard, { count, type BoardView } from "./sort-board";
import { SYNC_TEXT, useAutosave } from "./use-autosave";

function submitError(e: unknown) {
  if (e instanceof SessionError && e.code === "SESSION_CLOSED")
    return "The study team has closed this activity, so it can't be submitted.";
  if (e instanceof SessionError && e.code === "TOO_LARGE") return "This sort is too large to send. Shorten some notes or pile explanations.";
  return (e as Error).message || "Something went wrong. Please try again.";
}

export default function SortWorkspace({ session, definition, initial, seed, onSubmitted, onPending }: {
  session: ParticipantSession;
  definition: SortDefinition;
  initial: ResponseBody;
  seed: string;
  onSubmitted: (copy: ResponseBody | null) => void;
  onPending: () => void;
}) {
  const [body, setBody] = useState(initial);
  const [help, setHelp] = useState(false);
  const [view, setView] = useState<BoardView>("unsorted");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [closed, setClosed] = useState(session.isClosed);
  const { state, saveNow } = useAutosave(session, body, !busy && !closed);
  const editable = !busy && !closed && state !== "closed" && state !== "conflict";
  const generation = generationOf(definition);
  const shared = useMemo(() => orderCards(definition.cards, definition.randomize, seed), [definition, seed]);
  // The participant's own cards come after the shared ones, in the order they were added.
  const cards = useMemo(() => [...shared, ...body.generated], [shared, body.generated]);
  const assigned = cards.filter((c) => body.assignments[c.id]).length;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (body.piles.some((p) => !p.name.trim())) throw new Error("Give every pile a name before submitting.");
      checkResponse(definition, body);
      await session.submit(body);
      onSubmitted(body);
    } catch (e) {
      if (e instanceof SessionError && e.code === "NETWORK") onPending();
      else if (e instanceof SessionError && e.code === "ALREADY_SUBMITTED") onSubmitted(null);
      else {
        if (e instanceof SessionError && e.code === "SESSION_CLOSED") setClosed(true);
        setError(submitError(e));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="workspace">
      <header className="workspace__header">
        <div className="workspace__heading">
          <H1 className="workspace__title">{definition.title}</H1>
          <Button height={ControlsHeight.L} className="touch-button" icon={helpIcon} onClick={() => setHelp(true)}>
            Help me
          </Button>
        </div>
        <div className="workspace__meta">
          <Text info className="workspace__count">
            {assigned} of {count(cards.length, "card")} placed · {count(body.piles.length, "pile")}
          </Text>
          <div className="workspace__status">
            <span role="status" aria-live="polite">
              <Text info>{closed ? SYNC_TEXT.closed : SYNC_TEXT[state]}</Text>
            </span>
            {state === "conflict" ? (
              <Button inline onClick={() => location.reload()}>
                Reload
              </Button>
            ) : (
              <Button inline disabled={!editable} onClick={() => void saveNow()}>
                Save now
              </Button>
            )}
          </div>
        </div>
        <ProgressBar
          staticColor
          className="workspace__progress"
          value={cards.length ? assigned / cards.length : 0}
          label="Cards placed"
        />
        {/* Phones only: Unsorted and Piles swap in place, so nobody scrolls past every card to reach a pile. */}
        <div className="workspace__views">
          <ButtonGroup aria-label="Show">
            <Button
              height={ControlsHeight.L}
              className="touch-button"
              active={view === "unsorted"}
              aria-pressed={view === "unsorted"}
              onClick={() => setView("unsorted")}
            >
              Unsorted {cards.length - assigned}
            </Button>
            <Button
              height={ControlsHeight.L}
              className="touch-button"
              active={view === "piles"}
              aria-pressed={view === "piles"}
              onClick={() => setView("piles")}
            >
              Piles {body.piles.length}
            </Button>
          </ButtonGroup>
        </div>
      </header>
      <div className="workspace__body">
        <p className="prewrap">
          <Text>{definition.instructions}</Text>
        </p>
        <ErrorMessage error={confirm ? "" : error} />
        {generation && (
          <OwnCards generation={generation} shared={shared} body={body} disabled={!editable} onChange={setBody} />
        )}
        <SortBoard cards={cards} body={body} disabled={!editable} view={view} onChange={setBody} />
        <section className="panel workspace__finish">
          <Input
            multiline
            className="touch-input"
            size={Size.FULL}
            label="Anything you'd like to explain? Optional"
            rows={3}
            maxLength={4000}
            disabled={!editable}
            value={body.notes}
            onChange={(e) => setBody((b) => ({ ...b, notes: e.target.value }))}
          />
          <div className="workspace__submit">
            <Text info>Review your piles before submitting. Submission is final.</Text>
            <Button
              primary
              height={ControlsHeight.L}
              className="touch-button"
              disabled={!editable}
              onClick={() => setConfirm(true)}
            >
              Review and submit
            </Button>
          </div>
        </section>
      </div>
      <Dialog
        show={help}
        label="A little guidance"
        contentClassName="ui-dialog"
        trapFocus
        autoFocusFirst
        showCloseButton
        closeButtonInside
        onCloseAttempt={() => setHelp(false)}
      >
        <Header>A little guidance</Header>
        <Content>
          <p>
            <Text info>Use your own understanding of the cards.</Text>
          </p>
          <p className="prewrap">
            <Text>{definition.help}</Text>
          </p>
          <p>
            <Text info>Other participants can&apos;t see your sort, and you can&apos;t see theirs.</Text>
          </p>
        </Content>
      </Dialog>
      <ConfirmDialog
        touch
        show={confirm}
        title="Submit your sort?"
        confirmLabel={busy ? "Submitting…" : "Submit my sort"}
        cancelLabel="Keep sorting"
        confirmDisabled={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void submit()}
      >
        <p>
          <Text info>
            {count(assigned, "card")} in {count(body.piles.length, "pile")}. {count(cards.length - assigned, "card")} will
            stay unsorted.
          </Text>
        </p>
        <p>
          <Text>You won&apos;t be able to change it after submitting.</Text>
        </p>
        <ErrorMessage error={error} />
      </ConfirmDialog>
    </main>
  );
}
