import "server-only";

import bcrypt from "bcryptjs";

import { parseLoginInput, parseRegisterInput } from "@/lib/domain";
import type { PublicUser } from "@/lib/types";
import { getPool, withUser } from "@/server/db";
import { AppError } from "@/server/errors";
import { log } from "@/server/logger";

const DUMMY_HASH = "$2b$04$hlRO2e28N09mwIrkqMn24uhqqmUypkLwbryu5oCskLujqwhzV2sTK";

type UserRow = { id: string; email: string; name: string; phone: string };

function mapUser(row: UserRow): PublicUser {
  return { id: row.id, email: row.email, name: row.name, phone: row.phone };
}

export async function registerAccount(raw: unknown): Promise<PublicUser> {
  const parsed = parseRegisterInput(raw);
  if (!parsed.ok) {
    throw new AppError(400, "validation_error", "Проверьте поля регистрации.", parsed.fields);
  }
  const passwordHash = await bcrypt.hash(parsed.value.password, 10);
  try {
    const result = await getPool().query<UserRow>(
      `SELECT id, email, name, phone
       FROM app_register_user($1, $2, $3, $4)`,
      [parsed.value.email, passwordHash, parsed.value.name, parsed.value.phone],
    );
    const user = result.rows[0];
    if (!user) {
      throw new AppError(500, "internal_error", "Не удалось создать аккаунт.");
    }
    await log("info", "user_registered", { email: user.email }, user.id);
    return mapUser(user);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const pg = error as { code?: string };
    if (pg.code === "23505") {
      throw new AppError(409, "email_taken", "Аккаунт с этой почтой уже есть.", {
        email: "Эта почта уже зарегистрирована. Войдите.",
      });
    }
    throw error;
  }
}

export async function authenticate(raw: unknown): Promise<PublicUser> {
  const parsed = parseLoginInput(raw);
  if (!parsed.ok) {
    throw new AppError(400, "validation_error", "Проверьте почту и пароль.", parsed.fields);
  }
  const result = await getPool().query<{
    id: string;
    email: string;
    password_hash: string;
    name: string;
    phone: string;
  }>("SELECT id, email, password_hash, name, phone FROM app_find_user_by_email($1)", [
    parsed.value.email,
  ]);
  const row = result.rows[0];
  const hash = row?.password_hash ?? DUMMY_HASH;
  const matches = await bcrypt.compare(parsed.value.password, hash);
  if (!row || !matches) {
    await log("warning", "login_failed", { email: parsed.value.email });
    throw new AppError(401, "invalid_credentials", "Неверная почта или пароль.");
  }
  await log("info", "login_succeeded", { email: row.email }, row.id);
  return { id: row.id, email: row.email, name: row.name, phone: row.phone };
}

export async function getProfile(userId: string): Promise<PublicUser> {
  return withUser(userId, async (client) => {
    const result = await client.query<UserRow>(
      "SELECT id, email, name, phone FROM users WHERE id = $1",
      [userId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new AppError(401, "unauthorized", "Сессия недействительна. Войдите снова.");
    }
    return mapUser(row);
  });
}
