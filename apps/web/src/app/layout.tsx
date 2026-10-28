import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { AppProvider } from "../lib/context";
import "./globals.css";
import "./components.css";
import "./responsive.css";
import "./reels.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "ProductScroll — The future, in progress.",
  description:
    "Discover what people are building. Explore startups, product demos, and honest updates from the people behind them.",
  alternates: {
    canonical: "https://prod.ayushkumarsingh.in/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <head>
        <link
          rel="ai-catalog"
          href="/.well-known/ai-catalog.json"
          type="application/json"
        />
        <link
          rel="agent-card"
          href="/.well-known/agent-card.json"
          type="application/json"
        />
        <link
          rel="api-catalog"
          href="/.well-known/api-catalog"
          type="application/linkset+json"
        />
        <link rel="author-doc" href="/auth.md" type="text/markdown" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Decloak Security Hardening: Enforce origin checks for postMessage listeners
              (function() {
                if (typeof window === "undefined") return;
                var origAddEventListener = window.addEventListener;
                window.addEventListener = function(type, listener, options) {
                  if (type === "message" && typeof listener === "function") {
                    var safeListener = function(event) {
                      var origin = event.origin || (event.originalEvent && event.originalEvent.origin);
                      var trusted = [window.location.origin, "https://prod.ayushkumarsingh.in", "https://prodscroll.vercel.app"];
                      if (!origin || trusted.indexOf(origin) === -1) {
                        return;
                      }
                      return listener.apply(this, arguments);
                    };
                    return origAddEventListener.call(window, type, safeListener, options);
                  }
                  return origAddEventListener.apply(window, arguments);
                };
                
                // WebMCP imperative tool discovery
                try {
                  var mc = document.modelContext || navigator.modelContext;
                  if (mc && typeof mc.registerTool === "function") {
                    mc.registerTool({
                      name: "searchStartups",
                      description: "Search startups, products, and builders on ProductScroll",
                      inputSchema: {
                        type: "object",
                        properties: { query: { type: "string" } },
                        required: ["query"]
                      },
                      execute: function(args) {
                        return fetch("https://productscroll-api.onrender.com/api/search?q=" + encodeURIComponent(args.query))
                          .then(function(r) { return r.json(); });
                      }
                    });
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
