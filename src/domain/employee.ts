import { DomainRuleViolation } from "@/domain/domain-rule-violation";
import type { EmployeeId } from "@/domain/identifiers";

export type EmployeeRole = "employee" | "manager" | "finance";

export class Employee {
  private constructor(
    readonly id: EmployeeId,
    readonly name: string,
    readonly role: EmployeeRole,
  ) {}

  static create(
    id: EmployeeId,
    name: string,
    role: EmployeeRole,
  ): Employee {
    if (name.trim().length === 0) {
      throw new DomainRuleViolation("Employee name cannot be empty");
    }

    return new Employee(id, name.trim(), role);
  }
}
