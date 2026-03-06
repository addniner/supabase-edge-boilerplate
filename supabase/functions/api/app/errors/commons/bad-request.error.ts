import { CustomError } from "../custom-error.ts";
import type { ErrorItem } from "@shared/types";

export class BadRequestError extends CustomError {
  constructor(message = "Bad Request", errors?: ErrorItem[] | null) {
    super("COMMON_ERROR", 400, message, errors ?? null);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}
