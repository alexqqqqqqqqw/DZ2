import { getProfile } from "@/server/accounts";
import { handle } from "@/server/route";
import { readSession } from "@/server/session";

export async function GET(request: Request) {
  return handle(request, async () => {
    const session = await readSession();
    if (!session) {
      return Response.json({ user: null });
    }
    const user = await getProfile(session.id);
    return Response.json({ user });
  });
}
