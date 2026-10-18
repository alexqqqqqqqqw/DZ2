"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/components/shell";
import { EmptyState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { readStorage, storageKeys, type NotificationChoice } from "@/lib/storage";

const labels: Record<NotificationChoice, string> = {
  granted: "разрешены",
  denied: "запрещены браузером",
  skipped: "пропущены",
};

export function AccountScreen() {
  const session = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<string>("ещё не выбирали");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const value = readStorage(storageKeys.notifications);
      if (value === "granted" || value === "denied" || value === "skipped") {
        setNotifications(labels[value]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function logout() {
    setPending(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      await session.refresh();
      router.push("/");
    } finally {
      setPending(false);
    }
  }

  if (session.loading) {
    return <LoadingBlock label="Открываем профиль" />;
  }
  if (!session.user) {
    return (
      <EmptyState
        action="Войти"
        href="/login?next=/account"
        text="Профиль, телефон и выход из сессии доступны после входа."
        title="Вы не вошли"
      />
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-4xl">{session.user.name}</h1>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Почта</dt>
          <dd>{session.user.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Телефон</dt>
          <dd>{session.user.phone}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Уведомления</dt>
          <dd>{notifications}</dd>
        </div>
      </dl>
      <Button className="mt-8 h-12" disabled={pending} type="button" variant="outline" onClick={() => void logout()}>
        {pending ? "Выходим" : "Выйти"}
      </Button>
    </div>
  );
}
