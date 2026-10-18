"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorState, LoadingBlock } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { formatRub, MEAL_SLOT_LABELS, type MealSlot } from "@/lib/domain";
import type { PlanDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PlanScreen() {
  const params = useParams<{ planId: string }>();
  const planId = params.planId;
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [day, setDay] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!planId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    void api<{ plan: PlanDetail }>(`/api/plans/${planId}`)
      .then((data) => {
        if (!cancelled) {
          setPlan(data.plan);
          setError(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : "Меню не открылось.");
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
  }, [planId, reloadKey]);

  if (loading) {
    return <LoadingBlock label="Открываем меню" />;
  }
  if (error || !plan) {
    return <ErrorState message={error ?? "Набор не найден."} onRetry={() => setReloadKey((value) => value + 1)} />;
  }

  const meals = plan.meals.filter((meal) => meal.dayIndex === day);
  const days = Array.from(new Set(plan.meals.map((meal) => meal.dayIndex))).sort((a, b) => a - b);

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        <Link className="text-sm text-muted-foreground underline-offset-4 hover:underline" href="/rations">
          Все рационы
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{plan.dietName}</Badge>
          <Badge variant="outline">{plan.durationDays === 1 ? "1 день" : "7 дней"}</Badge>
        </div>
        <h1 className="mt-3 font-heading text-4xl">{plan.name}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{plan.description}</p>
        {days.length > 1 ? (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {days.map((item) => (
              <button
                className={cn(
                  "h-10 shrink-0 rounded-full px-4 text-sm",
                  item === day ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-foreground/10",
                )}
                key={item}
                type="button"
                onClick={() => setDay(item)}
              >
                День {item}
              </button>
            ))}
          </div>
        ) : null}
        <ul className="mt-6 space-y-3">
          {meals.map((meal) => (
            <li className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10" key={meal.slot}>
              <p className="text-xs tracking-[0.16em] text-primary uppercase">
                {MEAL_SLOT_LABELS[meal.slot as MealSlot]}
              </p>
              <p className="mt-1 font-heading text-xl">{meal.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{meal.description}</p>
              <p className="mt-3 text-sm">
                {meal.kcal} ккал · Б {meal.proteinG} · Ж {meal.fatG} · У {meal.carbsG}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit rounded-3xl bg-primary p-5 text-primary-foreground md:sticky md:top-24">
        <p className="text-sm">К оплате</p>
        <p className="mt-1 font-heading text-4xl">{formatRub(plan.priceKopecks)}</p>
        <p className="mt-3 text-sm leading-6 text-primary-foreground/80">
          Около {plan.kcalPerDay} ккал в день. Доставка по Москве входит в эту сумму.
        </p>
        <Link
          className={cn(buttonVariants({ variant: "secondary" }), "mt-6 h-12 w-full")}
          href={`/checkout?plan=${plan.id}`}
        >
          Оформить доставку
        </Link>
      </aside>
    </div>
  );
}
