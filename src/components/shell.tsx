"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import type { PublicUser } from "@/lib/types";
import { cn } from "@/lib/utils";

type SessionValue = {
  user: PublicUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession используется внутри Shell");
  }
  return value;
}

const links = [
  { href: "/rations", label: "Рационы" },
  { href: "/orders", label: "Заказы" },
  { href: "/account", label: "Профиль" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ user: PublicUser | null }>("/api/auth/me");
      setUser(data.user);
      setError(null);
    } catch (caught) {
      setUser(null);
      setError(caught instanceof ApiError ? caught.message : "Не удалось проверить сессию.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <SessionContext value={{ user, loading, error, refresh }}>
      <div className="min-h-dvh bg-background text-foreground">
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
            <Link className="font-heading text-xl tracking-tight" href="/">
              Норма
            </Link>
            <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Москва
            </p>
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <Link
                  className={cn(
                    buttonVariants({ variant: isActive(pathname, link.href) ? "secondary" : "ghost" }),
                    "h-10 px-3",
                  )}
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {error ? (
          <p className="bg-destructive/10 px-4 py-2 text-center text-sm text-destructive" role="status">
            {error}
          </p>
        ) : null}
        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-36 md:px-8 md:pb-16">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur md:hidden">
          <ul className="mx-auto grid max-w-lg grid-cols-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  className={cn(
                    "block py-3 text-center text-sm",
                    isActive(pathname, link.href) ? "font-semibold text-primary" : "text-muted-foreground",
                  )}
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </SessionContext>
  );
}
