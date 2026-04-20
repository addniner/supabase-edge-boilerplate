/**
 * 테스트 환경변수 사전 설정
 * 모든 테스트 파일에서 최상단에 import 할 것 (side-effect import)
 * Logger 등 모듈 최상위 static initializer보다 먼저 실행됨
 */
import { setupTestEnv } from "./setup.ts";
setupTestEnv();

export { setupTestEnv, TEST_STORAGE_CONFIG } from "./setup.ts";
