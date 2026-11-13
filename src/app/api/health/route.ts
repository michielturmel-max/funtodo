import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/server/db";

export async function GET() {
  try {
    db.run(sql`select 1`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
