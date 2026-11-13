"use client";
import { useState } from "react";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import Checkbox from "@jetbrains/ring-ui-built/components/checkbox/checkbox";
import { ControlsHeight } from "@jetbrains/ring-ui-built/components/global/controls-height";
import { H1 } from "@jetbrains/ring-ui-built/components/heading/heading";
import Input, { Size } from "@jetbrains/ring-ui-built/components/input/input";
import { ErrorMessage } from "@malverdesoftware/ui/controls";

export default function PasscodeForm({
  error,
  busy,
  onSubmit,
}: {
  error: string;
  busy: boolean;
  onSubmit: (passcode: string, sharedDevice: boolean) => void;
}) {
  const [code, setCode] = useState("");
  const [shared, setShared] = useState(false);
  return (
    <main className="page-narrow">
      <H1>Enter your passcode</H1>
      <form
        className="panel stack"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(code, shared);
        }}
      >
        <Input
          id="passcode"
          name="passcode"
          className="touch-input"
          size={Size.FULL}
          label="Six-digit passcode from the study team"
          help="Your link and passcode work together. Use the same link and passcode to continue on another phone or computer."
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          autoFocus
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        <Checkbox
          checked={shared}
          onChange={(e) => setShared(e.target.checked)}
          label="This is a shared computer. Don't remember my passcode."
        />
        <ErrorMessage error={error} />
        <div>
          <Button
            primary
            type="submit"
            height={ControlsHeight.L}
            className="touch-button"
            disabled={busy || code.length !== 6}
          >
            {busy ? "Opening…" : "Open activity"}
          </Button>
        </div>
      </form>
    </main>
  );
}
