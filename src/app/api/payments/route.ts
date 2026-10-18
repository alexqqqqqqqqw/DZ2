import { requireUser } from "@/server/guard";
import { payForOrder } from "@/server/payments";
import { handle, readJson } from "@/server/route";

export async function POST(request: Request) {
  return handle(request, async () => {
    const user = await requireUser();
    const body = (await readJson(request)) as { orderId?: unknown; card?: unknown };
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    const order = await payForOrder(user.id, orderId, body.card);
    return Response.json({ order });
  });
}
