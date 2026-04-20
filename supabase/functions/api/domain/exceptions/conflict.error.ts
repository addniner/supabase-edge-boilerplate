import { DomainError } from "./domain-error.ts";

export class ConflictError extends DomainError {
  constructor(message = "Conflict") {
    super("CONFLICT", message);
  }
}
