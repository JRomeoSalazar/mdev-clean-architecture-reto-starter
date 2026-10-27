import { expect, test } from "bun:test";
import { UuidIdGenerator } from "@/adapters/identity/uuid-id-generator";

test("UuidIdGenerator generates a different expense id each time", () => {
  const generator = new UuidIdGenerator();

  const first = generator.nextExpenseId();
  const second = generator.nextExpenseId();

  expect(first).toMatch(/^[0-9a-f-]{36}$/);
  expect(second).not.toBe(first);
});
