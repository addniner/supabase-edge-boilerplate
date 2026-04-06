import { DomainError, type DomainErrorItem } from "./domain-error.ts";

export class ValidationError extends DomainError {
  public readonly errors: DomainErrorItem[] | null;

  constructor(message = "Validation failed", errors?: DomainErrorItem[] | null) {
    super("COMMON_ERROR", message);
    this.errors = errors ?? null;
  }
}
