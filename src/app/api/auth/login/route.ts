import { authenticate } from "@/server/accounts";
import { handle, readJson } from "@/server/route";
import { setSessionCookie, signSession } from "@/server/session";

export async function POST(request: Request) {
  return handle(request, async () => {
    const user = await authenticate(await readJson(request));
    await setSessionCookie(await signSession(user));
    return Response.json({ user });
  });
}
