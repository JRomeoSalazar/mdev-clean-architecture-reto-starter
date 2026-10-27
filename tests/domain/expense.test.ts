import { describe, expect, test } from "bun:test";
import { DomainRuleViolation } from "@/domain/domain-rule-violation";
import { Employee, type EmployeeRole } from "@/domain/employee";
import { Expense, type ExpenseCategory } from "@/domain/expense";
import { employeeId, expenseId } from "@/domain/identifiers";
import { LocalDate } from "@/domain/local-date";

const today = LocalDate.parse("2026-10-26");
const OWNER = employeeId("owner");

const submit = (category: ExpenseCategory, amount: number) =>
  Expense.create(expenseId("e1"), OWNER, "Lunch", category, amount, today);

const actor = (id: string, role: EmployeeRole) =>
  Employee.create(employeeId(id), id, role);

describe("Expense submission", () => {
  test("approves meals of 45 euros automatically", () => {
    const expense = submit("meals", 4_500);
    expect(expense.state).toEqual({ status: "approved", decidedBy: "system", decidedOn: today });
  });

  test("keeps training of 600 euros pending for a manager", () => {
    const expense = submit("training", 60_000);
    expect(expense.status).toBe("pending");
    expect(expense.requiredRole).toBe("manager");
  });

  test("keeps equipment of 1500 euros pending for finance", () => {
    const expense = submit("equipment", 150_000);
    expect(expense.status).toBe("pending");
    expect(expense.requiredRole).toBe("finance");
  });

  test("rejects personal expenses automatically", () => {
    const expense = submit("personal", 2_000);
    expect(expense.state).toEqual({
      status: "rejected",
      decidedBy: "system",
      decidedOn: today,
      reason: "personal_expense_not_allowed",
    });
  });

  test("rejects invalid description and amount", () => {
    expect(() => submit("meals", 0)).toThrow(DomainRuleViolation);
    expect(() => Expense.create(expenseId("e1"), OWNER, "  ", "meals", 100, today)).toThrow(DomainRuleViolation);
  });
});

describe("Expense resolution", () => {
  test("a manager approves a pending manager expense", () => {
    const result = submit("training", 60_000).approve(actor("m1", "manager"), today);
    expect(result.ok && result.expense.status).toBe("approved");
  });

  test("a manager cannot resolve a finance expense", () => {
    const result = submit("equipment", 150_000).approve(actor("m1", "manager"), today);
    expect(result).toEqual({ ok: false, reason: "forbidden_role" });
  });

  test("the owner cannot resolve their own expense", () => {
    const result = submit("training", 60_000).approve(actor("owner", "manager"), today);
    expect(result).toEqual({ ok: false, reason: "own_request" });
  });

  test("a resolved expense cannot be resolved again", () => {
    const approved = submit("training", 60_000).approve(actor("m1", "manager"), today);
    if (!approved.ok) throw new Error("expected approval");
    const result = approved.expense.reject(actor("m2", "manager"), today, "late");
    expect(result).toEqual({ ok: false, reason: "already_resolved" });
  });

  test("manual rejection requires a reason", () => {
    const expense = submit("training", 60_000);
    expect(expense.reject(actor("m1", "manager"), today, "  ")).toEqual({ ok: false, reason: "reason_required" });
    expect(expense.status).toBe("pending");
  });

  test("manual rejection records actor, date and reason", () => {
    const result = submit("training", 60_000).reject(actor("m1", "manager"), today, "No budget");
    expect(result.ok && result.expense.state).toEqual({
      status: "rejected",
      decidedBy: employeeId("m1"),
      decidedOn: today,
      reason: "No budget",
    });
  });
});
