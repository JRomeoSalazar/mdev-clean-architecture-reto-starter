import type { Clock } from "@/application/ports/clock";
import { LocalDate } from "@/domain/local-date";

export class SystemClock implements Clock {
  today(): LocalDate {
    return LocalDate.fromDate(new Date());
  }
}
