import Landing from "@/components/console/landing";

// The researcher console runs only on the researcher's own computer (npm run console); the deployed site shows the
// landing page. The flag is fixed at build time, so the deployed build leaves the console out entirely.
export default async function Home() {
  if (import.meta.env.VITE_MPILE_CONSOLE === "local") {
    const { default: ConsolePage } = await import("@/components/console/console-entry");
    return <ConsolePage />;
  }
  return <Landing />;
}
