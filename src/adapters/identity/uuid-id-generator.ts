import type { IdGenerator } from "@/application/ports/id-generator";
import { expenseId, type ExpenseId } from "@/domain/identifiers";

export class UuidIdGenerator implements IdGenerator {
  nextExpenseId(): ExpenseId {
    return expenseId(crypto.randomUUID());
  }
}
