export interface ICategory {
  name: string;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TCreateCategoryPayload = Pick<ICategory, "name">;

export type TUpdateCategoryPayload = Partial<TCreateCategoryPayload>;
