import { DomainError, type DomainErrorItem } from "./domain-error.ts";

export class InternalServerError extends DomainError {
  public readonly errors: DomainErrorItem[] | null;

  constructor(message = "Internal Server Error", errors?: DomainErrorItem[] | null) {
    super("COMMON_ERROR", message);
    this.errors = errors ?? null;
  }
}
