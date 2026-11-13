"use client";
import { useState } from "react";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import { ControlsHeight } from "@jetbrains/ring-ui-built/components/global/controls-height";
import { H2 } from "@jetbrains/ring-ui-built/components/heading/heading";
import Input, { Size } from "@jetbrains/ring-ui-built/components/input/input";
import Text from "@jetbrains/ring-ui-built/components/text/text";
import { ErrorMessage } from "@malverdesoftware/ui/controls";
import { sameText, type Card, type ResponseBody } from "@/lib/model";
import type { Generation } from "@/lib/session";
import type { Update } from "./sort-board";

// Where a participant adds cards of their own. A new card joins Unsorted and is sorted like any other.
export default function OwnCards({ generation, shared, body, disabled, onChange }: {
  generation: Generation;
  shared: Card[];
  body: ResponseBody;
  disabled: boolean;
  onChange: Update;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const added = body.generated.length;
  const full = added >= generation.maxNewCards;

  function add() {
    const card = text.trim();
    if (!card || full) return;
    if ([...shared, ...body.generated].some((c) => sameText(c.text, card))) {
      setError("That card is already here. Try different words, or sort the one you have.");
      return;
    }
    const id = `g-${crypto.randomUUID()}`;
    onChange((b) => ({ ...b, generated: [...b.generated, { id, text: card }] }));
    setText("");
    setError("");
  }

  return (
    <section className="panel stack own-cards" aria-label="Add your own cards">
      <div className="zone-heading">
        <H2 className="zone-title">Add your own cards</H2>
        <span className="count-badge">
          {added} of {generation.maxNewCards} added
        </span>
      </div>
      <p className="prewrap">
        <Text>{generation.prompt}</Text>
      </p>
      <div className="new-pile">
        <Input
          className="touch-input"
          size={Size.FULL}
          aria-label="New card"
          placeholder={full ? "All cards added" : "Write a card"}
          maxLength={300}
          value={text}
          disabled={disabled || full}
          onChange={(e) => {
            setText(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button
          height={ControlsHeight.L}
          className="touch-button"
          disabled={disabled || full || !text.trim()}
          onClick={add}
        >
          Add card
        </Button>
      </div>
      <ErrorMessage error={error} />
      <Text info>Your cards go to Unsorted, marked “Yours”. Only you and the study team see them.</Text>
    </section>
  );
}
