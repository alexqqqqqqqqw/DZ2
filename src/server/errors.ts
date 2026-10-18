import type { FieldErrors } from "@/lib/domain";

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: FieldErrors,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function jsonError(error: AppError): Response {
  return Response.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    },
    { status: error.status },
  );
}
