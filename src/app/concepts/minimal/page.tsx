import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Концепция: бумажная" };

const plans = [
  ["1 день", "Сбалансированный", "890 ₽", "около 1 950 ккал"],
  ["7 дней", "Сбалансированный", "5 490 ₽", "семь разных меню"],
];

export default function MinimalConceptPage() {
  return (
    <main className="min-h-dvh bg-[#f3efe6] px-5 py-8 text-[#241c16]">
      <p className="text-xs tracking-[0.22em] uppercase">Концепция 1 · бумажная</p>
      <h1 className="mt-6 max-w-sm font-heading text-5xl leading-[0.95]">Выберите длительность</h1>
      <p className="mt-4 max-w-sm text-sm leading-6 text-[#5c5148]">
        Много воздуха, одна колонка, цена крупно. Этот вариант взяли в продукт.
      </p>
      <div className="mt-8 space-y-4">
        {plans.map(([badge, name, price, note]) => (
          <article className="rounded-[1.8rem] bg-[#fffdf8] p-5" key={badge}>
            <p className="text-xs tracking-[0.16em] text-[#1f5c45] uppercase">{badge}</p>
            <h2 className="mt-2 font-heading text-2xl">{name}</h2>
            <p className="mt-4 font-heading text-4xl">{price}</p>
            <p className="mt-1 text-sm text-[#5c5148]">{note}</p>
          </article>
        ))}
      </div>
      <Link className="mt-8 inline-block text-sm underline" href="/concepts/vivid">
        Следующая концепция
      </Link>
    </main>
  );
}
