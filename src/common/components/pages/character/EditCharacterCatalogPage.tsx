import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import Catalog from '@/components/users/Catalog.tsx';
import { utils, constants } from '@utils';
import { APIThisType, UserCatalogCategoryType, CatalogItemsType, GroupItemType } from '@types';

const EditCharacterCatalogPage = () =>
{
	const {catalogItems, acgameCatalog, by, category, userId,
		selectedCharacterId, catalogCategories, name} = useLoaderData() as EditCharacterCatalogPageProps;

	return (
		<RequireUser id={userId} permission='modify-towns'>
			<div className='EditCharacterCatalogPage'>
				<Catalog
					characterId={selectedCharacterId}
					catalogItems={catalogItems}
					catalog={acgameCatalog}
					sortBy={by}
					selectedCategory={category}
					name={name}
					catalogCategories={catalogCategories}
					begLink={`/catalog/${encodeURIComponent(userId)}/${constants.town.catalogTypes.character}/${encodeURIComponent(selectedCharacterId)}`}
					userId={userId}
					saveAction='v1/character/catalog/save'
				/>
			</div>
		</RequireUser>
	);
}

export async function loadData(this: APIThisType, {userId, characterId}: {userId: string, characterId: string}, {by, name, category} : {by?: string, name?: string, category?: string}) : Promise<EditCharacterCatalogPageProps>
{
	const selectedCharacterId = Number(characterId);
	const selectedUserId = Number(userId);

	by = by ? by : 'theme';
	name = name ? name : '';
	category = category ? utils.convertForUrl(category) : '';

	const [character, catalogCategories, catalogItems] = await Promise.all([
		this.query('v1/character', {id: selectedCharacterId}),
		this.query('v1/character/catalog/category', {characterId: selectedCharacterId}),
		this.query('v1/character/catalog', {id: selectedCharacterId}),
	]);

	const [acgameCatalog] = await Promise.all([
		this.query('v1/acgame/catalog', {id: character.game.id, categoryName: category, sortBy: by, name: name}),
	]);

	return {selectedCharacterId, acgameCatalog, by, category, userId: selectedUserId, catalogItems, catalogCategories, name};
}

type EditCharacterCatalogPageProps = {
	selectedCharacterId: number
	acgameCatalog: GroupItemType[]
	by: string
	category: string
	userId: number
	catalogItems: CatalogItemsType[]
	catalogCategories: UserCatalogCategoryType
	name: string
}

export default EditCharacterCatalogPage;
