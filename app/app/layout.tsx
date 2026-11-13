import type { Metadata } from "next";
import "@fontsource-variable/mona-sans/wght.css";
import "@jetbrains/ring-ui-built/components/style.css";
import "@malverdesoftware/ui/base.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "mPile",
  description:
    "Card generation and pile sorting for research and community activities.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
