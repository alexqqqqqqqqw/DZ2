import "server-only";

import type { Diet, Meal, PlanDetail, PlanSummary } from "@/lib/types";
import { getPool } from "@/server/db";
import { AppError } from "@/server/errors";

type DietRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  kcal_min: number;
  kcal_max: number;
  price_from: number | null;
};

type PlanRow = {
  id: string;
  diet_slug: string;
  diet_name: string;
  name: string;
  duration_days: number;
  price_kopecks: number;
  description: string;
  kcal_per_day: number;
  meals_per_day: number;
};

function mapPlan(row: PlanRow): PlanSummary {
  return {
    id: row.id,
    dietSlug: row.diet_slug,
    dietName: row.diet_name,
    name: row.name,
    durationDays: row.duration_days,
    priceKopecks: row.price_kopecks,
    description: row.description,
    kcalPerDay: row.kcal_per_day,
    mealsPerDay: row.meals_per_day,
  };
}

export async function listDiets(): Promise<Diet[]> {
  const result = await getPool().query<DietRow>(
    `SELECT d.id, d.slug, d.name, d.description, d.kcal_min, d.kcal_max,
            MIN(p.price_kopecks) AS price_from
     FROM diet_types d
     LEFT JOIN meal_plans p ON p.diet_type_id = d.id
     GROUP BY d.id
     ORDER BY d.sort_order`,
  );
  return result.rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    kcalMin: row.kcal_min,
    kcalMax: row.kcal_max,
    priceFromKopecks: row.price_from ?? 0,
  }));
}

export async function listPlans(dietSlug?: string): Promise<PlanSummary[]> {
  const result = await getPool().query<PlanRow>(
    `SELECT p.id, d.slug AS diet_slug, d.name AS diet_name, p.name, p.duration_days,
            p.price_kopecks, p.description, p.kcal_per_day, p.meals_per_day
     FROM meal_plans p
     JOIN diet_types d ON d.id = p.diet_type_id
     WHERE ($1::text IS NULL OR d.slug = $1)
     ORDER BY d.sort_order, p.duration_days`,
    [dietSlug ?? null],
  );
  return result.rows.map(mapPlan);
}

export async function getPlan(id: string): Promise<PlanDetail> {
  const plans = await getPool().query<PlanRow>(
    `SELECT p.id, d.slug AS diet_slug, d.name AS diet_name, p.name, p.duration_days,
            p.price_kopecks, p.description, p.kcal_per_day, p.meals_per_day
     FROM meal_plans p
     JOIN diet_types d ON d.id = p.diet_type_id
     WHERE p.id = $1`,
    [id],
  );
  const plan = plans.rows[0];
  if (!plan) {
    throw new AppError(404, "not_found", "Набор не найден.");
  }
  const meals = await getPool().query<{
    day_index: number;
    slot: Meal["slot"];
    title: string;
    description: string;
    kcal: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
  }>(
    `SELECT day_index, slot, title, description, kcal, protein_g, fat_g, carbs_g
     FROM meals
     WHERE meal_plan_id = $1
     ORDER BY day_index,
       CASE slot
         WHEN 'breakfast' THEN 1
         WHEN 'lunch' THEN 2
         WHEN 'snack' THEN 3
         WHEN 'dinner' THEN 4
       END`,
    [id],
  );
  return {
    ...mapPlan(plan),
    meals: meals.rows.map((meal) => ({
      dayIndex: meal.day_index,
      slot: meal.slot,
      title: meal.title,
      description: meal.description,
      kcal: meal.kcal,
      proteinG: meal.protein_g,
      fatG: meal.fat_g,
      carbsG: meal.carbs_g,
    })),
  };
}
