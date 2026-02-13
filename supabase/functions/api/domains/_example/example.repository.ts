/**
 * Example Repository
 * 데이터 접근 계층 - DB CRUD만 담당
 */

// import { getDatabase } from "@db";
// import { exampleTable } from "@db/schema";
// import type { Example, NewExample } from "@db/schema";

export interface ExampleEntity {
  id: string;
  name: string;
  createdAt: Date;
}

export interface IExampleRepository {
  findById(id: string): Promise<ExampleEntity | null>;
  findAll(): Promise<ExampleEntity[]>;
  create(data: Omit<ExampleEntity, "id" | "createdAt">): Promise<ExampleEntity>;
  update(
    id: string,
    data: Partial<Omit<ExampleEntity, "id">>,
  ): Promise<ExampleEntity | null>;
  delete(id: string): Promise<boolean>;
}

export class ExampleRepository implements IExampleRepository {
  findById(_id: string): Promise<ExampleEntity | null> {
    // const db = getDatabase();
    // const result = await db.select().from(exampleTable).where(eq(exampleTable.id, id)).limit(1);
    // return result[0] ?? null;
    throw new Error("Not implemented");
  }

  findAll(): Promise<ExampleEntity[]> {
    // const db = getDatabase();
    // return await db.select().from(exampleTable);
    throw new Error("Not implemented");
  }

  create(
    _data: Omit<ExampleEntity, "id" | "createdAt">,
  ): Promise<ExampleEntity> {
    // const db = getDatabase();
    // const [result] = await db.insert(exampleTable).values(data).returning();
    // return result;
    throw new Error("Not implemented");
  }

  update(
    _id: string,
    _data: Partial<Omit<ExampleEntity, "id">>,
  ): Promise<ExampleEntity | null> {
    // const db = getDatabase();
    // const [result] = await db.update(exampleTable).set(data).where(eq(exampleTable.id, id)).returning();
    // return result ?? null;
    throw new Error("Not implemented");
  }

  delete(_id: string): Promise<boolean> {
    // const db = getDatabase();
    // const result = await db.delete(exampleTable).where(eq(exampleTable.id, id));
    // return result.rowCount > 0;
    throw new Error("Not implemented");
  }
}
