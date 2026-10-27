import type { EmployeeId, ExpenseId } from "@/domain/identifiers";

export type ExpenseResolution = Readonly<{
  expenseId: ExpenseId;
  employeeId: EmployeeId;
  outcome: "approved" | "rejected";
  reason?: string;
}>;

export interface Notifier {
  notifyResolution(resolution: ExpenseResolution): Promise<void>;
}
