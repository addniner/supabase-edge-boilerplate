import { CustomError } from "../custom-error.ts";
import type { ErrorItem } from "@shared/types";

export class ValidationError extends CustomError {
  constructor(message = "Validation failed", errors?: ErrorItem[] | null) {
    super("COMMON_ERROR", 400, message, errors ?? null);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
