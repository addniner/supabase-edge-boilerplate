import { DomainError, type DomainErrorItem } from "./domain-error.ts";

export class InternalServerError extends DomainError {
  constructor(message = "Internal Server Error", errors?: DomainErrorItem[] | null) {
    super("INTERNAL_SERVER_ERROR", message, errors);
  }
}
