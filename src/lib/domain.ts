export const MIN_LEAD_DAYS = 2;
export const SESSION_DAYS = 7;
export const MVP_CITY = "Москва";
export const DECLINED_PAN = "4000000000000002";
export const SUCCESS_PAN = "4242424242424242";

export const DELIVERY_SLOTS = [
  { id: "10-14", label: "10:00–14:00" },
  { id: "14-18", label: "14:00–18:00" },
  { id: "18-22", label: "18:00–22:00" },
] as const;

export type SlotId = (typeof DELIVERY_SLOTS)[number]["id"];

export const MEAL_SLOTS = ["breakfast", "lunch", "snack", "dinner"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  snack: "Перекус",
  dinner: "Ужин",
};

export const ORDER_STATUSES = [
  "awaiting_payment",
  "payment_failed",
  "paid",
  "delivered",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Ждёт оплаты",
  payment_failed: "Оплата не прошла",
  paid: "Оплачен",
  delivered: "Доставлен",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type FieldErrors = Record<string, string>;

export function moscowToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addCalendarDays(isoDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new Error("bad date");
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function earliestDeliveryDate(now = new Date()): string {
  return addCalendarDays(moscowToday(now), MIN_LEAD_DAYS);
}

export function isDeliveryDateAllowed(date: string, now = new Date()): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= earliestDeliveryDate(now);
}

export function slotLabel(slot: string): string {
  return DELIVERY_SLOTS.find((item) => item.id === slot)?.label ?? slot;
}

export function formatRub(kopecks: number): string {
  const rubles = Math.round(kopecks / 100);
  return `${new Intl.NumberFormat("ru-RU").format(rubles)} ₽`;
}

export function luhnValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) {
    return false;
  }
  let sum = 0;
  let alternate = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = digits.charCodeAt(index) - 48;
    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0 && digits.length > 0;
}

export function moscowYearMonth(now = new Date()): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return { year, month };
}

export type CardInspection =
  | { ok: true; last4: string }
  | { ok: false; reason: "invalid_number" | "expired" | "invalid_cvv" }
  | { ok: false; reason: "declined"; last4: string };

export function inspectCard(
  input: { number: string; expMonth: number; expYear: number; cvv: string },
  now = new Date(),
): CardInspection {
  const digits = input.number.replace(/\s+/g, "");
  if (!/^\d{16}$/.test(digits) || !luhnValid(digits)) {
    return { ok: false, reason: "invalid_number" };
  }
  if (!Number.isInteger(input.expMonth) || input.expMonth < 1 || input.expMonth > 12) {
    return { ok: false, reason: "expired" };
  }
  if (!Number.isInteger(input.expYear) || input.expYear < 2000 || input.expYear > 2100) {
    return { ok: false, reason: "expired" };
  }
  const current = moscowYearMonth(now);
  if (
    input.expYear < current.year ||
    (input.expYear === current.year && input.expMonth < current.month)
  ) {
    return { ok: false, reason: "expired" };
  }
  if (!/^\d{3}$/.test(input.cvv)) {
    return { ok: false, reason: "invalid_cvv" };
  }
  if (digits === DECLINED_PAN) {
    return { ok: false, reason: "declined", last4: digits.slice(-4) };
  }
  return { ok: true, last4: digits.slice(-4) };
}

export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let national = digits;
  if (national.length === 11 && (national.startsWith("7") || national.startsWith("8"))) {
    national = national.slice(1);
  }
  if (national.length !== 10 || !national.startsWith("9")) {
    return null;
  }
  return `+7${national}`;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8 || password.length > 72) {
    return "Пароль должен быть от 8 до 72 символов.";
  }
  if (!/[a-zA-Zа-яА-Я]/.test(password) || !/\d/.test(password)) {
    return "В пароле нужна хотя бы одна буква и одна цифра.";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  if (value.length < 5 || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Укажите почту в формате name@example.com.";
  }
  return null;
}

export type OrderDraft = {
  planId: string;
  startDate: string;
  slot: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  comment: string;
  phone: string;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseOrderInput(
  raw: unknown,
  now = new Date(),
): { ok: true; value: OrderDraft & { phone: string; city: string } } | { ok: false; fields: FieldErrors } {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const fields: FieldErrors = {};
  const planId = text(source.planId);
  const startDate = text(source.startDate);
  const slot = text(source.slot);
  const cityInput = text(source.city);
  const street = text(source.street);
  const house = text(source.house);
  const apartment = text(source.apartment);
  const comment = text(source.comment);
  const phoneInput = text(source.phone);

  if (!isUuid(planId)) {
    fields.planId = "Выберите набор из каталога.";
  }
  if (!isDeliveryDateAllowed(startDate, now)) {
    fields.startDate = `Первая доставка не раньше ${earliestDeliveryDate(now)}: кухне нужно ${MIN_LEAD_DAYS} календарных дня по Москве.`;
  }
  if (!DELIVERY_SLOTS.some((item) => item.id === slot)) {
    fields.slot = "Выберите интервал 10:00–14:00, 14:00–18:00 или 18:00–22:00.";
  }
  const cityKey = cityInput.toLowerCase().replace(/^г\.?\s*/, "");
  if (cityKey !== "москва") {
    fields.city = "В этой версии доставляем только по Москве.";
  }
  if (street.length < 2 || street.length > 80) {
    fields.street = "Укажите улицу, от 2 до 80 символов.";
  }
  if (house.length < 1 || house.length > 20) {
    fields.house = "Укажите дом.";
  }
  if (apartment.length > 20) {
    fields.apartment = "Квартира не длиннее 20 символов.";
  }
  if (comment.length > 200) {
    fields.comment = "Комментарий не длиннее 200 символов.";
  }
  const phone = normalizePhone(phoneInput);
  if (!phone) {
    fields.phone = "Укажите мобильный номер в формате +7 9XX XXX-XX-XX.";
  }

  if (Object.keys(fields).length > 0 || !phone) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      planId,
      startDate,
      slot,
      city: MVP_CITY,
      street,
      house,
      apartment,
      comment,
      phone,
    },
  };
}

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
};

export function parseRegisterInput(
  raw: unknown,
): { ok: true; value: RegisterInput } | { ok: false; fields: FieldErrors } {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const fields: FieldErrors = {};
  const name = text(source.name);
  const email = text(source.email).toLowerCase();
  const password = typeof source.password === "string" ? source.password : "";
  const phone = normalizePhone(text(source.phone));

  if (name.length < 2 || name.length > 80) {
    fields.name = "Имя — от 2 до 80 символов.";
  }
  const emailError = validateEmail(email);
  if (emailError) {
    fields.email = emailError;
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    fields.password = passwordError;
  }
  if (!phone) {
    fields.phone = "Укажите мобильный номер в формате +7 9XX XXX-XX-XX.";
  }
  if (Object.keys(fields).length > 0 || !phone) {
    return { ok: false, fields };
  }
  return { ok: true, value: { name, email, password, phone } };
}

export function parseLoginInput(
  raw: unknown,
): { ok: true; value: { email: string; password: string } } | { ok: false; fields: FieldErrors } {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const fields: FieldErrors = {};
  const email = text(source.email).toLowerCase();
  const password = typeof source.password === "string" ? source.password : "";
  const emailError = validateEmail(email);
  if (emailError) {
    fields.email = emailError;
  }
  if (password.length < 1 || password.length > 72) {
    fields.password = "Введите пароль.";
  }
  if (Object.keys(fields).length > 0) {
    return { ok: false, fields };
  }
  return { ok: true, value: { email, password } };
}

export function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/rations";
  }
  return value;
}
