import { Frame as SharedFrame } from "@malverdesoftware/ui";
import type { ReactNode } from "react";

export function Frame({ children }: { children: ReactNode }) {
  return <SharedFrame appName="mPile">{children}</SharedFrame>;
}
