import { CustomError } from "../custom-error.ts";

export class UnauthorizedError extends CustomError {
  constructor(message = "Unauthorized") {
    super("COMMON_ERROR", 401, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
