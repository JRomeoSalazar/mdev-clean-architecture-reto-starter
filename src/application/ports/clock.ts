import type { LocalDate } from "@/domain/local-date";

export interface Clock {
  today(): LocalDate;
}
