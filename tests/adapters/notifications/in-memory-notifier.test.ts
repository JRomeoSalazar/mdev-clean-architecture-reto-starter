import { expect, test } from "bun:test";
import { InMemoryNotifier } from "@/adapters/notifications/in-memory-notifier";
import { employeeId, expenseId } from "@/domain/identifiers";

test("InMemoryNotifier records the notifications in order", async () => {
  const notifier = new InMemoryNotifier();
  const approved = { expenseId: expenseId("e1"), employeeId: employeeId("ana"), outcome: "approved" } as const;
  const rejected = { expenseId: expenseId("e2"), employeeId: employeeId("ana"), outcome: "rejected", reason: "No" } as const;

  await notifier.notifyResolution(approved);
  await notifier.notifyResolution(rejected);

  expect(notifier.sent).toEqual([approved, rejected]);
});
