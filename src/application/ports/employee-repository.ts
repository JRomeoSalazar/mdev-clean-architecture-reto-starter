import type { Employee } from "@/domain/employee";
import type { EmployeeId } from "@/domain/identifiers";

export interface EmployeeRepository {
  findEmployeeById(id: EmployeeId): Promise<Employee | null>;
}
