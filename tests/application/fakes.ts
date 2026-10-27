import type { Clock } from "@/application/ports/clock";
import type { ExpenseRepository } from "@/application/ports/expense-repository";
import type { LogContext, Logger } from "@/application/ports/logger";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { Notifier } from "@/application/ports/notifier";
import { Employee } from "@/domain/employee";
import { Expense } from "@/domain/expense";
import { employeeId, expenseId, type ExpenseId } from "@/domain/identifiers";
import { LocalDate } from "@/domain/local-date";

export class FailingNotifier implements Notifier {
  async notifyResolution(): Promise<void> {
    throw new Error("notification service unavailable");
  }
}

export class FixedClock implements Clock {
  constructor(private readonly date: LocalDate) {}

  today(): LocalDate {
    return this.date;
  }
}

export class FixedIdGenerator implements IdGenerator {
  nextExpenseId(): ExpenseId {
    return expenseId("expense-1");
  }
}

export class FakeLogger implements Logger {
  readonly errors: { message: string; context?: LogContext }[] = [];

  error(message: string, context?: LogContext): void {
    this.errors.push(context ? { message, context } : { message });
  }
}

export const resolutionFixture = {
  today: LocalDate.parse("2026-10-27"),
  ownerId: employeeId("owner"),
  employees: [
    Employee.create(employeeId("owner"), "Owner", "employee"),
    Employee.create(employeeId("manager"), "Manager", "manager"),
    Employee.create(employeeId("finance"), "Finance", "finance"),
  ],
};

export async function seedPendingExpense(
  expenses: ExpenseRepository,
  amount = 60_000,
): Promise<Expense> {
  const expense = Expense.create(
    expenseId("expense-1"),
    resolutionFixture.ownerId,
    "Training",
    "training",
    amount,
    resolutionFixture.today,
  );
  await expenses.saveExpense(expense);
  return expense;
}
