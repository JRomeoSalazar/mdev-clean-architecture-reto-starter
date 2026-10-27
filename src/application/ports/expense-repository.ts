import type { Expense } from "@/domain/expense";
import type { ExpenseId } from "@/domain/identifiers";

export interface ExpenseRepository {
  findExpenseById(id: ExpenseId): Promise<Expense | null>;
  saveExpense(expense: Expense): Promise<void>;
}
