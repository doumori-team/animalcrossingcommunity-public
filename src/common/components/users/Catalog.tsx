import React from 'react';
import { Link } from 'react-router-dom';
import * as ReactRouterDom from 'react-router-dom';

import { utils, constants } from '@utils';
import { RequireClientJS, RequireUser } from '@behavior';
import CatalogCategory from '@/components/users/CatalogCategory.tsx';
import { Form, Text, Button } from '@form';
import { ErrorMessage, Section, SelectAllCheckbox } from '@layout';
import { GroupItemType, CatalogItemsType, UserCatalogCategoryType } from '@types';

const Catalog = ({
	catalogItems,
	catalog,
	characterId,
	sortBy,
	userId,
	selectedCategory,
	name,
	catalogCategories,
	begLink,
	saveAction,
}: CatalogProps) =>
{
	const encodedBy = encodeURIComponent(sortBy);
	const edit = utils.realStringLength(saveAction) > 0;
	let link = `${begLink}`;
	const orgLink = link;

	if (edit)
	{
		link += `/edit`;
	}

	let params = `?name=${encodeURIComponent(name)}`;

	if (utils.realStringLength(selectedCategory) > 0)
	{
		// already converted for url below, line 63
		params += `&category=${selectedCategory}`;
	}

	return (
		<div className='Catalog'>
			<Section>
				<div className='Catalog_header'>
					<Link to={`${link}?category=all&by=${encodedBy}`}
						className={selectedCategory === 'all' ? 'Catalog_all selected' : 'Catalog_all'}
					>
						All Items
					</Link>

					{characterId &&
						<Link to={`${link}?category=museum&by=${encodedBy}`}
							className={selectedCategory === 'museum' ? 'Catalog_museum selected' : 'Catalog_museum'}
						>
							All Museum
						</Link>
					}

					<ReactRouterDom.Form action={link} method='get' className='Catalog_search'>
						<input type='hidden' name='category' value='all' />
						<input type='hidden' name='by' value={sortBy} />

						<Text
							name='name'
							value={name}
							label='Item Name'
							maxLength={constants.max.itemName}
						/>

						<Button
							type='submit'
							label='Search'
						/>
					</ReactRouterDom.Form>
				</div>

				<div className='Catalog_categories'>
					{catalogCategories.map((category) =>
					{
						const convertedName = utils.convertForUrl(category.categoryName);
						let className = 'CategoryName';

						if (selectedCategory === convertedName)
						{
							className += ' selected';
						}

						return (
							<Link
								key={category.categoryName}
								className={className}
								to={`${link}?category=${convertedName}&by=${encodedBy}`}
							>
								{category.count === category.total &&
									<img
										src={`${constants.AWS_URL}/images/catalog/icon_star7.gif`}
										alt={`Collected all items in ${category.categoryName}`}
									/>}
								{category.categoryName} ({category.count}/{category.total})
							</Link>
						);
					})}
				</div>
			</Section>

			{utils.realStringLength(selectedCategory) > 0 &&
				<div className='Catalog_categoryItems'>
					<RequireUser id={userId} silent>
						<div className='Catalog_links'>
							{edit ?
								<Link to={`${orgLink}${params}&by=${encodedBy}`}>
									View
								</Link>
								:
								<Link to={`${orgLink}/edit${params}&by=${encodedBy}`}>
									Edit
								</Link>
							}
						</div>
					</RequireUser>

					{edit ?
						<div className='Catalog_legend'>
							<h3>Legend:</h3>
							<div>I = Inventory</div>
							<div>W = Wishlist</div>
							<div>M = Museum</div>
						</div>
						:
						<div className='Catalog_legend'>
							<h3>Legend:</h3>

							<div className='Catalog_legendBox InventoryItem'>
								Inventory
							</div>

							<div className='Catalog_legendBox WishlistItem'>
								Wishlist
							</div>

							<div className='Catalog_legendBox InventoryItem WishlistItem'>
								Inventory & Wishlist
							</div>
						</div>
					}

					<div className='Catalog_sort'>
						<h3>Sort by:</h3>
						<Link
							className={sortBy === 'theme' ? 'Catalog_sortLink selected' : 'Catalog_sortLink'}
							to={`${link}${params}&by=theme`}
						>
							Theme / Series
						</Link>
						{' | '}
						<Link
							className={sortBy === 'alphabetical' ? 'Catalog_sortLink selected' : 'Catalog_sortLink'}
							to={`${link}${params}&by=alphabetical`}
						>
							Alphabetically
						</Link>
						{characterId &&
							<>
								{' | '}
								<Link
									className={sortBy === 'catalog' ? 'Catalog_sortLink selected' : 'Catalog_sortLink'}
									to={`${link}${params}&by=catalog`}
								>
									Nook's Catalog Order
								</Link>
							</>
						}
					</div>

					{edit &&
						<div className='Catalog_setAll'>
							<SelectAllCheckbox
								label='Set All to Inventory'
								select=".CatalogCategory input[name='inventory']"
								checked
							/>
						</div>
					}

					{edit ?
						<Form
							action={String(saveAction || '')}
							callback={`${link}${params}&by=${encodedBy}`}
							showButton
						>
							<input type='hidden' name='characterId' value={characterId} />

							<RequireClientJS fallback={<ErrorMessage identifier='javascript-required' />}>
								<CatalogCategory
									catalogItems={catalogItems}
									acgameCatalog={catalog}
									sortBy={sortBy}
									name={name}
									edit={true}
								/>
							</RequireClientJS>
						</Form>
						:
						<CatalogCategory
							sortBy={sortBy}
							catalogItems={catalogItems}
							acgameCatalog={catalog}
							name={name}
						/>
					}
				</div>
			}
		</div>
	);
};

type CatalogProps = {
	catalogItems: CatalogItemsType[]
	catalog: GroupItemType[]
	characterId?: number
	sortBy: string
	userId?: number
	selectedCategory: string
	catalogCategories: UserCatalogCategoryType
	name: string
	begLink: string
	saveAction?: string
};

export default Catalog;
