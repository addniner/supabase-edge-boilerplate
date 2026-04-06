import { CustomError } from "../custom-error.ts";
/**
 * 환경 변수 관련 에러 클래스
 */
export class EnvironmentVariableError extends CustomError {
  constructor(message: string, variableName: string) {
    super("ENV_001", 500, message, [{ reason: variableName }]);
  }
}
