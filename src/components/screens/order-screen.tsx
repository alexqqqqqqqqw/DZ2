"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorState, LoadingBlock } from "@/components/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { formatRub } from "@/lib/domain";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OrderScreen() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      return;
    }
    let cancelled = false;
    void api<{ order: Order }>(`/api/orders/${orderId}`)
      .then((data) => {
        if (!cancelled) {
          setOrder(data.order);
          setError(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : "Заказ не открылся.");
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
  }, [orderId]);

  async function receive() {
    if (!orderId) {
      return;
    }
    setPending(true);
    setActionError(null);
    try {
      const data = await api<{ order: Order }>(`/api/orders/${orderId}/receive`, { method: "POST" });
      setOrder(data.order);
    } catch (caught) {
      setActionError(caught instanceof ApiError ? caught.message : "Не удалось обновить статус.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <LoadingBlock label="Открываем заказ" />;
  }
  if (error || !order) {
    return <ErrorState message={error ?? "Заказ не найден."} />;
  }

  return (
    <article className="mx-auto max-w-xl">
      <Link className="text-sm text-muted-foreground underline" href="/orders">
        Все заказы
      </Link>
      <h1 className="mt-3 font-heading text-4xl">{order.planName}</h1>
      <p className="mt-2 text-lg">{order.statusLabel}</p>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Сумма</dt>
          <dd>{formatRub(order.totalKopecks)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Первая доставка</dt>
          <dd>
            {order.startDate}, {order.slotLabel}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Адрес</dt>
          <dd className="text-right">
            {order.city}, {order.street}, {order.house}
            {order.apartment ? `, кв. ${order.apartment}` : ""}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Телефон</dt>
          <dd>{order.phone}</dd>
        </div>
      </dl>
      {order.comment ? <p className="mt-4 text-sm text-muted-foreground">Курьеру: {order.comment}</p> : null}
      {actionError ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {order.status === "awaiting_payment" || order.status === "payment_failed" ? (
          <Link className={cn(buttonVariants(), "h-12 px-5")} href={`/pay/${order.id}`}>
            Оплатить
          </Link>
        ) : null}
        {order.status === "paid" ? (
          <Button className="h-12 px-5" disabled={pending} type="button" onClick={() => void receive()}>
            {pending ? "Обновляем" : "Я получил набор"}
          </Button>
        ) : null}
      </div>
      {order.status === "paid" ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Кухня получила оплату. Статусы «готовится» и «у курьера» в этой версии не приходят от партнёра: когда набор
          у вас, отметьте получение сами.
        </p>
      ) : null}
    </article>
  );
}
