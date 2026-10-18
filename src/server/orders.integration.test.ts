import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { earliestDeliveryDate } from "@/lib/domain";

type Accounts = typeof import("@/server/accounts");
type Orders = typeof import("@/server/orders");
type Payments = typeof import("@/server/payments");
type Db = typeof import("@/server/db");

const weekPlan = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
const dayPlan = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";

let accounts: Accounts;
let orders: Orders;
let payments: Payments;
let db: Db;

function orderBody(planId: string, startDate: string, phone: string) {
  return {
    planId,
    startDate,
    slot: "14-18",
    city: "Москва",
    street: "Тверская",
    house: "7",
    apartment: "12",
    comment: "",
    phone,
  };
}

beforeAll(async () => {
  const url = new URL(process.env.DATABASE_URL ?? "");
  url.pathname = "/norma_test";
  process.env.DATABASE_URL = url.toString();
  accounts = await import("@/server/accounts");
  orders = await import("@/server/orders");
  payments = await import("@/server/payments");
  db = await import("@/server/db");
});

afterAll(async () => {
  await db.closePool();
});

describe("заказы и доступ", () => {
  it("сохраняет цену набора, прячет чужой заказ и проводит оплату", async () => {
    const stamp = Date.now();
    const userA = await accounts.registerAccount({
      name: "Мария Тестова",
      email: `a${stamp}@norma.test`,
      password: "Test1234",
      phone: "+79030001122",
    });
    const tooEarly = orders.createOrder(
      userA.id,
      orderBody(dayPlan, "2020-01-01", "+79030001122"),
    );
    await expect(tooEarly).rejects.toMatchObject({ status: 400, code: "validation_error" });

    const startDate = earliestDeliveryDate();
    const created = await orders.createOrder(userA.id, orderBody(weekPlan, startDate, "+79030001122"));
    expect(created.totalKopecks).toBe(549000);
    expect(created.status).toBe("awaiting_payment");

    const hidden = await db.getPool().query<{ count: number }>("SELECT count(*)::int AS count FROM orders");
    expect(hidden.rows[0]?.count).toBe(0);

    const userB = await accounts.registerAccount({
      name: "Илья Тестов",
      email: `b${stamp}@norma.test`,
      password: "Test1234",
      phone: "+79030001123",
    });
    await expect(orders.getOrder(userB.id, created.id)).rejects.toMatchObject({ status: 403, code: "forbidden" });

    const card = { number: "4000000000000002", expMonth: 12, expYear: 2030, cvv: "123" };
    await expect(payments.payForOrder(userA.id, created.id, card)).rejects.toMatchObject({
      status: 402,
      code: "payment_declined",
    });
    const failed = await orders.getOrder(userA.id, created.id);
    expect(failed.status).toBe("payment_failed");

    const paid = await payments.payForOrder(userA.id, created.id, {
      number: "4242424242424242",
      expMonth: 12,
      expYear: 2030,
      cvv: "123",
    });
    expect(paid.status).toBe("paid");

    const columns = await db.getPool().query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'payments' AND column_name IN ('number', 'pan', 'cvv')`,
    );
    expect(columns.rows).toHaveLength(0);

    const stored = await db.withUser(userA.id, async (client) =>
      client.query<{ last4: string }>(
        "SELECT last4 FROM payments WHERE order_id = $1 AND status = 'succeeded'",
        [created.id],
      ),
    );
    expect(stored.rows[0]?.last4).toBe("4242");

    const delivered = await orders.markDelivered(userA.id, created.id);
    expect(delivered.status).toBe("delivered");
  });

  it("не раскрывает каталог через подставленный slug", async () => {
    const { listPlans } = await import("@/server/catalog");
    const plans = await listPlans("balanced' OR '1'='1");
    expect(plans).toEqual([]);
  });
});
