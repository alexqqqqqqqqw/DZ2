import { requireUser } from "@/server/guard";
import { markDelivered } from "@/server/orders";
import { handle } from "@/server/route";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const order = await markDelivered(user.id, id);
    return Response.json({ order });
  });
}
