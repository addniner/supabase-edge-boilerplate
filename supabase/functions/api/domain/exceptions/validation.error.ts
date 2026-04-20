import { DomainError, type DomainErrorItem } from "./domain-error.ts";

export class ValidationError extends DomainError {
  constructor(message = "Validation failed", errors?: DomainErrorItem[] | null) {
    super("VALIDATION_ERROR", message, errors);
  }
}
