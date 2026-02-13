/**
 * GetExample UseCase
 * 단일 조회 비즈니스 로직
 */

import type {
  ExampleEntity,
  IExampleRepository,
} from "../example.repository.ts";
import { ExampleRepository } from "../example.repository.ts";

export interface GetExampleInput {
  id: string;
}

export interface GetExampleOutput {
  example: ExampleEntity;
}

export class GetExampleUseCase {
  constructor(
    private exampleRepo: IExampleRepository = new ExampleRepository(),
  ) {}

  async execute(input: GetExampleInput): Promise<GetExampleOutput | null> {
    const example = await this.exampleRepo.findById(input.id);

    if (!example) {
      return null;
    }

    return { example };
  }
}
