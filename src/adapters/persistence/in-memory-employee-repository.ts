import type { EmployeeRepository } from "@/application/ports/employee-repository";
import type { Employee } from "@/domain/employee";
import type { EmployeeId } from "@/domain/identifiers";

export class InMemoryEmployeeRepository implements EmployeeRepository {
  private readonly employees: ReadonlyMap<EmployeeId, Employee>;

  constructor(employees: readonly Employee[] = []) {
    this.employees = new Map(employees.map((employee) => [employee.id, employee]));
  }

  async findEmployeeById(id: EmployeeId): Promise<Employee | null> {
    return this.employees.get(id) ?? null;
  }
}
