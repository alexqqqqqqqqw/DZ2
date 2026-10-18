import type { MealSlot, OrderStatus } from "@/lib/domain";

export type Diet = {
  id: string;
  slug: string;
  name: string;
  description: string;
  kcalMin: number;
  kcalMax: number;
  priceFromKopecks: number;
};

export type PlanSummary = {
  id: string;
  dietSlug: string;
  dietName: string;
  name: string;
  durationDays: number;
  priceKopecks: number;
  description: string;
  kcalPerDay: number;
  mealsPerDay: number;
};

export type Meal = {
  dayIndex: number;
  slot: MealSlot;
  title: string;
  description: string;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

export type PlanDetail = PlanSummary & { meals: Meal[] };

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
};

export type Order = {
  id: string;
  planId: string;
  planName: string;
  durationDays: number;
  startDate: string;
  deliverySlot: string;
  slotLabel: string;
  city: string;
  street: string;
  house: string;
  apartment: string | null;
  comment: string | null;
  phone: string;
  status: OrderStatus;
  statusLabel: string;
  totalKopecks: number;
  createdAt: string;
};
