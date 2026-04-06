import { DomainError, type DomainErrorItem } from "./domain-error.ts";

export class BadRequestError extends DomainError {
  public readonly errors: DomainErrorItem[] | null;

  constructor(message = "Bad Request", errors?: DomainErrorItem[] | null) {
    super("COMMON_ERROR", message);
    this.errors = errors ?? null;
  }
}
