import type { Logger } from "@/application/ports/logger";
import type { ExpenseResolution, Notifier } from "@/application/ports/notifier";
import type { Expense } from "@/domain/expense";

export type NotificationOutcome = "sent" | "failed" | "not_required";

// The expense is already saved: a failed notification must not hide that.
export async function notifyResolution(
  notifier: Notifier,
  logger: Logger,
  expense: Expense,
): Promise<NotificationOutcome> {
  const resolution = toResolution(expense);

  if (!resolution) {
    return "not_required";
  }

  try {
    await notifier.notifyResolution(resolution);
    return "sent";
  } catch (error) {
    logger.error("Expense resolution notification failed", {
      expenseId: resolution.expenseId,
      employeeId: resolution.employeeId,
      cause: error instanceof Error ? error.message : String(error),
    });
    return "failed";
  }
}

function toResolution(expense: Expense): ExpenseResolution | null {
  const { state } = expense;

  switch (state.status) {
    case "pending":
      return null;
    case "approved":
      return {
        expenseId: expense.id,
        employeeId: expense.employeeId,
        outcome: "approved",
      };
    case "rejected":
      return {
        expenseId: expense.id,
        employeeId: expense.employeeId,
        outcome: "rejected",
        reason: state.reason,
      };
  }
}
