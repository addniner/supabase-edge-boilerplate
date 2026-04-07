export interface ExampleEntity {
  id: string;
  name: string;
  createdAt: Date;
}

export interface ExampleRepository {
  findById(id: string): Promise<ExampleEntity | null>;
  create(data: Omit<ExampleEntity, "id" | "createdAt">): Promise<ExampleEntity>;
}
