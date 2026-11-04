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

  describe("edit", () => {
    test("returns an employee with the new name and role, keeping the id", () => {
      const edited = Employee.create(employeeId("e1"), "Ana", "employee").edit("Bea", "finance");

      expect(edited.id).toBe(employeeId("e1"));
      expect(edited.name).toBe("Bea");
      expect(edited.role).toBe("finance");
    });

    test("does not modify the original employee", () => {
      const employee = Employee.create(employeeId("e1"), "Ana", "employee");

      employee.edit("Bea", "finance");

      expect(employee.name).toBe("Ana");
      expect(employee.role).toBe("employee");
    });

    test("trims the name", () => {
      const employee = Employee.create(employeeId("e1"), "Ana", "employee");

      expect(employee.edit("  Bea  ", "employee").name).toBe("Bea");
    });

    test("rejects an empty name", () => {
      const employee = Employee.create(employeeId("e1"), "Ana", "employee");

      expect(() => employee.edit("   ", "employee")).toThrow(DomainRuleViolation);
    });
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
