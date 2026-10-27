import { DomainRuleViolation } from "@/domain/domain-rule-violation";
import type { Employee, EmployeeRole } from "@/domain/employee";
import type { EmployeeId, ExpenseId } from "@/domain/identifiers";
import type { LocalDate } from "@/domain/local-date";

export const AUTO_APPROVAL_LIMIT_CENTS = 10_000;
export const MANAGER_APPROVAL_LIMIT_CENTS = 100_000;
export const PERSONAL_EXPENSE_NOT_ALLOWED = "personal_expense_not_allowed";

export type ExpenseCategory =
  | "travel"
  | "meals"
  | "equipment"
  | "training"
  | "personal";

export type RequiredRole = Extract<EmployeeRole, "manager" | "finance">;

export type Decider = "system" | EmployeeId;

export type ExpenseState =
  | { readonly status: "pending" }
  | {
      readonly status: "approved";
      readonly decidedBy: Decider;
      readonly decidedOn: LocalDate;
    }
  | {
      readonly status: "rejected";
      readonly decidedBy: Decider;
      readonly decidedOn: LocalDate;
      readonly reason: string;
    };

export type ExpenseStatus = ExpenseState["status"];

export type ResolutionError =
  | "already_resolved"
  | "own_request"
  | "forbidden_role"
  | "reason_required";

export type ResolutionResult =
  | { readonly ok: true; readonly expense: Expense }
  | { readonly ok: false; readonly reason: ResolutionError };

export class Expense {
  private constructor(
    readonly id: ExpenseId,
    readonly employeeId: EmployeeId,
    readonly description: string,
    readonly category: ExpenseCategory,
    readonly amount: number,
    readonly submittedOn: LocalDate,
    readonly state: ExpenseState,
  ) {}

  static create(
    id: ExpenseId,
    employeeId: EmployeeId,
    description: string,
    category: ExpenseCategory,
    amount: number,
    today: LocalDate,
  ): Expense {
    if (description.trim().length === 0) {
      throw new DomainRuleViolation("Expense description cannot be empty");
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new DomainRuleViolation("Expense amount must be a positive integer");
    }

    return new Expense(
      id,
      employeeId,
      description.trim(),
      category,
      amount,
      today,
      initialState(category, amount, today),
    );
  }

  get status(): ExpenseStatus {
    return this.state.status;
  }

  get requiredRole(): RequiredRole {
    return this.amount <= MANAGER_APPROVAL_LIMIT_CENTS ? "manager" : "finance";
  }

  approve(actor: Employee, today: LocalDate): ResolutionResult {
    const error = this.checkCanBeResolvedBy(actor);

    if (error) {
      return { ok: false, reason: error };
    }

    return this.resolvedAs({
      status: "approved",
      decidedBy: actor.id,
      decidedOn: today,
    });
  }

  reject(actor: Employee, today: LocalDate, reason: string): ResolutionResult {
    const error = this.checkCanBeResolvedBy(actor);

    if (error) {
      return { ok: false, reason: error };
    }

    if (reason.trim().length === 0) {
      return { ok: false, reason: "reason_required" };
    }

    return this.resolvedAs({
      status: "rejected",
      decidedBy: actor.id,
      decidedOn: today,
      reason: reason.trim(),
    });
  }

  private checkCanBeResolvedBy(actor: Employee): ResolutionError | null {
    if (this.state.status !== "pending") {
      return "already_resolved";
    }

    if (actor.id === this.employeeId) {
      return "own_request";
    }

    if (actor.role !== this.requiredRole) {
      return "forbidden_role";
    }

    return null;
  }

  private resolvedAs(state: ExpenseState): ResolutionResult {
    return {
      ok: true,
      expense: new Expense(
        this.id,
        this.employeeId,
        this.description,
        this.category,
        this.amount,
        this.submittedOn,
        state,
      ),
    };
  }
}

function initialState(
  category: ExpenseCategory,
  amount: number,
  today: LocalDate,
): ExpenseState {
  if (category === "personal") {
    return {
      status: "rejected",
      decidedBy: "system",
      decidedOn: today,
      reason: PERSONAL_EXPENSE_NOT_ALLOWED,
    };
  }

  if (amount <= AUTO_APPROVAL_LIMIT_CENTS) {
    return { status: "approved", decidedBy: "system", decidedOn: today };
  }

  return { status: "pending" };
}
