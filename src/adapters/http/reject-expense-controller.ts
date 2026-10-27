import type {
  RejectExpenseInput,
  RejectExpenseUseCase,
} from "@/application/reject-expense";
import {
  HTTP_OK,
  invalidRequest,
  isNonEmptyString,
  isRecord,
  resolveFailureStatus,
  type HttpRequest,
  type HttpResponse,
} from "@/adapters/http/http";

function parseInput(body: unknown): RejectExpenseInput | null {
  if (
    !isRecord(body) ||
    !isNonEmptyString(body.expenseId) ||
    !isNonEmptyString(body.actorId)
  ) {
    return null;
  }

  // A missing reason is a business outcome (reason_required), not a malformed request.
  const reason = typeof body.reason === "string" ? body.reason : "";

  return { expenseId: body.expenseId, actorId: body.actorId, reason };
}

export class RejectExpenseController {
  constructor(private readonly rejectExpense: RejectExpenseUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const input = parseInput(request.body);

    if (!input) {
      return invalidRequest;
    }

    const result = await this.rejectExpense.execute(input);

    if (result.ok) {
      return { status: HTTP_OK, body: result };
    }

    return { status: resolveFailureStatus(result.reason), body: { error: result.reason } };
  }
}
