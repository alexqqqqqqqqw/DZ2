import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function allowedOrigins(): Set<string> {
  return new Set(
    [process.env.APP_ORIGIN, "http://127.0.0.1:38471", "http://localhost:38471"].filter(
      (origin): origin is string => Boolean(origin),
    ),
  );
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = new Headers();
  if (origin && allowedOrigins().has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
