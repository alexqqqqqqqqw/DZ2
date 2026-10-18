"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-heading text-4xl">Страница сломалась</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {error.message || "Непредвиденная ошибка интерфейса. Данные заказа на сервере не изменились сами."}
      </p>
      <Button className="mt-6 h-11" type="button" onClick={reset}>
        Попробовать снова
      </Button>
    </div>
  );
}
