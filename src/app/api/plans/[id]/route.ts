import { getPlan } from "@/server/catalog";
import { handle } from "@/server/route";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const { id } = await context.params;
    const plan = await getPlan(id);
    return Response.json({ plan });
  });
}
