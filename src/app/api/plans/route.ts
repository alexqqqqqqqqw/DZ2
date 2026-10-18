import { listPlans } from "@/server/catalog";
import { handle } from "@/server/route";

export async function GET(request: Request) {
  return handle(request, async () => {
    const diet = new URL(request.url).searchParams.get("diet") ?? undefined;
    const plans = await listPlans(diet || undefined);
    return Response.json({ plans });
  });
}
