import { describe, expect, test } from "bun:test";
import { DomainRuleViolation } from "@/domain/domain-rule-violation";
import { Employee } from "@/domain/employee";
import { employeeId } from "@/domain/identifiers";

describe("Employee", () => {
  test("creates an employee with id, name and role", () => {
    const employee = Employee.create(employeeId("e1"), "Ana", "manager");

    expect(employee.id).toBe(employeeId("e1"));
    expect(employee.name).toBe("Ana");
    expect(employee.role).toBe("manager");
  });

  test("trims the name", () => {
    expect(Employee.create(employeeId("e1"), "  Ana  ", "employee").name).toBe("Ana");
  });

  test("rejects an empty name", () => {
    expect(() => Employee.create(employeeId("e1"), "   ", "employee")).toThrow(DomainRuleViolation);
  });
});

describe("Identifiers", () => {
  test("trim the value", () => {
    expect(employeeId("  e1  ")).toBe(employeeId("e1"));
  });

  test("reject empty values", () => {
    expect(() => employeeId(" ")).toThrow(DomainRuleViolation);
  });
});
