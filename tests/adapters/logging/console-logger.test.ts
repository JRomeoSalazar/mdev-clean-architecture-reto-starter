import { expect, spyOn, test } from "bun:test";
import { ConsoleLogger } from "@/adapters/logging/console-logger";

test("ConsoleLogger writes the message and context to console.error", () => {
  const spy = spyOn(console, "error").mockImplementation(() => {});

  new ConsoleLogger().error("Something failed", { expenseId: "e1" });
  new ConsoleLogger().error("No context");

  expect(spy.mock.calls).toEqual([
    ["Something failed", { expenseId: "e1" }],
    ["No context", {}],
  ]);
  spy.mockRestore();
});
