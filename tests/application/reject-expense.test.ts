import { describe, expect, test } from "bun:test";
import type { Notifier } from "@/application/ports/notifier";
import { RejectExpense } from "@/application/reject-expense";
import { employeeId, expenseId } from "@/domain/identifiers";
import {
  FailingNotifier,
  FakeEmployeeRepository,
  FakeExpenseRepository,
  FakeLogger,
  FakeNotifier,
  FixedClock,
  resolutionFixture,
  seedPendingExpense,
} from "./fakes";

async function setup(options: { notifier?: Notifier; amount?: number } = {}) {
  const expenses = new FakeExpenseRepository();
  await seedPendingExpense(expenses, options.amount);
  const logger = new FakeLogger();
  const useCase = new RejectExpense(
    new FakeEmployeeRepository(resolutionFixture.employees),
    expenses,
    options.notifier ?? new FakeNotifier(),
    new FixedClock(resolutionFixture.today),
    logger,
  );

  return { useCase, expenses, logger };
}

const reject = (actorId: string, reason = "Missing receipt") => ({
  expenseId: "expense-1",
  actorId,
  reason,
});
const latest = (expenses: FakeExpenseRepository) => expenses.saved[expenses.saved.length - 1];

describe("RejectExpense", () => {
  test("a manager rejects a pending expense and the employee is notified with the reason", async () => {
    const notifier = new FakeNotifier();
    const { useCase, expenses } = await setup({ notifier });

    const result = await useCase.execute(reject("manager"));

    expect(result).toEqual({ ok: true, expenseId: "expense-1", status: "rejected", notification: "sent" });
    expect(latest(expenses)?.state).toEqual({
      status: "rejected",
      decidedBy: employeeId("manager"),
      decidedOn: resolutionFixture.today,
      reason: "Missing receipt",
    });
    expect(notifier.sent).toEqual([
      {
        expenseId: expenseId("expense-1"),
        employeeId: resolutionFixture.ownerId,
        outcome: "rejected",
        reason: "Missing receipt",
      },
    ]);
  });

  test("a rejection without reason does not modify the expense", async () => {
    const notifier = new FakeNotifier();
    const { useCase, expenses } = await setup({ notifier });

    const result = await useCase.execute(reject("manager", "   "));

    expect(result).toEqual({ ok: false, reason: "reason_required" });
    expect(expenses.saved).toHaveLength(1);
    expect(latest(expenses)?.status).toBe("pending");
    expect(notifier.sent).toEqual([]);
  });

  test.each([
    ["a manager on a finance expense", "manager", 150_000, "forbidden_role"],
    ["the owner on their own expense", "owner", 60_000, "own_request"],
  ] as const)("refuses %s without saving or notifying", async (_name, actorId, amount, reason) => {
    const notifier = new FakeNotifier();
    const { useCase, expenses } = await setup({ notifier, amount });

    const result = await useCase.execute(reject(actorId));

    expect(result).toEqual({ ok: false, reason });
    expect(expenses.saved).toHaveLength(1);
    expect(notifier.sent).toEqual([]);
  });

  test("keeps the original decision of a resolved expense", async () => {
    const { useCase, expenses } = await setup();
    await useCase.execute(reject("manager", "First reason"));

    const result = await useCase.execute(reject("manager", "Second reason"));

    expect(result).toEqual({ ok: false, reason: "already_resolved" });
    expect(expenses.saved).toHaveLength(1);
    expect(latest(expenses)?.state).toMatchObject({ reason: "First reason" });
  });

  test("returns actor_not_found for an unknown actor", async () => {
    const { useCase } = await setup();

    expect(await useCase.execute(reject("unknown"))).toEqual({ ok: false, reason: "actor_not_found" });
  });

  test("returns expense_not_found for an unknown expense", async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ expenseId: "unknown", actorId: "manager", reason: "x" });

    expect(result).toEqual({ ok: false, reason: "expense_not_found" });
  });

  test("keeps the rejection and logs when the notification fails", async () => {
    const { useCase, expenses, logger } = await setup({ notifier: new FailingNotifier() });

    const result = await useCase.execute(reject("manager"));

    expect(result).toEqual({ ok: true, expenseId: "expense-1", status: "rejected", notification: "failed" });
    expect(latest(expenses)?.status).toBe("rejected");
    expect(logger.errors).toHaveLength(1);
  });
});
