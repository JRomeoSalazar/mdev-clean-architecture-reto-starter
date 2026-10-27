import { describe, expect, test } from "bun:test";
import { InMemoryEmployeeRepository } from "@/adapters/persistence/in-memory-employee-repository";
import { Employee } from "@/domain/employee";
import { employeeId } from "@/domain/identifiers";

describe("InMemoryEmployeeRepository", () => {
  const ana = Employee.create(employeeId("ana"), "Ana", "employee");
  const repository = new InMemoryEmployeeRepository([ana]);

  test("finds a known employee", async () => {
    expect(await repository.findEmployeeById(employeeId("ana"))).toBe(ana);
  });

  test("returns null for an unknown employee", async () => {
    expect(await repository.findEmployeeById(employeeId("unknown"))).toBeNull();
  });
});
