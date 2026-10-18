import "server-only";

import { inspectCard } from "@/lib/domain";
import type { Order } from "@/lib/types";
import { withUser } from "@/server/db";
import { AppError } from "@/server/errors";
import { log } from "@/server/logger";
import { assertOrderAccess, getOrder } from "@/server/orders";

type CardBody = {
  number?: unknown;
  expMonth?: unknown;
  expYear?: unknown;
  cvv?: unknown;
};

function readCard(raw: unknown, now: Date) {
  const source = raw && typeof raw === "object" ? (raw as CardBody) : {};
  const expMonth = Number(source.expMonth);
  const expYear = Number(source.expYear);
  return inspectCard(
    {
      number: typeof source.number === "string" ? source.number : "",
      expMonth,
      expYear,
      cvv: typeof source.cvv === "string" ? source.cvv : "",
    },
    now,
  );
}

export async function payForOrder(
  userId: string,
  orderId: string,
  raw: unknown,
  now = new Date(),
): Promise<Order> {
  await assertOrderAccess(userId, orderId);
  const card = readCard(raw, now);
  if (!card.ok && card.reason !== "declined") {
    const fields: Record<string, string> =
      card.reason === "invalid_number"
        ? { number: "Номер карты должен содержать 16 цифр и проходить проверку Луна." }
        : card.reason === "expired"
          ? { expMonth: "Срок действия карты уже прошёл." }
          : { cvv: "CVV — это 3 цифры." };
    throw new AppError(400, "validation_error", "Проверьте данные карты.", fields);
  }

  const outcome = await withUser(userId, async (client) => {
    const locked = await client.query<{ status: string; total_kopecks: number }>(
      "SELECT status, total_kopecks FROM orders WHERE id = $1 FOR UPDATE",
      [orderId],
    );
    const order = locked.rows[0];
    if (!order) {
      throw new AppError(404, "not_found", "Заказ не найден.");
    }
    if (order.status === "paid" || order.status === "delivered") {
      throw new AppError(409, "already_paid", "Этот заказ уже оплачен.");
    }
    if (order.status !== "awaiting_payment" && order.status !== "payment_failed") {
      throw new AppError(409, "not_payable", "Этот заказ нельзя оплатить.");
    }

    if (!card.ok) {
      await client.query(
        `INSERT INTO payments (order_id, status, last4, amount_kopecks, failure_reason)
         VALUES ($1, 'declined', $2, $3, 'declined')`,
        [orderId, card.last4, order.total_kopecks],
      );
      await client.query("UPDATE orders SET status = 'payment_failed' WHERE id = $1", [orderId]);
      return "declined" as const;
    }

    await client.query(
      `INSERT INTO payments (order_id, status, last4, amount_kopecks)
       VALUES ($1, 'succeeded', $2, $3)`,
      [orderId, card.last4, order.total_kopecks],
    );
    await client.query("UPDATE orders SET status = 'paid' WHERE id = $1", [orderId]);
    return "paid" as const;
  });

  if (outcome === "declined") {
    await log("warning", "payment_declined", { orderId }, userId);
    throw new AppError(402, "payment_declined", "Банк отклонил карту. Заказ не оплачен.");
  }
  await log("info", "payment_succeeded", { orderId }, userId);
  return getOrder(userId, orderId);
}
