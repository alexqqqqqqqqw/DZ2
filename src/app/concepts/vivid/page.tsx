import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Концепция: цитрус" };

export default function VividConceptPage() {
  return (
    <main className="min-h-dvh bg-[#111111] px-4 py-6 text-[#f6f1c8]">
      <p className="text-xs tracking-[0.22em] text-[#d6ff4a] uppercase">Концепция 2 · цитрус</p>
      <h1 className="mt-4 font-heading text-6xl leading-[0.85] text-[#d6ff4a]">День или неделя</h1>
      <div className="mt-8 grid gap-3">
        <article className="rotate-[-1.5deg] bg-[#ff5a36] p-5 text-[#1a0d08]">
          <p className="text-sm font-bold uppercase">Сегодняшний набор</p>
          <p className="mt-2 font-heading text-5xl leading-none">890 ₽</p>
          <p className="mt-3 text-sm">Один день. Четыре коробки. Без выбора гарнира.</p>
        </article>
        <article className="ml-6 bg-[#d6ff4a] p-5 text-[#111111]">
          <p className="text-sm font-bold uppercase">Неделя</p>
          <p className="mt-2 font-heading text-5xl leading-none">5 490 ₽</p>
          <p className="mt-3 text-sm">Семь меню одной стопкой. Цена не равна семи дням.</p>
        </article>
      </div>
      <p className="mt-8 max-w-xs text-sm leading-6 text-[#f6f1c8]/80">
        Ярко и быстро считывается цена, но на длинном меню КБЖУ этот контраст устаёт.
      </p>
      <Link className="mt-6 inline-block text-sm text-[#d6ff4a] underline" href="/concepts/corporate">
        Следующая концепция
      </Link>
    </main>
  );
}
