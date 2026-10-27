import { describe, expect, test } from "bun:test";
import { RejectExpenseController } from "@/adapters/http/reject-expense-controller";
import type {
  RejectExpenseInput,
  RejectExpenseResult,
  RejectExpenseUseCase,
} from "@/application/reject-expense";

class StubRejectExpense implements RejectExpenseUseCase {
  readonly calls: RejectExpenseInput[] = [];

  constructor(private readonly result: RejectExpenseResult) {}

  async execute(input: RejectExpenseInput): Promise<RejectExpenseResult> {
    this.calls.push(input);
    return this.result;
  }
}

const validBody = { expenseId: "expense-1", actorId: "manager", reason: "Missing receipt" };

const rejected: RejectExpenseResult = {
  ok: true,
  expenseId: "expense-1",
  status: "rejected",
  notification: "sent",
};

describe("RejectExpenseController", () => {
  test("returns 200 with the use case result and passes the parsed input", async () => {
    const useCase = new StubRejectExpense(rejected);

    const response = await new RejectExpenseController(useCase).handle({ body: validBody });

    expect(response).toEqual({ status: 200, body: rejected });
    expect(useCase.calls).toEqual([validBody]);
  });

  test.each([
    ["a missing body", undefined],
    ["a missing expenseId", { actorId: "manager", reason: "x" }],
    ["a blank actorId", { expenseId: "expense-1", actorId: " ", reason: "x" }],
  ])("returns 400 for %s without calling the use case", async (_name, body) => {
    const useCase = new StubRejectExpense(rejected);

    const response = await new RejectExpenseController(useCase).handle({ body });

    expect(response).toEqual({ status: 400, body: { error: "invalid_request" } });
    expect(useCase.calls).toEqual([]);
  });

  test("passes an empty reason to the use case when the body has none", async () => {
    const useCase = new StubRejectExpense({ ok: false, reason: "reason_required" });

    const response = await new RejectExpenseController(useCase).handle({
      body: { expenseId: "expense-1", actorId: "manager" },
    });

    expect(useCase.calls).toEqual([{ expenseId: "expense-1", actorId: "manager", reason: "" }]);
    expect(response).toEqual({ status: 422, body: { error: "reason_required" } });
  });

  test.each([
    ["actor_not_found", 404],
    ["expense_not_found", 404],
    ["own_request", 403],
    ["forbidden_role", 403],
    ["already_resolved", 409],
    ["reason_required", 422],
  ] as const)("translates %s to %d", async (reason, status) => {
    const useCase = new StubRejectExpense({ ok: false, reason });

    const response = await new RejectExpenseController(useCase).handle({ body: validBody });

    expect(response).toEqual({ status, body: { error: reason } });
  });
});
