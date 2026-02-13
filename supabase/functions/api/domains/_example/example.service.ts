/**
 * Example Service (Facade)
 * UseCase들을 조율하는 Facade 패턴
 */

import type { CreateExampleInput } from "./example.schema.ts";
import {
  CreateExampleUseCase,
  GetExampleUseCase,
} from "./usecases/index.ts";

export class ExampleService {
  private getExampleUseCase: GetExampleUseCase;
  private createExampleUseCase: CreateExampleUseCase;

  constructor() {
    this.getExampleUseCase = new GetExampleUseCase();
    this.createExampleUseCase = new CreateExampleUseCase();
  }

  async getExample(id: string) {
    return await this.getExampleUseCase.execute({ id });
  }

  async createExample(input: CreateExampleInput) {
    return await this.createExampleUseCase.execute(input);
  }
}
