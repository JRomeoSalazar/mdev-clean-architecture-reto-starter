import { DomainRuleViolation } from "@/domain/domain-rule-violation";

export type EmployeeId = string & { readonly __brand: "EmployeeId" };
export type ExpenseId = string & { readonly __brand: "ExpenseId" };

function createIdentifier<T extends string>(value: string, name: string): T {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new DomainRuleViolation(`${name} cannot be empty`);
  }

  return normalized as T;
}

export const employeeId = (value: string): EmployeeId =>
  createIdentifier<EmployeeId>(value, "Employee id");

export const expenseId = (value: string): ExpenseId =>
  createIdentifier<ExpenseId>(value, "Expense id");
