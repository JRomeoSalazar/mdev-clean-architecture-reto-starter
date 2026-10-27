import type { EmployeeRepository } from "@/application/ports/employee-repository";
import type { ExpenseRepository } from "@/application/ports/expense-repository";
import type { Clock } from "@/application/ports/clock";
import type { Logger } from "@/application/ports/logger";
import type { Notifier } from "@/application/ports/notifier";
import { notifyResolution, type NotificationOutcome } from "@/application/notify-resolution";
import { employeeId, expenseId } from "@/domain/identifiers";
import type { ExpenseStatus, ResolutionError } from "@/domain/expense";

export type RejectExpenseInput = Readonly<{
  expenseId: string;
  actorId: string;
  reason: string;
}>;

export type RejectExpenseResult =
  | {
      readonly ok: true;
      readonly expenseId: string;
      readonly status: ExpenseStatus;
      readonly notification: NotificationOutcome;
    }
  | {
      readonly ok: false;
      readonly reason: "actor_not_found" | "expense_not_found" | ResolutionError;
    };

export interface RejectExpenseUseCase {
  execute(input: RejectExpenseInput): Promise<RejectExpenseResult>;
}

export class RejectExpense implements RejectExpenseUseCase {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly expenseRepository: ExpenseRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
    private readonly logger: Logger,
  ) {}

  async execute(input: RejectExpenseInput): Promise<RejectExpenseResult> {
    const actor = await this.employeeRepository.findEmployeeById(employeeId(input.actorId));

    if (!actor) {
      return { ok: false, reason: "actor_not_found" };
    }

    const expense = await this.expenseRepository.findExpenseById(expenseId(input.expenseId));

    if (!expense) {
      return { ok: false, reason: "expense_not_found" };
    }

    const result = expense.reject(actor, this.clock.today(), input.reason);

    if (!result.ok) {
      return { ok: false, reason: result.reason };
    }

    await this.expenseRepository.saveExpense(result.expense);

    const notification = await notifyResolution(this.notifier, this.logger, result.expense);

    return {
      ok: true,
      expenseId: result.expense.id,
      status: result.expense.status,
      notification,
    };
  }
}
