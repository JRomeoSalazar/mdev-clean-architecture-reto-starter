import type {
  ApproveExpenseInput,
  ApproveExpenseUseCase,
} from "@/application/approve-expense";
import {
  HTTP_OK,
  invalidRequest,
  isNonEmptyString,
  isRecord,
  resolveFailureStatus,
  type HttpRequest,
  type HttpResponse,
} from "@/adapters/http/http";

function parseInput(body: unknown): ApproveExpenseInput | null {
  if (
    !isRecord(body) ||
    !isNonEmptyString(body.expenseId) ||
    !isNonEmptyString(body.actorId)
  ) {
    return null;
  }

  return { expenseId: body.expenseId, actorId: body.actorId };
}

export class ApproveExpenseController {
  constructor(private readonly approveExpense: ApproveExpenseUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const input = parseInput(request.body);

    if (!input) {
      return invalidRequest;
    }

    const result = await this.approveExpense.execute(input);

    if (result.ok) {
      return { status: HTTP_OK, body: result };
    }

    return { status: resolveFailureStatus(result.reason), body: { error: result.reason } };
  }
}
