import { DomainError, type DomainErrorItem } from "./domain-error.ts";

export class TooManyRequestsError extends DomainError {
  constructor(message = "Too Many Requests", errors?: DomainErrorItem[] | null) {
    super("TOO_MANY_REQUESTS", message, errors);
  }
}
