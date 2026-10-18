import { requireUser } from "@/server/guard";
import { getOrder } from "@/server/orders";
import { handle } from "@/server/route";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const order = await getOrder(user.id, id);
    return Response.json({ order });
  });
}
