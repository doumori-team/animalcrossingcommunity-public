// based on v1/users/catalog/pc, v1/users/catalog, v1/character/catalog
type CatalogItemsType = {
	id: string
	isInventory: boolean
	isWishlist: boolean
	inMuseum?: boolean
};

export type { CatalogItemsType };
