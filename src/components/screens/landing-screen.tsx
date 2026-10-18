"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatRub } from "@/lib/domain";
import { readStorage, storageKeys } from "@/lib/storage";
import type { Diet } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LandingScreen() {
  const [price, setPrice] = useState<number | null>(null);
  const [priceState, setPriceState] = useState<"loading" | "ready" | "error">("loading");
  const [nextHref, setNextHref] = useState("/onboarding");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNextHref(readStorage(storageKeys.onboarded) === "1" ? "/rations" : "/onboarding");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void api<{ diets: Diet[] }>("/api/diets")
      .then((data) => {
        if (cancelled) {
          return;
        }
        const prices = data.diets.map((diet) => diet.priceFromKopecks).filter((value) => value > 0);
        if (prices.length === 0) {
          setPriceState("error");
          return;
        }
        setPrice(Math.min(...prices));
        setPriceState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setPriceState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid items-end gap-8 md:grid-cols-[1.15fr_0.85fr] md:gap-12">
      <section>
        <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
          Готовые наборы · день или неделя
        </p>
        <h1 className="mt-4 max-w-xl font-heading text-5xl leading-[0.95] md:text-7xl">
          Рацион без конструктора тарелок
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
          Четыре фиксированных меню. Оплата картой, первая доставка не раньше чем через два дня.
          По Москве еду везёт партнёр, своей курьерской службы нет.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link className={cn(buttonVariants({ size: "lg" }), "h-12 px-5")} href={nextHref}>
            Выбрать тип питания
          </Link>
          <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-5")} href="/login">
            У меня уже есть аккаунт
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {priceState === "ready" && price
            ? `Дневной набор от ${formatRub(price)}.`
            : priceState === "error"
              ? "Цену дня покажем в каталоге, если сервер ответит."
              : "Считаем минимальную цену дня."}{" "}
          Веганского меню в этой версии нет.
        </p>
      </section>
      <aside className="rounded-[2rem] bg-primary p-6 text-primary-foreground md:p-8">
        <p className="font-heading text-3xl leading-tight">Что входит в заказ</p>
        <ul className="mt-6 space-y-4 text-sm leading-6">
          <li>Завтрак, обед, перекус и ужин. Состав нельзя собрать по блюдам.</li>
          <li>Дата старта не раньше, чем через 2 календарных дня.</li>
          <li>Интервал доставки: утро, день или вечер.</li>
          <li>После оплаты статус заказа виден в личном списке.</li>
        </ul>
        <p className="mt-8 text-xs leading-5 text-primary-foreground/80">
          Три черновых концепции экрана лежат отдельно:{" "}
          <Link className="underline" href="/concepts/minimal">
            бумажная
          </Link>
          ,{" "}
          <Link className="underline" href="/concepts/vivid">
            цитрус
          </Link>
          ,{" "}
          <Link className="underline" href="/concepts/corporate">
            смена
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}
