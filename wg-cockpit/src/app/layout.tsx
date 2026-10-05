import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "WG Cockpit",
  description: "Das gemeinsame Cockpit für euren WG-Alltag.",
  applicationName: "WG Cockpit",
  appleWebApp: { capable: true, title: "WG Cockpit", statusBarStyle: "default" },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body><AppShell>{children}</AppShell></body></html>;
}
