import "server-only";

import { AppError } from "@/server/errors";
import { readSession } from "@/server/session";

export async function requireUser(): Promise<{ id: string; email: string }> {
  const session = await readSession();
  if (!session) {
    throw new AppError(401, "unauthorized", "Войдите, чтобы продолжить.");
  }
  return session;
}
