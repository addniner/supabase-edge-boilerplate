// 인터페이스 re-export (domain 레이어에서 정의된 인터페이스)
export type {
  UserRoleRepository,
  ExampleEntity,
  ExampleRepository,
} from "@domain/repositories";

// 구현체 export
export { UserRoleRepositoryImpl } from "./user-role.repository.ts";
export { ExampleRepositoryImpl } from "./example.repository.ts";
