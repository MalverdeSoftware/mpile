import { SessionError } from "@malverdesoftware/session-client";

// Plain-language messages for the researcher; anything unexpected keeps the relay's or client's own message.
export function describe(error: unknown, relayUrl?: string): string {
  const code = error instanceof SessionError ? error.code : "";
  if (code === "NETWORK") return `Can't reach the relay${relayUrl ? ` at ${relayUrl}` : ""}. Check the connection and try again.`;
  if (code === "FORBIDDEN") return "The relay did not accept this key. Check the creation key, or use the latest saved copy of the key file.";
  if (code === "NOT_FOUND") return "This session is not on the relay. It was deleted, or it was never published.";
  if (code === "SESSION_EXPIRED") return "This session has expired, and the relay has deleted its data.";
  if (code === "SESSION_CLOSED") return "This session is closed, so participants can't be added.";
  return (error as Error).message || "Something went wrong. Please try again.";
}
