import { CustomError } from "../custom-error.ts";

export class ForbiddenError extends CustomError {
  constructor(message = "Forbidden") {
    super("COMMON_ERROR", 403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
