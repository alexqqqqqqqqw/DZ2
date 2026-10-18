import "server-only";

import { connection } from "next/server";

import { AppError, jsonError } from "@/server/errors";
import { log } from "@/server/logger";

export async function handle(request: Request, fn: () => Promise<Response>): Promise<Response> {
  await connection();
  const started = Date.now();
  const path = new URL(request.url).pathname;
  try {
    const response = await fn();
    await log("info", "http_request", {
      method: request.method,
      path,
      status: response.status,
      ms: Date.now() - started,
    });
    return response;
  } catch (error) {
    if (error instanceof AppError) {
      await log(error.status >= 500 ? "error" : "warning", "http_request", {
        method: request.method,
        path,
        status: error.status,
        code: error.code,
        ms: Date.now() - started,
      });
      return jsonError(error);
    }
    await log("error", "unhandled", {
      method: request.method,
      path,
      message: error instanceof Error ? error.message : "unknown",
      ms: Date.now() - started,
    });
    return jsonError(
      new AppError(500, "internal_error", "Сервер не смог обработать запрос. Повторите через минуту."),
    );
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError(400, "validation_error", "Тело запроса должно быть JSON.", {
      form: "Некорректный JSON.",
    });
  }
}
