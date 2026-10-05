import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Admin Cockpit", description: "Eigenständiges Infrastruktur-Monitoring" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="de"><body>{children}</body></html>; }
