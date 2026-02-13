/**
 * Example Domain - Public Exports
 * 외부에서 사용할 것만 export
 */

// Route
export { exampleRoute } from "./example.route.ts";

// Service (필요시)
export { ExampleService } from "./example.service.ts";

// Types (필요시)
export type { ExampleEntity } from "./example.repository.ts";
export type {
  CreateExampleInput,
  UpdateExampleInput,
  ExampleListQueryInput,
} from "./example.schema.ts";
