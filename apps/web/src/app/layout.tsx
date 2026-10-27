import type { Metadata } from "next";
import { AppProvider } from "../lib/context";
import "./globals.css";
import "./components.css";
import "./responsive.css";
import "./reels.css";
export const metadata: Metadata = {
  title: "ProductScroll — The future, in progress.",
  description:
    "Discover what people are building. Explore startups, product demos, and honest updates from the people behind them.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
