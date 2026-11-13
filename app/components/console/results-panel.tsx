"use client";
import downloadIcon from "@jetbrains/icons/download";
import Banner from "@jetbrains/ring-ui-built/components/banner/banner";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import { H2 } from "@jetbrains/ring-ui-built/components/heading/heading";
import { withIcon } from "@malverdesoftware/ui/controls";
import AnalysisView from "../analysis-view";
import { download } from "@/lib/client";
import { exportFiles, type Collection } from "@/lib/console";
import { generationOf } from "@/lib/session";

export default function ResultsPanel({
  title,
  collection,
  busy,
  deleted,
  onCollect,
}: {
  title: string;
  collection: Collection | null;
  busy: boolean;
  deleted: boolean;
  onCollect: () => Promise<void>;
}) {
  const files = collection ? exportFiles(title, collection) : [];
  return (
    <section className="panel stack">
      <div className="console-heading">
        <H2>Collect and export</H2>
        <Button primary disabled={busy || deleted} onClick={() => void onCollect()}>
          {collection ? "Collect again" : "Collect responses"}
        </Button>
      </div>
      <p className="secondary-text">
        Collecting opens the sealed responses here, on this computer. Exports are saved to this computer only.
      </p>
      {collection && (
        <>
          <div className="metric-grid">
            <div>
              <span>Submitted sorts</span>
              <strong>{collection.submitted.length}</strong>
            </div>
            <div>
              <span>Not submitted (drafts)</span>
              <strong>{collection.drafts.length}</strong>
            </div>
            <div>
              <span>Could not be used</span>
              <strong>{collection.problems.length}</strong>
            </div>
            {generationOf(collection.definition) && (
              <div>
                <span>Cards added by participants</span>
                <strong>{collection.submitted.reduce((n, s) => n + s.body.generated.length, 0)}</strong>
              </div>
            )}
          </div>
          {collection.problems.length > 0 && (
            <div role="alert">
              <Banner mode="error" withIcon title="These were collected but are not in the sorts or the analysis. They are kept in the archive.">
                <ul className="console-list">
                  {collection.problems.map((p, i) => (
                    <li key={i}>
                      <strong>{p.label}</strong>: {p.reason}
                    </li>
                  ))}
                </ul>
              </Banner>
            </div>
          )}
          <p className="secondary-text">Collected {new Date(collection.collectedAt).toLocaleString()}.</p>
          <div className="export-grid">
            {files.map((f) => (
              <Button key={f.name} onClick={() => download(f.name, f.text, f.type)}>
                {withIcon(downloadIcon, f.label)}
              </Button>
            ))}
          </div>
          <p className="secondary-text">
            Drafts appear only in the not-submitted file and the archive, never in the submitted sorts or the analysis.
            {generationOf(collection.definition) &&
              " Cards participants added are in the sorts files, marked “participant” under card_origin; the analysis compares your cards only."}
          </p>
          <AnalysisView cards={collection.definition.cards} responses={collection.submitted} />
        </>
      )}
    </section>
  );
}
