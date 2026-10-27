import { DomainRuleViolation } from "@/domain/domain-rule-violation";

const MILLISECONDS_PER_DAY = 86_400_000;

export class LocalDate {
  private constructor(private readonly epochDay: number) {}

  static parse(value: string): LocalDate {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
      throw new DomainRuleViolation("Date must use YYYY-MM-DD format");
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const timestamp = Date.UTC(year, month - 1, day);
    const parsed = new Date(timestamp);

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      throw new DomainRuleViolation("Date is not a valid calendar day");
    }

    return new LocalDate(timestamp / MILLISECONDS_PER_DAY);
  }

  static fromDate(value: Date): LocalDate {
    const year = value.getUTCFullYear();
    const month = value.getUTCMonth();
    const day = value.getUTCDate();

    return new LocalDate(Date.UTC(year, month, day) / MILLISECONDS_PER_DAY);
  }

  plusDays(days: number): LocalDate {
    if (!Number.isSafeInteger(days)) {
      throw new DomainRuleViolation("Days must be an integer");
    }

    return new LocalDate(this.epochDay + days);
  }

  equals(other: LocalDate): boolean {
    return this.epochDay === other.epochDay;
  }

  toString(): string {
    return new Date(this.epochDay * MILLISECONDS_PER_DAY)
      .toISOString()
      .slice(0, 10);
  }
}
