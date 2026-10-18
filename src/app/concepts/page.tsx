import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Концепции интерфейса" };

const items = [
  ["/concepts/minimal", "Бумажная", "Тёплый фон, крупный заголовок, одна колонка."],
  ["/concepts/vivid", "Цитрус", "Чёрный фон, кислотный акцент, цена на весь экран."],
  ["/concepts/corporate", "Смена", "Тёмная шапка и таблица для сравнения наборов."],
];

export default function ConceptsIndexPage() {
  return (
    <main className="mx-auto max-w-lg px-5 py-10">
      <h1 className="font-heading text-4xl">Три концепции</h1>
      <ul className="mt-6 space-y-4">
        {items.map(([href, title, text]) => (
          <li key={href}>
            <Link className="block rounded-2xl bg-card p-4 ring-1 ring-foreground/10" href={href}>
              <span className="font-heading text-xl">{title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
