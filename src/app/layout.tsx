import type { Metadata, Viewport } from "next";
/*
 * Geist from the `geist` package, not `next/font/google`: the package ships
 * the font files, so the demo builds and runs with no internet connection.
 */
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Employment Application · Biztech",
  description:
    "A demonstration of Biztech's online employment application. Nothing entered here is submitted or stored.",
  icons: { icon: "/biztech-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#1a4321",
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
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          DEMO BUILD: the production wizard, rebranded for Biztech, with every
          outward connection removed. Steps never block, and "submitting"
          only waits a moment before showing the confirmation screen.
          Nothing an applicant types leaves the browser tab.
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
