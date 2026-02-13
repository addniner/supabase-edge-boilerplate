import { CustomError } from "../custom-error.ts";

export class NotFoundError extends CustomError {
  constructor(entity = "Resource") {
    super("COMMON_ERROR", 404, `${entity} not found`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
