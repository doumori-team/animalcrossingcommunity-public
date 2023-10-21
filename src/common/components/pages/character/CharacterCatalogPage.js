import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import Catalog from '@/components/users/Catalog.js';
import { utils, constants } from '@utils';

const CharacterCatalogPage = () =>
{
	const {catalogItems, acgameCatalog, by, category, userId,
		selectedCharacterId, catalogCategories, name} = useLoaderData();

	return (
		<RequirePermission permission='view-towns'>
			<div className='CharacterCatalogPage'>
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
				/>
			</div>
		</RequirePermission>
	);
}

export async function loadData({userId, characterId}, {by, name, category})
{
	const selectedCharacterId = Number(characterId);
	userId = Number(userId);
	let acgameCatalog = null;

	by = by ? by : 'theme';
	name = name ? name : '';
	category = category ? utils.convertForUrl(category) : '';

	const [character, catalogCategories, catalogItems] = await Promise.all([
		utils.realStringLength(category) > 0 ? this.query('v1/character', {id: selectedCharacterId}) : null,
		this.query('v1/character/catalog/category', {characterId: selectedCharacterId}),
		utils.realStringLength(category) > 0 ? this.query('v1/character/catalog', {id: selectedCharacterId}) : null,
	]);

	if (character)
	{
		[acgameCatalog] = await Promise.all([
			this.query('v1/acgame/catalog', {id: character.game.id, categoryName: category, sortBy: by, name: name}),
		]);
	}

	return {selectedCharacterId, acgameCatalog, by, category, userId, catalogItems, catalogCategories, name};
}

export default CharacterCatalogPage;
