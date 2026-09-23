import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Employment Application · Schmidbauer Lumber",
  description:
    "Apply for a position at Schmidbauer Lumber, Inc. — a lumber mill serving the North Coast, locally owned and operated since 1971.",
  icons: { icon: "/sli-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#306030",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          THESIS: A paper application rebuilt as ten short, gated steps — the
          form's job is to make omission impossible. Refuses the endless
          single-column scroll every online application defaults to.
          OWN-WORLD: Mill-green header band carrying the reversed logo and a
          segmented gold progress bar; white cards on a faintly warm ground;
          gold reserved strictly for progress and the primary action. Tap
          targets sized for work gloves.
          STORY: An applicant sees exactly where they are, can't get lost,
          can't submit something incomplete, and knows the voluntary survey is
          genuinely voluntary.
          FIRST VIEWPORT: Green band, logo left, "Employment Application" right,
          ten-segment progress bar beneath. Below the fold line: step title,
          one line of orientation, then the fields. Primary action bottom-right,
          sticky.
          FORM: User-pinned direction (branded & warm), selected from a
          three-option preview round — no concept roll.
          FINISH: unreviewed and undocumented is unfinished; this build ends
          with the finish review, the verdict, and DESIGN.md
        */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-green-deep focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to form
        </a>
        {children}
      </body>
    </html>
  );
}
