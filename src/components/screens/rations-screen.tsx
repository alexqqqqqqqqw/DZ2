"use client";

import { useEffect, useState } from "react";

import { ErrorState, LoadingBlock, PlanCard } from "@/components/states";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { formatRub } from "@/lib/domain";
import { readStorage, storageKeys, writeStorage } from "@/lib/storage";
import type { Diet, PlanSummary } from "@/lib/types";

export function RationsScreen() {
  const [diets, setDiets] = useState<Diet[]>([]);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [diet, setDiet] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([api<{ diets: Diet[] }>("/api/diets"), api<{ plans: PlanSummary[] }>("/api/plans")])
      .then(([dietData, planData]) => {
        if (cancelled) {
          return;
        }
        setDiets(dietData.diets);
        setPlans(planData.plans);
        const saved = readStorage(storageKeys.diet);
        const initial = dietData.diets.some((item) => item.slug === saved)
          ? saved
          : dietData.diets[0]?.slug;
        setDiet(initial ?? "");
        setError(null);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : "Не удалось открыть каталог.");
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
  }, [reloadKey]);

  function chooseDiet(slug: string) {
    setDiet(slug);
    writeStorage(storageKeys.diet, slug);
  }

  const visible = plans.filter((plan) => plan.dietSlug === diet);
  const selected = diets.find((item) => item.slug === diet);

  return (
    <div>
      <h1 className="font-heading text-4xl md:text-5xl">Тип питания</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Один тип на заказ. Внутри набора блюда уже собраны: отдельного конструктора в этой версии нет.
      </p>
      {loading ? <div className="mt-8"><LoadingBlock label="Открываем рационы" /></div> : null}
      {error ? (
        <div className="mt-8">
          <ErrorState message={error} onRetry={() => setReloadKey((value) => value + 1)} />
        </div>
      ) : null}
      {!loading && !error && diets.length === 0 ? (
        <p className="mt-8 text-sm">В каталоге нет типов питания. Обновите страницу чуть позже.</p>
      ) : null}
      {!loading && !error && diets.length > 0 ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {diets.map((item) => (
              <Button
                className="h-auto justify-start px-4 py-4 text-left whitespace-normal"
                data-testid={`diet-${item.slug}`}
                key={item.slug}
                type="button"
                variant={item.slug === diet ? "default" : "outline"}
                onClick={() => chooseDiet(item.slug)}
              >
                <span className="block">
                  <span className="block font-heading text-lg">{item.name}</span>
                  <span className="mt-1 block text-sm font-normal opacity-80">
                    {item.kcalMin}–{item.kcalMax} ккал · от {formatRub(item.priceFromKopecks)} в день
                  </span>
                </span>
              </Button>
            ))}
          </div>
          {selected ? <p className="mt-4 max-w-2xl text-sm leading-6">{selected.description}</p> : null}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {visible.map((plan) => (
              <PlanCard
                durationDays={plan.durationDays}
                href={`/rations/${plan.id}`}
                kcal={plan.kcalPerDay}
                key={plan.id}
                mealsPerDay={plan.mealsPerDay}
                name={plan.name}
                priceKopecks={plan.priceKopecks}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
