import { describe, expect, test } from "bun:test";
import type { HttpResponse } from "@/adapters/http/http";
import { InMemoryNotifier } from "@/adapters/notifications/in-memory-notifier";
import type { Router } from "@/adapters/http/router";
import { composeApp } from "@/main";
import { employeeId, expenseId } from "@/domain/identifiers";
import { LocalDate } from "@/domain/local-date";
import { FixedClock, FakeLogger } from "./application/fakes";

function setup() {
  const notifier = new InMemoryNotifier();
  let counter = 0;
  const router = composeApp({
    notifier,
    clock: new FixedClock(LocalDate.parse("2026-10-27")),
    ids: { nextExpenseId: () => expenseId(`expense-${++counter}`) },
    logger: new FakeLogger(),
  });

  return { router, notifier };
}

const post = (router: Router, path: string, body: unknown): Promise<HttpResponse> =>
  router.handle({ method: "POST", path, body });

const submit = (router: Router, category: string, amount: number) =>
  post(router, "/expenses", { employeeId: "ana", description: "Expense", category, amount });

describe("Expense approval through the composed application", () => {
  test("an inexpensive meal is approved by the system and the employee is notified", async () => {
    const { router, notifier } = setup();

    const response = await submit(router, "meals", 4_500);

    expect(response).toEqual({
      status: 201,
      body: { ok: true, expenseId: "expense-1", status: "approved", notification: "sent" },
    });
    expect(notifier.sent).toEqual([
      { expenseId: expenseId("expense-1"), employeeId: employeeId("ana"), outcome: "approved" },
    ]);
  });

  test("a personal expense is rejected by the system and the employee is notified", async () => {
    const { router, notifier } = setup();

    const response = await submit(router, "personal", 2_000);

    expect(response.body).toMatchObject({ status: "rejected" });
    expect(notifier.sent).toMatchObject([{ outcome: "rejected", reason: "personal_expense_not_allowed" }]);
  });

  test("training of 600 euros stays pending until a manager approves it", async () => {
    const { router, notifier } = setup();

    const submitted = await submit(router, "training", 60_000);
    expect(submitted.body).toMatchObject({ status: "pending", notification: "not_required" });
    expect(notifier.sent).toEqual([]);

    const approved = await post(router, "/expenses/expense-1/approve", { actorId: "marta" });

    expect(approved).toEqual({
      status: 200,
      body: { ok: true, expenseId: "expense-1", status: "approved", notification: "sent" },
    });
    expect(notifier.sent).toHaveLength(1);
  });

  test("a manager cannot resolve an expense that requires finance, but finance can", async () => {
    const { router } = setup();
    await submit(router, "equipment", 150_000);

    const byManager = await post(router, "/expenses/expense-1/approve", { actorId: "marta" });
    const byFinance = await post(router, "/expenses/expense-1/approve", { actorId: "felix" });

    expect(byManager).toEqual({ status: 403, body: { error: "forbidden_role" } });
    expect(byFinance.status).toBe(200);
  });

  test("the employee cannot approve their own expense and it remains pending", async () => {
    const { router, notifier } = setup();
    await submit(router, "training", 60_000);

    const response = await post(router, "/expenses/expense-1/approve", { actorId: "ana" });
    const retry = await post(router, "/expenses/expense-1/reject", { actorId: "marta", reason: "No budget" });

    expect(response).toEqual({ status: 403, body: { error: "own_request" } });
    expect(retry.body).toMatchObject({ status: "rejected" });
    expect(notifier.sent).toHaveLength(1);
  });

  test("a resolved expense keeps its original decision", async () => {
    const { router } = setup();
    await submit(router, "training", 60_000);
    await post(router, "/expenses/expense-1/approve", { actorId: "marta" });

    const response = await post(router, "/expenses/expense-1/reject", { actorId: "marta", reason: "Changed mind" });

    expect(response).toEqual({ status: 409, body: { error: "already_resolved" } });
  });

  test("a manual rejection without reason is refused and the expense can still be resolved", async () => {
    const { router } = setup();
    await submit(router, "training", 60_000);

    const withoutReason = await post(router, "/expenses/expense-1/reject", { actorId: "marta" });
    const approved = await post(router, "/expenses/expense-1/approve", { actorId: "marta" });

    expect(withoutReason).toEqual({ status: 422, body: { error: "reason_required" } });
    expect(approved.status).toBe(200);
  });

  test("unknown expense and invalid amount are reported", async () => {
    const { router } = setup();

    const unknown = await post(router, "/expenses/missing/approve", { actorId: "marta" });
    const invalid = await submit(router, "meals", 0);

    expect(unknown).toEqual({ status: 404, body: { error: "expense_not_found" } });
    expect(invalid).toEqual({ status: 422, body: { error: "invalid_expense" } });
  });
});
