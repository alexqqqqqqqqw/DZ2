import "server-only";

import {
  isUuid,
  ORDER_STATUS_LABELS,
  parseOrderInput,
  slotLabel,
  type OrderStatus,
} from "@/lib/domain";
import type { Order } from "@/lib/types";
import { getPool, withUser } from "@/server/db";
import { AppError } from "@/server/errors";
import { log } from "@/server/logger";

type OrderRow = {
  id: string;
  plan_id: string;
  plan_name: string;
  duration_days: number;
  start_date: string;
  delivery_slot: string;
  city: string;
  street: string;
  house: string;
  apartment: string | null;
  comment: string | null;
  phone: string;
  status: OrderStatus;
  total_kopecks: number;
  created_at: Date;
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    planId: row.plan_id,
    planName: row.plan_name,
    durationDays: row.duration_days,
    startDate: row.start_date,
    deliverySlot: row.delivery_slot,
    slotLabel: slotLabel(row.delivery_slot),
    city: row.city,
    street: row.street,
    house: row.house,
    apartment: row.apartment,
    comment: row.comment,
    phone: row.phone,
    status: row.status,
    statusLabel: ORDER_STATUS_LABELS[row.status],
    totalKopecks: row.total_kopecks,
    createdAt: row.created_at.toISOString(),
  };
}

const ORDER_SELECT = `
  SELECT o.id, o.meal_plan_id AS plan_id, p.name AS plan_name, p.duration_days,
         to_char(o.start_date, 'YYYY-MM-DD') AS start_date,
         o.delivery_slot, o.city, o.street, o.house, o.apartment, o.comment, o.phone,
         o.status, o.total_kopecks, o.created_at
  FROM orders o
  JOIN meal_plans p ON p.id = o.meal_plan_id
`;

async function ownerOf(orderId: string): Promise<string | null> {
  const result = await getPool().query<{ owner: string | null }>(
    "SELECT app_order_owner($1) AS owner",
    [orderId],
  );
  return result.rows[0]?.owner ?? null;
}

export async function assertOrderAccess(userId: string, orderId: string): Promise<void> {
  if (!isUuid(orderId)) {
    throw new AppError(404, "not_found", "Заказ не найден.");
  }
  const owner = await ownerOf(orderId);
  if (!owner) {
    throw new AppError(404, "not_found", "Заказ не найден.");
  }
  if (owner !== userId) {
    await log("warning", "order_forbidden", { orderId }, userId);
    throw new AppError(403, "forbidden", "Этот заказ принадлежит другому аккаунту.");
  }
}

export async function createOrder(userId: string, raw: unknown, now = new Date()): Promise<Order> {
  const parsed = parseOrderInput(raw, now);
  if (!parsed.ok) {
    throw new AppError(400, "validation_error", "Проверьте поля заказа.", parsed.fields);
  }
  const order = await withUser(userId, async (client) => {
    const plan = await client.query<{ id: string; price_kopecks: number }>(
      "SELECT id, price_kopecks FROM meal_plans WHERE id = $1",
      [parsed.value.planId],
    );
    const price = plan.rows[0]?.price_kopecks;
    if (!price) {
      throw new AppError(400, "validation_error", "Проверьте поля заказа.", {
        planId: "Выберите набор из каталога.",
      });
    }
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO orders (
         user_id, meal_plan_id, start_date, delivery_slot, city, street, house,
         apartment, comment, phone, status, total_kopecks
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'awaiting_payment', $11
       ) RETURNING id`,
      [
        userId,
        parsed.value.planId,
        parsed.value.startDate,
        parsed.value.slot,
        parsed.value.city,
        parsed.value.street,
        parsed.value.house,
        parsed.value.apartment || null,
        parsed.value.comment || null,
        parsed.value.phone,
        price,
      ],
    );
    const id = inserted.rows[0]?.id;
    if (!id) {
      throw new AppError(500, "internal_error", "Не удалось сохранить заказ.");
    }
    const full = await client.query<OrderRow>(`${ORDER_SELECT} WHERE o.id = $1`, [id]);
    const row = full.rows[0];
    if (!row) {
      throw new AppError(500, "internal_error", "Не удалось прочитать заказ.");
    }
    return mapOrder(row);
  });
  await log("info", "order_created", { orderId: order.id, totalKopecks: order.totalKopecks }, userId);
  return order;
}

export async function listOrders(userId: string): Promise<Order[]> {
  return withUser(userId, async (client) => {
    const result = await client.query<OrderRow>(
      `${ORDER_SELECT} WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
      [userId],
    );
    return result.rows.map(mapOrder);
  });
}

export async function getOrder(userId: string, orderId: string): Promise<Order> {
  await assertOrderAccess(userId, orderId);
  return withUser(userId, async (client) => {
    const result = await client.query<OrderRow>(`${ORDER_SELECT} WHERE o.id = $1`, [orderId]);
    const row = result.rows[0];
    if (!row) {
      throw new AppError(404, "not_found", "Заказ не найден.");
    }
    return mapOrder(row);
  });
}

export async function markDelivered(userId: string, orderId: string): Promise<Order> {
  await assertOrderAccess(userId, orderId);
  const order = await withUser(userId, async (client) => {
    const current = await client.query<{ status: OrderStatus }>(
      "SELECT status FROM orders WHERE id = $1",
      [orderId],
    );
    const status = current.rows[0]?.status;
    if (!status) {
      throw new AppError(404, "not_found", "Заказ не найден.");
    }
    if (status === "delivered") {
      throw new AppError(409, "already_delivered", "Заказ уже отмечен полученным.");
    }
    if (status !== "paid") {
      throw new AppError(409, "not_paid", "Отметить получение можно только после успешной оплаты.");
    }
    await client.query("UPDATE orders SET status = 'delivered' WHERE id = $1", [orderId]);
    const result = await client.query<OrderRow>(`${ORDER_SELECT} WHERE o.id = $1`, [orderId]);
    const row = result.rows[0];
    if (!row) {
      throw new AppError(500, "internal_error", "Не удалось обновить заказ.");
    }
    return mapOrder(row);
  });
  await log("info", "order_delivered", { orderId }, userId);
  return order;
}
