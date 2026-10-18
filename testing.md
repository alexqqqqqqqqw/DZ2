# Проверка правил на одной задаче

Задача: карточка набора на экране рационов.

## До правил

Сырой ответ без файла правил. В нём смешаны вёрстка и пересчёт цены, тип входных данных стёрт, пустого и ошибочного состояния нет.

```tsx
export default function Card(props: any) {
  const price = props.days === 7 ? props.dayPrice * 7 : props.dayPrice;
  return (
    <div style={{ border: "1px solid #ccc", padding: 12 }} onClick={() => props.onClick(props)}>
      <div>{props.title || "Meal"}</div>
      <div>{price} rub</div>
    </div>
  );
}
```

Что в этом ответе плохо относительно правил проекта: есть `any`, недельная цена вычисляется умножением, текст на английском, нет ссылки на меню, нет отдельного состояния ошибки рядом с карточкой, клик висит на всей карточке без названия действия.

## После правил

Тот же экран собран по `.cursorrules`: цена приходит в копейках и форматируется, неделя не пересчитывается, ссылка подписана, ошибка списка живёт отдельно.

```tsx
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
```

## Что изменилось

Исчез пересчёт «неделя = 7 × день»: в заказ попадает цена конкретной записи каталога, для сбалансированной недели это 5 490 ₽, а не 6 230 ₽. У карточки появилась явная ссылка «Смотреть меню». Сбой загрузки каталога больше не выглядит как пустая сетка: есть текст и кнопка «Повторить». Типы полей заданы явно, `any` в этом компоненте нет. Это проверено тестом «показывает цену набора и ссылку на меню» и тестом кнопки «Повторить».
