import { describe, expect, test } from "bun:test";
import type { Notifier } from "@/application/ports/notifier";
import { SubmitExpense } from "@/application/submit-expense";
import { Employee } from "@/domain/employee";
import { employeeId, expenseId } from "@/domain/identifiers";
import { LocalDate } from "@/domain/local-date";
import {
  FailingNotifier,
  FakeEmployeeRepository,
  FakeExpenseRepository,
  FakeLogger,
  FakeNotifier,
  FixedClock,
  FixedIdGenerator,
} from "./fakes";

const today = LocalDate.parse("2026-10-27");
const EMPLOYEE_ID = "employee-1";

function setup(notifier: Notifier = new FakeNotifier()) {
  const expenses = new FakeExpenseRepository();
  const employees = new FakeEmployeeRepository([
    Employee.create(employeeId(EMPLOYEE_ID), "Ana", "employee"),
  ]);
  const logger = new FakeLogger();
  const useCase = new SubmitExpense(
    employees,
    expenses,
    notifier,
    new FixedClock(today),
    new FixedIdGenerator(),
    logger,
  );

  return { useCase, expenses, logger };
}

const input = (category: "meals" | "training" | "equipment" | "personal", amount: number) => ({
  employeeId: EMPLOYEE_ID,
  description: "Expense",
  category,
  amount,
});

describe("SubmitExpense", () => {
  test("approves meals of 45 euros and notifies the employee", async () => {
    const notifier = new FakeNotifier();
    const { useCase, expenses } = setup(notifier);

    const result = await useCase.execute(input("meals", 4_500));

    expect(result).toEqual({ ok: true, expenseId: "expense-1", status: "approved", notification: "sent" });
    expect(expenses.saved).toHaveLength(1);
    expect(notifier.sent).toEqual([
      { expenseId: expenseId("expense-1"), employeeId: employeeId(EMPLOYEE_ID), outcome: "approved" },
    ]);
  });

  test("rejects a personal expense and notifies the employee with the reason", async () => {
    const notifier = new FakeNotifier();
    const { useCase, expenses } = setup(notifier);

    const result = await useCase.execute(input("personal", 2_000));

    expect(result).toEqual({ ok: true, expenseId: "expense-1", status: "rejected", notification: "sent" });
    expect(expenses.saved).toHaveLength(1);
    expect(notifier.sent).toEqual([
      {
        expenseId: expenseId("expense-1"),
        employeeId: employeeId(EMPLOYEE_ID),
        outcome: "rejected",
        reason: "personal_expense_not_allowed",
      },
    ]);
  });

  test.each([
    ["training", 60_000, "manager"],
    ["equipment", 150_000, "finance"],
  ] as const)("leaves %s of %d cents pending for %s without notifying", async (category, amount, role) => {
    const notifier = new FakeNotifier();
    const { useCase, expenses } = setup(notifier);

    const result = await useCase.execute(input(category, amount));

    expect(result).toEqual({ ok: true, expenseId: "expense-1", status: "pending", notification: "not_required" });
    expect(expenses.saved[0]?.requiredRole).toBe(role);
    expect(notifier.sent).toEqual([]);
  });

  test("stamps the submission with the clock date", async () => {
    const { useCase, expenses } = setup();

    await useCase.execute(input("meals", 4_500));

    expect(expenses.saved[0]?.submittedOn.equals(today)).toBe(true);
  });

  test("returns employee_not_found without saving or notifying", async () => {
    const notifier = new FakeNotifier();
    const { useCase, expenses } = setup(notifier);

    const result = await useCase.execute({ ...input("meals", 4_500), employeeId: "unknown" });

    expect(result).toEqual({ ok: false, reason: "employee_not_found" });
    expect(expenses.saved).toEqual([]);
    expect(notifier.sent).toEqual([]);
  });

  test("keeps the expense saved and reports a failed notification", async () => {
    const { useCase, expenses } = setup(new FailingNotifier());

    const result = await useCase.execute(input("meals", 4_500));

    expect(result).toEqual({ ok: true, expenseId: "expense-1", status: "approved", notification: "failed" });
    expect(expenses.saved).toHaveLength(1);
  });

  test("logs the failed notification", async () => {
    const { useCase, logger } = setup(new FailingNotifier());

    await useCase.execute(input("meals", 4_500));

    expect(logger.errors).toEqual([
      {
        message: "Expense resolution notification failed",
        context: {
          expenseId: "expense-1",
          employeeId: EMPLOYEE_ID,
          cause: "notification service unavailable",
        },
      },
    ]);
  });

  test("does not log when the notification succeeds", async () => {
    const { useCase, logger } = setup();

    await useCase.execute(input("meals", 4_500));

    expect(logger.errors).toEqual([]);
  });

  test.each([
    ["an empty description", { description: "   " }],
    ["a zero amount", { amount: 0 }],
    ["a negative amount", { amount: -100 }],
    ["a non-integer amount", { amount: 10.5 }],
  ])("returns invalid_expense for %s without saving or notifying", async (_name, override) => {
    const notifier = new FakeNotifier();
    const { useCase, expenses } = setup(notifier);

    const result = await useCase.execute({ ...input("meals", 4_500), ...override });

    expect(result).toEqual({ ok: false, reason: "invalid_expense" });
    expect(expenses.saved).toEqual([]);
    expect(notifier.sent).toEqual([]);
  });
});
