import { describe, expect, test } from "bun:test";
import { InMemoryExpenseRepository } from "@/adapters/persistence/in-memory-expense-repository";
import { Employee } from "@/domain/employee";
import { Expense } from "@/domain/expense";
import { employeeId, expenseId } from "@/domain/identifiers";
import { LocalDate } from "@/domain/local-date";

const today = LocalDate.parse("2026-10-27");
const pending = Expense.create(expenseId("e1"), employeeId("ana"), "Training", "training", 60_000, today);

describe("InMemoryExpenseRepository", () => {
  test("returns null for an unknown expense", async () => {
    expect(await new InMemoryExpenseRepository().findExpenseById(expenseId("e1"))).toBeNull();
  });

  test("saves and finds an expense", async () => {
    const repository = new InMemoryExpenseRepository();

    await repository.saveExpense(pending);

    expect(await repository.findExpenseById(expenseId("e1"))).toBe(pending);
  });

  test("replaces the stored expense when it is saved again", async () => {
    const repository = new InMemoryExpenseRepository();
    const manager = Employee.create(employeeId("marta"), "Marta", "manager");
    const approved = pending.approve(manager, today);
    if (!approved.ok) throw new Error("expected approval");

    await repository.saveExpense(pending);
    await repository.saveExpense(approved.expense);

    expect(repository.saved).toHaveLength(1);
    expect((await repository.findExpenseById(expenseId("e1")))?.status).toBe("approved");
  });
});
