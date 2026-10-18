import "server-only";

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { getPool } from "@/server/db";

type Level = "info" | "warning" | "error";

export async function log(
  level: Level,
  event: string,
  detail: Record<string, unknown> = {},
  userId?: string | null,
): Promise<void> {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    userId: userId ?? null,
    ...detail,
  };
  const line = `${JSON.stringify(entry)}\n`;
  console.log(line.trim());
  if (!process.env.VERCEL) {
    try {
      const dir = path.join(process.cwd(), "logs");
      await mkdir(dir, { recursive: true });
      await appendFile(path.join(dir, "app.log"), line, "utf8");
    } catch (error) {
      console.log(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "error",
          event: "log_write_failed",
          message: error instanceof Error ? error.message : "unknown",
        }),
      );
    }
  }
  try {
    await getPool().query(
      "INSERT INTO audit_log (level, event, user_id, detail) VALUES ($1, $2, $3, $4::jsonb)",
      [level, event, userId ?? null, JSON.stringify(detail)],
    );
  } catch {
    // Файл и stdout уже сохранили событие. Сбой таблицы не должен ронять запрос.
  }
}
