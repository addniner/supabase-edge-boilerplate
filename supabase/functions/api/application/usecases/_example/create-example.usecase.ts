/**
 * CreateExample UseCase
 * 생성 비즈니스 로직
 */

import type { ExampleRepository, ExampleEntity } from "@domain/repositories";
import { ExampleRepositoryImpl } from "@repositories";

export class CreateExampleUseCase {
  constructor(
    private exampleRepo: ExampleRepository = new ExampleRepositoryImpl(),
  ) {}

  async execute(input: { name: string; description?: string }): Promise<ExampleEntity> {
    return await this.exampleRepo.create({ name: input.name });
  }
}
