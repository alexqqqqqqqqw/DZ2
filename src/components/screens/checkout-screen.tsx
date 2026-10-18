"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/components/shell";
import { DeliveryDateField, ErrorState, Field, LoadingBlock, TextInput } from "@/components/states";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import {
  DELIVERY_SLOTS,
  earliestDeliveryDate,
  formatRub,
  MVP_CITY,
  parseOrderInput,
} from "@/lib/domain";
import { readStorage, storageKeys, writeStorage } from "@/lib/storage";
import type { Order, PlanDetail } from "@/lib/types";

type Draft = {
  planId: string;
  startDate: string;
  slot: string;
  street: string;
  house: string;
  apartment: string;
  comment: string;
  phone: string;
};

function emptyDraft(planId: string): Draft {
  return {
    planId,
    startDate: earliestDeliveryDate(),
    slot: "14-18",
    street: "",
    house: "",
    apartment: "",
    comment: "",
    phone: "",
  };
}

export function CheckoutScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const session = useSession();
  const planId = params.get("plan") ?? "";
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(planId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      setLoading(false);
      setLoadError("Сначала выберите набор в каталоге.");
      return;
    }
    const saved = readStorage(storageKeys.checkout);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Draft;
        if (parsed.planId === planId) {
          setDraft({ ...emptyDraft(planId), ...parsed, planId });
        }
      } catch {
        setDraft(emptyDraft(planId));
      }
    }
    let cancelled = false;
    void api<{ plan: PlanDetail }>(`/api/plans/${planId}`)
      .then((data) => {
        if (!cancelled) {
          setPlan(data.plan);
          setLoadError(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setLoadError(caught instanceof ApiError ? caught.message : "Набор не найден.");
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
  }, [planId]);

  useEffect(() => {
    if (!session.user?.phone) {
      return;
    }
    setDraft((current) => (current.phone ? current : { ...current, phone: session.user?.phone ?? "" }));
  }, [session.user]);

  function update(patch: Partial<Draft>) {
    setDraft((current) => {
      const next = { ...current, ...patch };
      writeStorage(storageKeys.checkout, JSON.stringify(next));
      return next;
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload = { ...draft, city: MVP_CITY, planId };
    const parsed = parseOrderInput(payload);
    if (!parsed.ok) {
      setErrors(parsed.fields);
      setFormError("Исправьте поля, отмеченные ниже.");
      return;
    }
    if (!session.user) {
      writeStorage(storageKeys.checkout, JSON.stringify(draft));
      router.push(`/login?next=${encodeURIComponent(`/checkout?plan=${planId}`)}`);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setErrors({});
    try {
      const data = await api<{ order: Order }>("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push(`/pay/${data.order.id}`);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFormError(caught.message);
        setErrors(caught.fields ?? {});
        if (caught.status === 401) {
          router.push(`/login?next=${encodeURIComponent(`/checkout?plan=${planId}`)}`);
        }
      } else {
        setFormError("Не удалось сохранить заказ.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingBlock label="Собираем оформление" />;
  }
  if (loadError || !plan) {
    return (
      <div className="space-y-4">
        <ErrorState message={loadError ?? "Набор не найден."} />
        <Link className="text-sm underline" href="/rations">
          Вернуться к рационам
        </Link>
      </div>
    );
  }

  return (
    <form className="grid gap-8 md:grid-cols-[minmax(0,1fr)_300px]" onSubmit={(event) => void submit(event)}>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-4xl">Доставка</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {plan.name}. Город в этой версии один — Москва.
          </p>
        </div>
        {formError ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}
        {!session.loading && !session.user ? (
          <p className="rounded-xl bg-card px-3 py-2 text-sm ring-1 ring-foreground/10">
            Заказ сохранится после входа. Черновик адреса останется на этом экране.
          </p>
        ) : null}
        <DeliveryDateField
          error={errors.startDate}
          value={draft.startDate}
          onChange={(startDate) => update({ startDate })}
        />
        <fieldset>
          <legend className="text-sm font-medium">Интервал курьера</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {DELIVERY_SLOTS.map((slot) => (
              <label
                className={`flex h-11 items-center justify-center rounded-lg border text-sm ${
                  draft.slot === slot.id ? "border-primary bg-primary text-primary-foreground" : "bg-card"
                }`}
                key={slot.id}
              >
                <input
                  checked={draft.slot === slot.id}
                  className="sr-only"
                  name="slot"
                  type="radio"
                  value={slot.id}
                  onChange={() => update({ slot: slot.id })}
                />
                {slot.label}
              </label>
            ))}
          </div>
          {errors.slot ? <p className="mt-2 text-sm text-destructive">{errors.slot}</p> : null}
        </fieldset>
        <Field error={errors.street} htmlFor="street" label="Улица">
          <TextInput
            aria-invalid={Boolean(errors.street)}
            autoComplete="address-line1"
            id="street"
            value={draft.street}
            onChange={(event) => update({ street: event.target.value })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.house} htmlFor="house" label="Дом">
            <TextInput
              aria-invalid={Boolean(errors.house)}
              id="house"
              value={draft.house}
              onChange={(event) => update({ house: event.target.value })}
            />
          </Field>
          <Field error={errors.apartment} htmlFor="apartment" label="Квартира">
            <TextInput
              id="apartment"
              value={draft.apartment}
              onChange={(event) => update({ apartment: event.target.value })}
            />
          </Field>
        </div>
        <Field error={errors.phone} hint="Нужен курьеру в день доставки." htmlFor="phone" label="Телефон">
          <TextInput
            aria-invalid={Boolean(errors.phone)}
            autoComplete="tel"
            id="phone"
            inputMode="tel"
            placeholder="+7 903 000-00-00"
            value={draft.phone}
            onChange={(event) => update({ phone: event.target.value })}
          />
        </Field>
        <Field error={errors.comment} htmlFor="comment" label="Комментарий курьеру">
          <TextInput
            id="comment"
            value={draft.comment}
            onChange={(event) => update({ comment: event.target.value })}
          />
        </Field>
        <Button className="h-12 px-5" disabled={submitting} type="submit">
          {submitting ? "Сохраняем заказ" : session.user ? "Перейти к оплате" : "Войти и продолжить"}
        </Button>
      </div>
      <aside className="h-fit rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:sticky md:top-24">
        <p className="text-sm text-muted-foreground">Сумма заказа</p>
        <p className="mt-1 font-heading text-4xl">{formatRub(plan.priceKopecks)}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Это цена выбранного набора. Доставка по Москве уже включена, отдельной строки нет.
        </p>
      </aside>
    </form>
  );
}
