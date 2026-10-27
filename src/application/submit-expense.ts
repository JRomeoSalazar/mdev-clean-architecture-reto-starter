import type { EmployeeRepository } from "@/application/ports/employee-repository";
import type { ExpenseRepository } from "@/application/ports/expense-repository";
import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { Logger } from "@/application/ports/logger";
import type { Notifier } from "@/application/ports/notifier";
import { notifyResolution, type NotificationOutcome } from "@/application/notify-resolution";
import { DomainRuleViolation } from "@/domain/domain-rule-violation";
import { employeeId, type EmployeeId } from "@/domain/identifiers";
import { Expense, type ExpenseCategory, type ExpenseStatus } from "@/domain/expense";

export type SubmitExpenseInput = Readonly<{
  employeeId: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
}>;

export type SubmitExpenseResult =
  | {
      readonly ok: true;
      readonly expenseId: string;
      readonly status: ExpenseStatus;
      readonly notification: NotificationOutcome;
    }
  | {
      readonly ok: false;
      readonly reason: "employee_not_found" | "invalid_expense";
    };

export interface SubmitExpenseUseCase {
  execute(input: SubmitExpenseInput): Promise<SubmitExpenseResult>;
}

export class SubmitExpense implements SubmitExpenseUseCase {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly expenseRepository: ExpenseRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly logger: Logger,
  ) {}

  async execute(input: SubmitExpenseInput): Promise<SubmitExpenseResult> {
    const employee = await this.employeeRepository.findEmployeeById(employeeId(input.employeeId));

    if (!employee) {
      return { ok: false, reason: "employee_not_found" };
    }

    const expense = this.createExpense(employee.id, input);

    if (!expense) {
      return { ok: false, reason: "invalid_expense" };
    }

    await this.expenseRepository.saveExpense(expense);

    const notification = await notifyResolution(this.notifier, this.logger, expense);

    return {
      ok: true,
      expenseId: expense.id,
      status: expense.status,
      notification,
    };
  }

  private createExpense(owner: EmployeeId, input: SubmitExpenseInput): Expense | null {
    try {
      return Expense.create(
        this.ids.nextExpenseId(),
        owner,
        input.description,
        input.category,
        input.amount,
        this.clock.today(),
      );
    } catch (error) {
      if (error instanceof DomainRuleViolation) {
        return null;
      }

      throw error;
    }
  }
}
