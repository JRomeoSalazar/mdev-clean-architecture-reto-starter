import { startServer } from "@/adapters/http/bun-server";
import { ApproveExpenseController } from "@/adapters/http/approve-expense-controller";
import { RejectExpenseController } from "@/adapters/http/reject-expense-controller";
import { Router } from "@/adapters/http/router";
import { SubmitExpenseController } from "@/adapters/http/submit-expense-controller";
import { UuidIdGenerator } from "@/adapters/identity/uuid-id-generator";
import { ConsoleLogger } from "@/adapters/logging/console-logger";
import { InMemoryNotifier } from "@/adapters/notifications/in-memory-notifier";
import { InMemoryEmployeeRepository } from "@/adapters/persistence/in-memory-employee-repository";
import { InMemoryExpenseRepository } from "@/adapters/persistence/in-memory-expense-repository";
import { SystemClock } from "@/adapters/time/system-clock";
import { ApproveExpense } from "@/application/approve-expense";
import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { Logger } from "@/application/ports/logger";
import type { Notifier } from "@/application/ports/notifier";
import { RejectExpense } from "@/application/reject-expense";
import { SubmitExpense } from "@/application/submit-expense";
import { Employee } from "@/domain/employee";
import { employeeId } from "@/domain/identifiers";

const DEFAULT_PORT = 3000;

const DEMO_EMPLOYEES = [
  Employee.create(employeeId("ana"), "Ana", "employee"),
  Employee.create(employeeId("marta"), "Marta", "manager"),
  Employee.create(employeeId("felix"), "Felix", "finance"),
];

export type AppOverrides = Partial<{
  clock: Clock;
  ids: IdGenerator;
  notifier: Notifier;
  logger: Logger;
}>;

// Composition root: the only place that knows which implementation backs each port.
export function composeApp(overrides: AppOverrides = {}): Router {
  const employees = new InMemoryEmployeeRepository(DEMO_EMPLOYEES);
  const expenses = new InMemoryExpenseRepository();
  const notifier = overrides.notifier ?? new InMemoryNotifier();
  const clock = overrides.clock ?? new SystemClock();
  const ids = overrides.ids ?? new UuidIdGenerator();
  const logger = overrides.logger ?? new ConsoleLogger();

  return new Router({
    submit: new SubmitExpenseController(
      new SubmitExpense(employees, expenses, notifier, clock, ids, logger),
    ),
    approve: new ApproveExpenseController(
      new ApproveExpense(employees, expenses, notifier, clock, logger),
    ),
    reject: new RejectExpenseController(
      new RejectExpense(employees, expenses, notifier, clock, logger),
    ),
  });
}

if (import.meta.main) {
  const port = Number(Bun.env.PORT ?? DEFAULT_PORT);
  const server = startServer(composeApp(), port);
  console.log(`Expense approval API listening on http://localhost:${server.port}`);
}
