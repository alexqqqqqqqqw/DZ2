import { listDiets } from "@/server/catalog";
import { handle } from "@/server/route";

export async function GET(request: Request) {
  return handle(request, async () => {
    const diets = await listDiets();
    return Response.json({ diets });
  });
}
