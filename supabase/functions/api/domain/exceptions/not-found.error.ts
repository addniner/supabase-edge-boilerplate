import { DomainError } from "./domain-error.ts";

export class NotFoundError extends DomainError {
  constructor(entity = "Resource") {
    super("NOT_FOUND", `${entity} not found`);
  }
}
