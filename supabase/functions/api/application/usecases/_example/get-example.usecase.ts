/**
 * GetExample UseCase
 * 단일 조회 비즈니스 로직
 */

import type { ExampleRepository, ExampleEntity } from "@domain/repositories";
import { ExampleRepositoryImpl } from "@repositories";

export class GetExampleUseCase {
  constructor(
    private exampleRepo: ExampleRepository = new ExampleRepositoryImpl(),
  ) {}

  async execute(input: { id: string }): Promise<ExampleEntity | null> {
    return await this.exampleRepo.findById(input.id);
  }
}
