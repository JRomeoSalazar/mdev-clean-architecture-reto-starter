import { InMemoryEmployeeRepository } from "@/adapters/persistence/in-memory-employee-repository";
import { InMemoryExpenseRepository } from "@/adapters/persistence/in-memory-expense-repository";
import { InMemoryNotifier } from "@/adapters/notifications/in-memory-notifier";
import { describe, expect, test } from "bun:test";
import type { Notifier } from "@/application/ports/notifier";
import { ApproveExpense } from "@/application/approve-expense";
import { employeeId, expenseId } from "@/domain/identifiers";
import {
  FailingNotifier,
  FakeLogger,
  FixedClock,
  resolutionFixture,
  seedPendingExpense,
} from "./fakes";

async function setup(options: { notifier?: Notifier; amount?: number } = {}) {
  const expenses = new InMemoryExpenseRepository();
  await seedPendingExpense(expenses, options.amount);
  const logger = new FakeLogger();
  const useCase = new ApproveExpense(
    new InMemoryEmployeeRepository(resolutionFixture.employees),
    expenses,
    options.notifier ?? new InMemoryNotifier(),
    new FixedClock(resolutionFixture.today),
    logger,
  );

  return { useCase, expenses, logger };
}

const approve = (actorId: string) => ({ expenseId: "expense-1", actorId });
const latest = (expenses: InMemoryExpenseRepository) => expenses.saved[expenses.saved.length - 1];

describe("ApproveExpense", () => {
  test("a manager approves a pending manager expense and the employee is notified", async () => {
    const notifier = new InMemoryNotifier();
    const { useCase, expenses } = await setup({ notifier });

    const result = await useCase.execute(approve("manager"));

    expect(result).toEqual({ ok: true, expenseId: "expense-1", status: "approved", notification: "sent" });
    expect(latest(expenses)?.state).toEqual({
      status: "approved",
      decidedBy: employeeId("manager"),
      decidedOn: resolutionFixture.today,
    });
    expect(notifier.sent).toEqual([
      { expenseId: expenseId("expense-1"), employeeId: resolutionFixture.ownerId, outcome: "approved" },
    ]);
  });

  test("finance approves an expense above 1000 euros", async () => {
    const { useCase } = await setup({ amount: 150_000 });

    const result = await useCase.execute(approve("finance"));

    expect(result).toMatchObject({ ok: true, status: "approved" });
  });

  test.each([
    ["a manager on a finance expense", "manager", 150_000, "forbidden_role"],
    ["the owner on their own expense", "owner", 60_000, "own_request"],
    ["finance on a manager expense", "finance", 60_000, "forbidden_role"],
  ] as const)("refuses %s without saving or notifying", async (_name, actorId, amount, reason) => {
    const notifier = new InMemoryNotifier();
    const { useCase, expenses } = await setup({ notifier, amount });

    const result = await useCase.execute(approve(actorId));

    expect(result).toEqual({ ok: false, reason });
    expect(expenses.saved).toHaveLength(1);
    expect(latest(expenses)?.status).toBe("pending");
    expect(notifier.sent).toEqual([]);
  });

  test("keeps the original decision of a resolved expense", async () => {
    const { useCase, expenses } = await setup();
    await useCase.execute(approve("manager"));

    const result = await useCase.execute(approve("manager"));

    expect(result).toEqual({ ok: false, reason: "already_resolved" });
    expect(expenses.saved).toHaveLength(1);
  });

  test("returns actor_not_found for an unknown actor", async () => {
    const { useCase } = await setup();

    expect(await useCase.execute(approve("unknown"))).toEqual({ ok: false, reason: "actor_not_found" });
  });

  test("returns expense_not_found for an unknown expense", async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ expenseId: "unknown", actorId: "manager" });

    expect(result).toEqual({ ok: false, reason: "expense_not_found" });
  });

  test("keeps the approval and logs when the notification fails", async () => {
    const { useCase, expenses, logger } = await setup({ notifier: new FailingNotifier() });

    const result = await useCase.execute(approve("manager"));

    expect(result).toEqual({ ok: true, expenseId: "expense-1", status: "approved", notification: "failed" });
    expect(latest(expenses)?.status).toBe("approved");
    expect(logger.errors).toHaveLength(1);
  });
});
