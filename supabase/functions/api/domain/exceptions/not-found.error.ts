import { DomainError } from "./domain-error.ts";

export class NotFoundError extends DomainError {
  constructor(entity = "Resource") {
    super("COMMON_ERROR", `${entity} not found`);
  }
}
