import { CustomError } from "../custom-error.ts";
import type { ErrorItem } from "@shared/types";

export class TooManyRequestsError extends CustomError {
  constructor(message = "Too Many Requests", errors?: ErrorItem[] | null) {
    super("COMMON_ERROR", 429, message, errors ?? null);
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}
