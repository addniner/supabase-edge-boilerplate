import { DomainError, type DomainErrorItem } from "./domain-error.ts";

export class TooManyRequestsError extends DomainError {
  public readonly errors: DomainErrorItem[] | null;

  constructor(message = "Too Many Requests", errors?: DomainErrorItem[] | null) {
    super("COMMON_ERROR", message);
    this.errors = errors ?? null;
  }
}
