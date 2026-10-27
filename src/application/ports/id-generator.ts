import type { ExpenseId } from "@/domain/identifiers";

export interface IdGenerator {
  nextExpenseId(): ExpenseId;
}
