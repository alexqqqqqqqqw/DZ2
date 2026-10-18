import { describe, expect, it } from "vitest";

import {
  DECLINED_PAN,
  earliestDeliveryDate,
  inspectCard,
  isDeliveryDateAllowed,
  moscowToday,
  parseOrderInput,
  SUCCESS_PAN,
  validatePassword,
} from "@/lib/domain";

describe("дата доставки по Москве", () => {
  it("считает календарный день Москвы, а не UTC", () => {
    const lateEveningUtc = new Date("2026-10-14T21:30:00.000Z");
    expect(moscowToday(lateEveningUtc)).toBe("2026-10-15");
    expect(earliestDeliveryDate(lateEveningUtc)).toBe("2026-10-17");
  });

  it("отклоняет завтра и принимает дату через 2 дня", () => {
    const now = new Date("2026-03-10T09:00:00.000Z");
    expect(isDeliveryDateAllowed("2026-03-11", now)).toBe(false);
    expect(isDeliveryDateAllowed("2026-03-12", now)).toBe(true);
  });
});

describe("карта", () => {
  const future = { expMonth: 12, expYear: 2030, cvv: "123" };

  it("принимает тестовую успешную карту и отдаёт последние 4 цифры", () => {
    const result = inspectCard({ number: SUCCESS_PAN, ...future }, new Date("2026-10-14T00:00:00.000Z"));
    expect(result).toEqual({ ok: true, last4: "4242" });
  });

  it("отклоняет тестовую карту банка, не считая её ошибкой ввода", () => {
    const result = inspectCard({ number: DECLINED_PAN, ...future }, new Date("2026-10-14T00:00:00.000Z"));
    expect(result).toEqual({ ok: false, reason: "declined", last4: "0002" });
  });

  it("не принимает номер без контрольной цифры Луна", () => {
    const result = inspectCard(
      { number: "4242424242424241", ...future },
      new Date("2026-10-14T00:00:00.000Z"),
    );
    expect(result).toEqual({ ok: false, reason: "invalid_number" });
  });

  it("не принимает просроченный месяц", () => {
    const result = inspectCard(
      { number: SUCCESS_PAN, expMonth: 1, expYear: 2026, cvv: "123" },
      new Date("2026-10-14T00:00:00.000Z"),
    );
    expect(result).toEqual({ ok: false, reason: "expired" });
  });
});

describe("заказ", () => {
  it("требует московский адрес и отдельную цену набора, а не пересчёт недели", () => {
    const now = new Date("2026-03-10T09:00:00.000Z");
    const parsed = parseOrderInput(
      {
        planId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
        startDate: "2026-03-11",
        slot: "14-18",
        city: "Казань",
        street: "Тверская",
        house: "1",
        apartment: "",
        comment: "",
        phone: "+7 903 111-22-33",
      },
      now,
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.fields.city).toBeTruthy();
      expect(parsed.fields.startDate).toBeTruthy();
    }
  });

  it("не принимает пароль без цифры", () => {
    expect(validatePassword("толькобуквы")).toBeTruthy();
    expect(validatePassword("Norma123")).toBeNull();
  });
});
