import { describe, expect, test } from "bun:test";
import { ApproveExpenseController } from "@/adapters/http/approve-expense-controller";
import type {
  ApproveExpenseInput,
  ApproveExpenseResult,
  ApproveExpenseUseCase,
} from "@/application/approve-expense";

class StubApproveExpense implements ApproveExpenseUseCase {
  readonly calls: ApproveExpenseInput[] = [];

  constructor(private readonly result: ApproveExpenseResult) {}

  async execute(input: ApproveExpenseInput): Promise<ApproveExpenseResult> {
    this.calls.push(input);
    return this.result;
  }
}

const validBody = { expenseId: "expense-1", actorId: "manager" };

const approved: ApproveExpenseResult = {
  ok: true,
  expenseId: "expense-1",
  status: "approved",
  notification: "sent",
};

describe("ApproveExpenseController", () => {
  test("returns 200 with the use case result and passes the parsed input", async () => {
    const useCase = new StubApproveExpense(approved);

    const response = await new ApproveExpenseController(useCase).handle({ body: validBody });

    expect(response).toEqual({ status: 200, body: approved });
    expect(useCase.calls).toEqual([validBody]);
  });

  test.each([
    ["a missing body", undefined],
    ["a missing expenseId", { actorId: "manager" }],
    ["a blank actorId", { expenseId: "expense-1", actorId: " " }],
    ["a non-string expenseId", { expenseId: 1, actorId: "manager" }],
  ])("returns 400 for %s without calling the use case", async (_name, body) => {
    const useCase = new StubApproveExpense(approved);

    const response = await new ApproveExpenseController(useCase).handle({ body });

    expect(response).toEqual({ status: 400, body: { error: "invalid_request" } });
    expect(useCase.calls).toEqual([]);
  });

  test.each([
    ["actor_not_found", 404],
    ["expense_not_found", 404],
    ["own_request", 403],
    ["forbidden_role", 403],
    ["already_resolved", 409],
  ] as const)("translates %s to %d", async (reason, status) => {
    const useCase = new StubApproveExpense({ ok: false, reason });

    const response = await new ApproveExpenseController(useCase).handle({ body: validBody });

    expect(response).toEqual({ status, body: { error: reason } });
  });
});
