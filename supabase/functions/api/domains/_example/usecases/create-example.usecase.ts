/**
 * CreateExample UseCase
 * 생성 비즈니스 로직
 */

import type {
  ExampleEntity,
  IExampleRepository,
} from "../example.repository.ts";
import { ExampleRepository } from "../example.repository.ts";
import type { CreateExampleInput } from "../example.schema.ts";

export interface CreateExampleOutput {
  example: ExampleEntity;
}

export class CreateExampleUseCase {
  constructor(
    private exampleRepo: IExampleRepository = new ExampleRepository(),
  ) {}

  async execute(input: CreateExampleInput): Promise<CreateExampleOutput> {
    const example = await this.exampleRepo.create({
      name: input.name,
    });

    return { example };
  }
}
