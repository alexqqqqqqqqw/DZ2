"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { earliestDeliveryDate, formatRub, MIN_LEAD_DAYS } from "@/lib/domain";
import { cn } from "@/lib/utils";

export function LoadingBlock({ label = "Загружаем" }: { label?: string }) {
  return (
    <div className="space-y-3" aria-live="polite">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      <div className="h-28 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5" role="alert">
      <p className="font-medium">Не получилось загрузить данные</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button className="mt-4 h-11 px-4" type="button" variant="outline" onClick={onRetry}>
          Повторить
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center">
      <p className="font-heading text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
      {href && action ? (
        <Link className={cn(buttonVariants({ size: "lg" }), "mt-5 h-11 px-4")} href={href}>
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function PlanCard({
  name,
  durationDays,
  priceKopecks,
  kcal,
  mealsPerDay,
  href,
}: {
  name: string;
  durationDays: number;
  priceKopecks: number;
  kcal: number;
  mealsPerDay: number;
  href: string;
}) {
  return (
    <Card className="h-full justify-between bg-card">
      <CardHeader>
        <Badge variant="secondary">{durationDays === 1 ? "1 день" : `${durationDays} дней`}</Badge>
        <CardTitle className="font-heading text-xl">{name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          около {kcal} ккал · {mealsPerDay} приёма пищи
        </p>
      </CardHeader>
      <CardFooter className="justify-between gap-3 bg-transparent">
        <p className="font-heading text-2xl">{formatRub(priceKopecks)}</p>
        <Link className={cn(buttonVariants(), "h-11 px-4")} href={href}>
          Смотреть меню
        </Link>
      </CardFooter>
    </Card>
  );
}

export function DeliveryDateField({
  value,
  onChange,
  error,
  now,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  now?: Date;
}) {
  const min = earliestDeliveryDate(now);
  return (
    <div className="space-y-2">
      <Label htmlFor="startDate">Дата первой доставки</Label>
      <Input
        aria-describedby="startDate-hint"
        aria-invalid={Boolean(error)}
        className="h-11 bg-card px-3 text-base md:text-base"
        id="startDate"
        min={min}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-xs text-muted-foreground" id="startDate-hint">
        Не раньше {min}. Кухне нужно {MIN_LEAD_DAYS} календарных дня по Москве.
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput(props: React.ComponentProps<typeof Input>) {
  return <Input className="h-11 bg-card px-3 text-base md:text-base" {...props} />;
}

export { CardContent };
