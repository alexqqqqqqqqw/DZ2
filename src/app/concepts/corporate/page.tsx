import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Концепция: смена" };

const rows = [
  ["Сбалансированный", "1 день", "1 950", "890 ₽"],
  ["Сбалансированный", "7 дней", "1 950", "5 490 ₽"],
  ["Высокобелковый", "1 день", "1 750", "990 ₽"],
  ["Вегетарианский", "7 дней", "1 850", "5 390 ₽"],
];

export default function CorporateConceptPage() {
  return (
    <main className="min-h-dvh bg-[#eef2f6] text-[#142033]">
      <header className="bg-[#10243f] px-5 py-4 text-white">
        <p className="text-[11px] tracking-[0.18em] uppercase">Норма · корпоративное питание</p>
        <h1 className="mt-1 text-2xl font-semibold">Каталог рационов</h1>
      </header>
      <div className="px-4 py-5">
        <p className="text-xs text-[#4d5d73]">Концепция 3 · смена. Плотная таблица, мало воздуха, упор на сравнение.</p>
        <div className="mt-4 overflow-hidden rounded-md border border-[#c5d0dc] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f4f7fa] text-xs tracking-wide text-[#4d5d73] uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Рацион</th>
                <th className="px-3 py-2 font-medium">Срок</th>
                <th className="px-3 py-2 font-medium">Ккал</th>
                <th className="px-3 py-2 font-medium">Цена</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-t border-[#e1e7ee]" key={row.join("-")}>
                  {row.map((cell) => (
                    <td className="px-3 py-3" key={cell}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#4d5d73]">
          Удобно сравнивать четыре типа сразу, но на телефоне таблица тесная и не ведёт к составу блюд.
        </p>
        <Link className="mt-4 inline-block text-sm text-[#10243f] underline" href="/">
          В выбранный интерфейс
        </Link>
      </div>
    </main>
  );
}
