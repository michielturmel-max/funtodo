import "server-only";

import { authenticatePluginToken, type PluginUser } from "@/server/repositories/plugin";

export async function getPluginUser(request: Request): Promise<PluginUser | null> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;
  return authenticatePluginToken(match[1].trim());
}
