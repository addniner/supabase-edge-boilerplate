import { DomainError, type DomainErrorItem } from "./domain-error.ts";

export class BadRequestError extends DomainError {
  constructor(message = "Bad Request", errors?: DomainErrorItem[] | null) {
    super("BAD_REQUEST", message, errors);
  }
}
