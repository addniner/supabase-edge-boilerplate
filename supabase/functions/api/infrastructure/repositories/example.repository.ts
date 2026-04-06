/**
 * Example Repository Implementation
 * 데이터 접근 계층 — DB CRUD만 담당
 */

import type {
  ExampleRepository,
  ExampleEntity,
} from "@domain/repositories";

// import { BaseRepository } from "@db";

export class ExampleRepositoryImpl implements ExampleRepository {
  findById(_id: string): Promise<ExampleEntity | null> {
    // const db = this.db;
    // const result = await db.select().from(exampleTable).where(eq(exampleTable.id, id)).limit(1);
    // return result[0] ?? null;
    throw new Error("Not implemented");
  }

  create(
    _data: Omit<ExampleEntity, "id" | "createdAt">,
  ): Promise<ExampleEntity> {
    // const db = this.db;
    // const [result] = await db.insert(exampleTable).values(data).returning();
    // return result;
    throw new Error("Not implemented");
  }
}
