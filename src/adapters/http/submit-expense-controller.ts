import type {
  SubmitExpenseInput,
  SubmitExpenseResult,
  SubmitExpenseUseCase,
} from "@/application/submit-expense";
import {
  HTTP_CREATED,
  HTTP_NOT_FOUND,
  HTTP_UNPROCESSABLE_ENTITY,
  invalidRequest,
  isNonEmptyString,
  isRecord,
  type HttpRequest,
  type HttpResponse,
} from "@/adapters/http/http";
import { isExpenseCategory } from "@/domain/expense";

function parseInput(body: unknown): SubmitExpenseInput | null {
  if (
    !isRecord(body) ||
    !isNonEmptyString(body.employeeId) ||
    typeof body.description !== "string" ||
    !isExpenseCategory(body.category) ||
    typeof body.amount !== "number"
  ) {
    return null;
  }

  return {
    employeeId: body.employeeId,
    description: body.description,
    category: body.category,
    amount: body.amount,
  };
}

export class SubmitExpenseController {
  constructor(private readonly submitExpense: SubmitExpenseUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const input = parseInput(request.body);

    if (!input) {
      return invalidRequest;
    }

    const result = await this.submitExpense.execute(input);

    if (result.ok) {
      return { status: HTTP_CREATED, body: result };
    }

    return { status: statusFor(result.reason), body: { error: result.reason } };
  }
}

function statusFor(reason: Extract<SubmitExpenseResult, { ok: false }>["reason"]): number {
  switch (reason) {
    case "employee_not_found":
      return HTTP_NOT_FOUND;
    case "invalid_expense":
      return HTTP_UNPROCESSABLE_ENTITY;
  }
}
