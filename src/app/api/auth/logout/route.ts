import { log } from "@/server/logger";
import { handle } from "@/server/route";
import { clearSessionCookie, readSession } from "@/server/session";

export async function POST(request: Request) {
  return handle(request, async () => {
    const session = await readSession();
    await clearSessionCookie();
    await log("info", "logout", {}, session?.id ?? null);
    return Response.json({ ok: true });
  });
}
