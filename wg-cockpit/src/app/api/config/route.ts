import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET() { return NextResponse.json({ adminUrl: process.env.ADMIN_COCKPIT_URL || (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "") }); }
