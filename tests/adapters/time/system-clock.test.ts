import { expect, test } from "bun:test";
import { SystemClock } from "@/adapters/time/system-clock";

test("SystemClock returns a calendar date close to the current UTC date", () => {
  const today = new SystemClock().today().toString();
  const candidates = [new Date(), new Date(Date.now() - 1_000)].map((date) => date.toISOString().slice(0, 10));

  expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(candidates).toContain(today);
});
