"use client";
import okIcon from "@jetbrains/icons/ok";
import { H1, H2, H3 } from "@jetbrains/ring-ui-built/components/heading/heading";
import Icon from "@jetbrains/ring-ui-built/components/icon/icon";
import Text from "@jetbrains/ring-ui-built/components/text/text";
import type { SortDefinition } from "@/lib/session";
import type { ResponseBody } from "@/lib/model";

// Shows this device's own copy of the sort, if it has one; nothing is fetched from the server.
export default function Submitted({ definition, copy }: { definition: SortDefinition; copy: ResponseBody | null }) {
  const text = new Map(definition.cards.map((c) => [c.id, c.text]));
  const inPile = (pile: string | null) =>
    definition.cards.filter((c) => (copy?.assignments[c.id] ?? null) === pile).map((c) => c.id);
  return (
    <main className="page-narrow">
      <Text info>{definition.title}</Text>
      <H1>
        <Icon glyph={okIcon} className="submitted-icon" aria-hidden="true" /> Thank you.
      </H1>
      <p>
        <Text>Your sort was sent to the study team. You can close this page.</Text>
      </p>
      {copy ? (
        <section className="panel stack" aria-label="Your submitted sort">
          <H2>Your sort</H2>
          {copy.piles.map((pile) => (
            <div key={pile.id}>
              <H3>{pile.name || "Unnamed pile"}</H3>
              {pile.description && (
                <p className="prewrap">
                  <Text info>{pile.description}</Text>
                </p>
              )}
              <ul className="submitted-list">
                {inPile(pile.id).map((id) => (
                  <li key={id}>
                    <Text>{text.get(id)}</Text>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {inPile(null).length > 0 && (
            <div>
              <H3>Unsorted</H3>
              <ul className="submitted-list">
                {inPile(null).map((id) => (
                  <li key={id}>
                    <Text>{text.get(id)}</Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <p>
          <Text info>Your sort is shown only on the device it was sent from.</Text>
        </p>
      )}
    </main>
  );
}
