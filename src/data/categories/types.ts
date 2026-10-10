export interface CategoryDef {
  id: string;
  en: string;
  es: string;
}

export interface CategoryPack {
  id: string;
  income: CategoryDef[];
  expense: CategoryDef[];
}
