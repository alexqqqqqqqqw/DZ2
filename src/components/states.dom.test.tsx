/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeliveryDateField, ErrorState, PlanCard } from "@/components/states";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("карточка набора", () => {
  it("показывает цену набора и ссылку на меню", () => {
    render(
      <PlanCard
        durationDays={7}
        href="/rations/week"
        kcal={1950}
        mealsPerDay={4}
        name="Сбалансированный на неделю"
        priceKopecks={549000}
      />,
    );
    expect(screen.getByText("Сбалансированный на неделю")).toBeTruthy();
    expect(screen.getByText("5 490 ₽")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Смотреть меню" }).getAttribute("href")).toBe("/rations/week");
  });
});

describe("ошибка загрузки", () => {
  it("показывает сообщение и вызывает повтор", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Нет связи с сервером. Проверьте сеть и повторите." onRetry={onRetry} />);
    expect(screen.getByRole("alert").textContent).toContain("Нет связи");
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("дата доставки", () => {
  it("ставит минимальную дату через 2 дня и показывает ошибку сервера", () => {
    const now = new Date("2026-03-10T09:00:00.000Z");
    render(
      <DeliveryDateField
        error="Первая доставка не раньше 2026-03-12: кухне нужно 2 календарных дня по Москве."
        now={now}
        value="2026-03-11"
        onChange={() => undefined}
      />,
    );
    const input = screen.getByLabelText("Дата первой доставки");
    expect(input.getAttribute("min")).toBe("2026-03-12");
    expect(screen.getByRole("alert").textContent).toContain("2026-03-12");
  });
});
