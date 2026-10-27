import type { ExpenseRepository } from "@/application/ports/expense-repository";
import type { Expense } from "@/domain/expense";
import type { ExpenseId } from "@/domain/identifiers";

export class InMemoryExpenseRepository implements ExpenseRepository {
  private readonly expenses = new Map<ExpenseId, Expense>();

  get saved(): readonly Expense[] {
    return [...this.expenses.values()];
  }

  async findExpenseById(id: ExpenseId): Promise<Expense | null> {
    return this.expenses.get(id) ?? null;
  }

  async saveExpense(expense: Expense): Promise<void> {
    this.expenses.set(expense.id, expense);
  }
}
