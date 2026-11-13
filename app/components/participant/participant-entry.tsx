"use client";
import dynamic from "next/dynamic";
import { Frame } from "../frame";

// Ring UI touches `document` while its modules load, so the participant screens load in the browser only. The server
// has nothing to render here anyway: the session is in the link fragment, which it never receives.
const ParticipantPage = dynamic(() => import("./participant-page"), {
  ssr: false,
  loading: () => (
    <Frame>
      <main className="page-narrow" aria-busy="true">
        Opening activity…
      </main>
    </Frame>
  ),
});

export default ParticipantPage;
