"use client";
import dynamic from "next/dynamic";
import { Frame } from "../frame";

// Ring UI touches `document` while its modules load, so the console loads in the browser only.
const ConsolePage = dynamic(() => import("./console-page"), {
  ssr: false,
  loading: () => (
    <Frame>
      <main className="page-narrow" aria-busy="true">
        Opening the console…
      </main>
    </Frame>
  ),
});

export default ConsolePage;
