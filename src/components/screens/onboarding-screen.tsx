"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { storageKeys, writeStorage, type NotificationChoice } from "@/lib/storage";

const steps = [
  {
    title: "Как устроен заказ",
    text: "Вы выбираете один готовый тип питания, затем набор на день или на неделю. Менять блюда внутри набора нельзя.",
  },
  {
    title: "Когда привезут",
    text: "Кухня принимает заказ минимум за два календарных дня. Курьер партнёра приезжает в выбранный интервал, только по Москве.",
  },
  {
    title: "Оплата",
    text: "Сначала сохраняется заказ, затем карта. Если банк отклоняет оплату, набор не уходит в готовку.",
  },
];

export function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  function finish(choice: NotificationChoice) {
    writeStorage(storageKeys.notifications, choice);
    writeStorage(storageKeys.onboarded, "1");
    router.push("/rations");
  }

  async function allowNotifications() {
    if (typeof Notification === "undefined") {
      setNote("В этом браузере нет запроса уведомлений. Можно идти дальше.");
      finish("skipped");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      finish(result === "granted" ? "granted" : "denied");
    } catch {
      setNote("Браузер не показал запрос. Статус доставки останется в разделе заказов.");
      finish("skipped");
    }
  }

  if (step >= steps.length) {
    return (
      <div className="mx-auto max-w-lg">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Последний шаг</p>
        <h1 className="mt-3 font-heading text-4xl leading-tight">Напомнить о доставке?</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Уведомление нужно, чтобы не пропустить интервал курьера. Если откажете или браузер не спросит,
          статус всё равно останется в заказах.
        </p>
        {note ? <p className="mt-3 text-sm">{note}</p> : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button className="h-12 px-5" type="button" onClick={() => void allowNotifications()}>
            Разрешить уведомления
          </Button>
          <Button className="h-12 px-5" type="button" variant="outline" onClick={() => finish("skipped")}>
            Не сейчас
          </Button>
        </div>
      </div>
    );
  }

  const current = steps[step];
  if (!current) {
    return null;
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
        Шаг {step + 1} из {steps.length + 1}
      </p>
      <h1 className="mt-3 font-heading text-4xl leading-tight">{current.title}</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{current.text}</p>
      <div className="mt-8 flex gap-3">
        {step < steps.length - 1 ? (
          <Button className="h-12 px-5" type="button" onClick={() => setStep((value) => value + 1)}>
            Дальше
          </Button>
        ) : (
          <Button className="h-12 px-5" type="button" onClick={() => setStep(steps.length)}>
            К уведомлениям
          </Button>
        )}
      </div>
    </div>
  );
}
