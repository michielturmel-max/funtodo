import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";

const run = promisify(execFile);

async function availableDevices(): Promise<string[]> {
  try {
    const { stdout } = await run("kdeconnect-cli", ["-a", "--id-only"], { timeout: 5000 });
    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const devices = await availableDevices();
  const preferred = process.env.KDECONNECT_DEVICE_ID;
  const deviceId = preferred && devices.includes(preferred) ? preferred : devices[0];

  if (!deviceId) {
    return NextResponse.json({ ok: false, reason: "offline" });
  }

  try {
    await run("kdeconnect-cli", ["-d", deviceId, "--ring"], { timeout: 8000 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, reason: "unreachable" });
  }
}
