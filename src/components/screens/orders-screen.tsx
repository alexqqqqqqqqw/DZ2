"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useSession } from "@/components/shell";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/states";
import { buttonVariants } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { formatRub } from "@/lib/domain";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OrdersScreen() {
  const session = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (session.loading) {
      return;
    }
    if (!session.user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void api<{ orders: Order[] }>("/api/orders")
      .then((data) => {
        if (!cancelled) {
          setOrders(data.orders);
          setError(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : "Список заказов не открылся.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session.loading, session.user, reloadKey]);

  if (session.loading || loading) {
    return <LoadingBlock label="Открываем заказы" />;
  }
  if (!session.user) {
    return (
      <EmptyState
        action="Войти"
        href="/login?next=/orders"
        text="Список заказов доступен только после входа. Чужие заказы не показываются."
        title="Нужен аккаунт"
      />
    );
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => setReloadKey((value) => value + 1)} />;
  }
  if (orders.length === 0) {
    return (
      <EmptyState
        action="Выбрать рацион"
        href="/rations"
        text="Пока пусто. Заказ появится здесь после оформления, даже если оплата ещё не прошла."
        title="Заказов нет"
      />
    );
  }

  return (
    <div>
      <h1 className="font-heading text-4xl">Заказы</h1>
      <ul className="mt-6 space-y-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link className="block rounded-2xl bg-card p-4 ring-1 ring-foreground/10" href={`/orders/${order.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-xl">{order.planName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.startDate} · {order.slotLabel} · {order.statusLabel}
                  </p>
                </div>
                <p className="font-medium">{formatRub(order.totalKopecks)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link className={cn(buttonVariants({ variant: "outline" }), "mt-6 h-11")} href="/rations">
        Новый заказ
      </Link>
    </div>
  );
}
