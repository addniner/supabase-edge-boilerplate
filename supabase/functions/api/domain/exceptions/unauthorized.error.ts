import { DomainError } from "./domain-error.ts";

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized") {
    super("COMMON_ERROR", message);
  }
}
