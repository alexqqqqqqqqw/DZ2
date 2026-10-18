import { requireUser } from "@/server/guard";
import { createOrder, listOrders } from "@/server/orders";
import { handle, readJson } from "@/server/route";

export async function GET(request: Request) {
  return handle(request, async () => {
    const user = await requireUser();
    const orders = await listOrders(user.id);
    return Response.json({ orders });
  });
}

export async function POST(request: Request) {
  return handle(request, async () => {
    const user = await requireUser();
    const order = await createOrder(user.id, await readJson(request));
    return Response.json({ order }, { status: 201 });
  });
}
