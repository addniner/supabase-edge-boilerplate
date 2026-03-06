import { CustomError } from "../custom-error.ts";
import type { ErrorItem } from "@shared/types";

export class InternalServerError extends CustomError {
  constructor(message = "Internal Server Error", errors?: ErrorItem[] | null) {
    super("COMMON_ERROR", 500, message, errors ?? null);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
