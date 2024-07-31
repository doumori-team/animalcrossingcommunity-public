import { ACGameItemType } from '../data/acGameItemType.ts';

// based on v1/users/catalog/pc/category, v1/users/catalog/category, v1/character/catalog/category
type UserCatalogCategoryType = ACGameItemType[number]['all']['theme'];

export type { UserCatalogCategoryType };