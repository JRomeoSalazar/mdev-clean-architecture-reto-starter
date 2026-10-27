import { describe, expect, test } from "bun:test";
import { SubmitExpenseController } from "@/adapters/http/submit-expense-controller";
import type {
  SubmitExpenseInput,
  SubmitExpenseResult,
  SubmitExpenseUseCase,
} from "@/application/submit-expense";

class StubSubmitExpense implements SubmitExpenseUseCase {
  readonly calls: SubmitExpenseInput[] = [];

  constructor(private readonly result: SubmitExpenseResult) {}

  async execute(input: SubmitExpenseInput): Promise<SubmitExpenseResult> {
    this.calls.push(input);
    return this.result;
  }
}

const validBody: SubmitExpenseInput = {
  employeeId: "employee-1",
  description: "Lunch",
  category: "meals",
  amount: 4_500,
};

const created: SubmitExpenseResult = {
  ok: true,
  expenseId: "expense-1",
  status: "approved",
  notification: "sent",
};

describe("SubmitExpenseController", () => {
  test("returns 201 with the use case result and passes the parsed input", async () => {
    const useCase = new StubSubmitExpense(created);

    const response = await new SubmitExpenseController(useCase).handle({ body: validBody });

    expect(response).toEqual({ status: 201, body: created });
    expect(useCase.calls).toEqual([validBody]);
  });

  test("ignores unknown body fields such as a client-provided date", async () => {
    const useCase = new StubSubmitExpense(created);

    await new SubmitExpenseController(useCase).handle({ body: { ...validBody, today: "1999-01-01" } });

    expect(useCase.calls).toEqual([validBody]);
  });

  test.each([
    ["a missing body", undefined],
    ["a non-object body", "text"],
    ["a missing employeeId", { ...validBody, employeeId: undefined }],
    ["a blank employeeId", { ...validBody, employeeId: "  " }],
    ["a non-string description", { ...validBody, description: 5 }],
    ["an unknown category", { ...validBody, category: "banana" }],
    ["a non-number amount", { ...validBody, amount: "4500" }],
  ])("returns 400 for %s without calling the use case", async (_name, body) => {
    const useCase = new StubSubmitExpense(created);

    const response = await new SubmitExpenseController(useCase).handle({ body });

    expect(response).toEqual({ status: 400, body: { error: "invalid_request" } });
    expect(useCase.calls).toEqual([]);
  });

  test.each([
    ["employee_not_found", 404],
    ["invalid_expense", 422],
  ] as const)("translates %s to %d", async (reason, status) => {
    const useCase = new StubSubmitExpense({ ok: false, reason });

    const response = await new SubmitExpenseController(useCase).handle({ body: validBody });

    expect(response).toEqual({ status, body: { error: reason } });
  });
});
