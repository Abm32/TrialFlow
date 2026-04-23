import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/components/providers";

import "./globals.css";
import "@initia/interwovenkit-react/styles.css";

export const metadata: Metadata = {
  title: "TrialFlow MVP",
  description: "Simulation-as-a-Service platform MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
