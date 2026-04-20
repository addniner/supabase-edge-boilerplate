import { DomainError } from "./domain-error.ts";

export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden") {
    super("FORBIDDEN", message);
  }
}
