"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorState, Field, LoadingBlock, TextInput } from "@/components/states";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { formatRub, inspectCard } from "@/lib/domain";
import type { Order } from "@/lib/types";

export function PayScreen() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const orderId = params.orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [number, setNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
          const message = caught instanceof ApiError ? caught.message : "Заказ не открылся.";
          setError(message);
          if (caught instanceof ApiError && caught.status === 401) {
            router.push(`/login?next=${encodeURIComponent(`/pay/${orderId}`)}`);
          }
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
  }, [orderId, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const card = {
      number,
      expMonth: Number(expMonth),
      expYear: Number(expYear),
      cvv,
    };
    const inspected = inspectCard(card);
    if (!inspected.ok && inspected.reason !== "declined") {
      setFields(
        inspected.reason === "invalid_number"
          ? { number: "Номер карты должен содержать 16 цифр и проходить проверку Луна." }
          : inspected.reason === "expired"
            ? { expMonth: "Срок действия карты уже прошёл." }
            : { cvv: "CVV — это 3 цифры." },
      );
      setFormError("Проверьте данные карты.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setFields({});
    try {
      const data = await api<{ order: Order }>("/api/payments", {
        method: "POST",
        body: JSON.stringify({ orderId, card }),
      });
      router.push(`/orders/${data.order.id}`);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFormError(caught.message);
        setFields(caught.fields ?? {});
        if (caught.status === 402) {
          setOrder((current) => (current ? { ...current, status: "payment_failed", statusLabel: "Оплата не прошла" } : current));
        }
      } else {
        setFormError("Оплата не прошла из-за сети. Повторите.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingBlock label="Открываем оплату" />;
  }
  if (error || !order) {
    return <ErrorState message={error ?? "Заказ не найден."} />;
  }
  if (order.status === "paid" || order.status === "delivered") {
    return (
      <div className="max-w-lg">
        <h1 className="font-heading text-4xl">Заказ уже оплачен</h1>
        <Link className="mt-4 inline-block underline" href={`/orders/${order.id}`}>
          Открыть статус
        </Link>
      </div>
    );
  }

  return (
    <form className="mx-auto grid max-w-xl gap-4" onSubmit={(event) => void submit(event)}>
      <h1 className="font-heading text-4xl">Оплата</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        {order.planName} на {order.startDate}, интервал {order.slotLabel}. К списанию {formatRub(order.totalKopecks)}.
        Полный номер карты не сохраняется.
      </p>
      <p className="rounded-xl bg-card px-3 py-2 text-sm leading-6 ring-1 ring-foreground/10">
        Тестовый эквайринг: успех — 4242 4242 4242 4242, отказ банка — 4000 0000 0000 0002. Месяц и год в будущем, CVV
        из трёх цифр.
      </p>
      {formError ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
      <Field error={fields.number} htmlFor="number" label="Номер карты">
        <TextInput
          autoComplete="cc-number"
          id="number"
          inputMode="numeric"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field error={fields.expMonth} htmlFor="expMonth" label="Месяц">
          <TextInput
            id="expMonth"
            inputMode="numeric"
            placeholder="12"
            value={expMonth}
            onChange={(event) => setExpMonth(event.target.value)}
          />
        </Field>
        <Field error={fields.expYear} htmlFor="expYear" label="Год">
          <TextInput
            id="expYear"
            inputMode="numeric"
            placeholder="2028"
            value={expYear}
            onChange={(event) => setExpYear(event.target.value)}
          />
        </Field>
        <Field error={fields.cvv} htmlFor="cvv" label="CVV">
          <TextInput
            autoComplete="cc-csc"
            id="cvv"
            inputMode="numeric"
            value={cvv}
            onChange={(event) => setCvv(event.target.value)}
          />
        </Field>
      </div>
      <Button className="h-12" disabled={submitting} type="submit">
        {submitting ? "Отправляем в банк" : `Оплатить ${formatRub(order.totalKopecks)}`}
      </Button>
    </form>
  );
}
