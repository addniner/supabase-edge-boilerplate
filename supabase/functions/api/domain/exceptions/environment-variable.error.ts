import { DomainError } from "./domain-error.ts";

export class EnvironmentVariableError extends DomainError {
  constructor(message: string, variableName: string) {
    super("ENV_ERROR", message, [{ reason: variableName }]);
  }
}
