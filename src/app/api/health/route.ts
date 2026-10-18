import { getPool } from "@/server/db";
import { handle } from "@/server/route";

export async function GET(request: Request) {
  return handle(request, async () => {
    const result = await getPool().query<{ count: number }>(
      "SELECT count(*)::int AS count FROM diet_types",
    );
    const diets = result.rows[0]?.count ?? 0;
    const ok = diets === 4;
    return Response.json(
      {
        status: ok ? "ok" : "degraded",
        db: "up",
        diets,
        time: new Date().toISOString(),
      },
      { status: ok ? 200 : 503 },
    );
  });
}
