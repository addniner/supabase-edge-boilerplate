import { CustomError } from "../custom-error.ts";

export class ConflictError extends CustomError {
  constructor(message = "Conflict") {
    // 409 응답은 errorHandler에서 적절히 처리됨
    super("COMMON_ERROR", 409, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
