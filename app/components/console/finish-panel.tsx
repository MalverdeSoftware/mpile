"use client";
import { useState } from "react";
import lockIcon from "@jetbrains/icons/lock";
import trashIcon from "@jetbrains/icons/trash";
import Banner from "@jetbrains/ring-ui-built/components/banner/banner";
import Checkbox from "@jetbrains/ring-ui-built/components/checkbox/checkbox";
import { H2 } from "@jetbrains/ring-ui-built/components/heading/heading";
import { ConfirmButton } from "@malverdesoftware/ui/controls";

// Close, collect, then delete. Deleting removes the session from the relay; the local key file stays where it is.
export default function FinishPanel({
  isClosed,
  collectedAfterClose,
  deleted,
  busy,
  onClose,
  onDelete,
}: {
  isClosed: boolean;
  collectedAfterClose: boolean;
  deleted: boolean;
  busy: boolean;
  onClose: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [exportsSaved, setExportsSaved] = useState(false);
  if (deleted)
    return (
      <section className="panel stack" role="status">
        <H2>Session deleted</H2>
        <p>
          It was deleted from the live database. Cloudflare&apos;s recovery history keeps the sealed copy, which nobody can
          read without the key file, for up to 7 more days. Your key file and exports are still on this computer.
        </p>
      </section>
    );
  return (
    <section className="panel stack">
      <H2>Finish the session</H2>
      <ol className="console-steps">
        <li>Close it, so nobody can save or submit any more.</li>
        <li>Collect again, and save the exports.</li>
        <li>Delete it from the relay.</li>
      </ol>
      <div className="console-actions">
        {!isClosed && (
          <ConfirmButton
            icon={lockIcon}
            label="Close the session"
            disabled={busy}
            title="Close this session?"
            confirmLabel="Close the session"
            cancelLabel="Keep it open"
            onConfirm={() => void onClose()}
          >
            <p>
              Participants can no longer save or submit. Their saved work stays until you delete the session. Closing
              can&apos;t be undone.
            </p>
          </ConfirmButton>
        )}
        <ConfirmButton
          danger
          icon={trashIcon}
          label="Delete from the relay"
          disabled={busy || !isClosed}
          onOpen={() => setExportsSaved(false)}
          title="Delete this session?"
          confirmLabel="Delete the session"
          confirmDisabled={!exportsSaved}
          onConfirm={() => void onDelete()}
        >
          <div className="stack">
            <p>
              Every link stops working and all sealed responses are deleted from the relay. Only the exports you saved
              will remain.
            </p>
            {!collectedAfterClose && (
              <Banner mode="error" withIcon>You haven&apos;t collected since closing. Collect and save the exports first.</Banner>
            )}
            <Checkbox
              checked={exportsSaved}
              onChange={(e) => setExportsSaved(e.target.checked)}
              label="I saved the exports on this computer."
            />
          </div>
        </ConfirmButton>
      </div>
      {!isClosed && <p className="secondary-text">Delete becomes available after closing.</p>}
    </section>
  );
}
