import { useState } from 'react';

import { utils, constants } from '@utils';
import { GroupItemType, CatalogItemsType } from '@types';
import { Checkbox } from '@form';
import { SelectAllCheckbox } from '@layout';

const CatalogCategory = ({
	catalogItems,
	acgameCatalog,
	sortBy,
	name,
	edit = false,
}: CatalogCategoryProps) =>
{
	const [remove, setRemove] = useState<string[]>([]);

	const handleChange = (itemId: string): void =>
	{
		// if no checkboxes checked with that value, add to remove list
		let allUnchecked = true;
		let inputElements = document.querySelectorAll<HTMLInputElement>('.CatalogCategory input[value="' + itemId + '"]');

		for (let i = 0; inputElements[i]; ++i)
		{
			if ((inputElements[i] as HTMLInputElement).checked)
			{
				allUnchecked = false;
				break;
			}
		}

		const alreadyInList = remove.some(id => id === itemId);
		let array = [...remove];

		if (!allUnchecked && alreadyInList)
		{
			array = array.filter(id => id !== itemId);
		}
		else if (allUnchecked && !alreadyInList)
		{
			array.push(itemId);
		}

		setRemove(array);
	};

	return (
		<div className='CatalogCategory'>
			<input type='hidden' name='remove' value={remove} />

			{acgameCatalog.map(category =>
				category.groups.map(group =>
				{
					let count = 0, className = 'CatalogCategory_name';

					if (sortBy !== 'theme')
					{
						className += ' hidden';
					}
					else if (utils.realStringLength(name) === 0)
					{
						const catalogItemIds = catalogItems
							.filter(item => item.isInventory === true)
							.map(item => item.id);
						count = group.items
							.filter(item => catalogItemIds.includes(item.id)).length;
					}

					const javascriptFriendlyGroupName = utils.convertForUrl(group.groupName);

					return (
						<div key={group.groupName}
							className={'CatalogCategory_group ' + javascriptFriendlyGroupName}
						>
							<h3 className={className}>
								{utils.realStringLength(name) === 0 ?
									<>
										{count === group.total &&
											<img
												src={`${constants.AWS_URL}/images/catalog/icon_star7.gif`}
												alt={`Collected all items in ${group.groupName}`}
											/>
										}
										{group.groupName} ({count}/{group.total})
									</>
									:
									group.groupName
								}
								{edit &&
									<div className='CatalogCategory_groupToggle'>
										<div className='CatalogCategory_groupOption'>
											<SelectAllCheckbox
												name={`toggle_${javascriptFriendlyGroupName}I`}
												label='I'
												select={'.CatalogCategory .' + javascriptFriendlyGroupName + ' input[name="inventory"]'}
											/>
										</div>
										{group.items.some(item => item.museum) &&
											<div className='CatalogCategory_groupOption'>
												<SelectAllCheckbox
													name={`toggle_${javascriptFriendlyGroupName}M`}
													label='M'
													select={'.CatalogCategory .' + javascriptFriendlyGroupName + ' input[name="museum"]'}
												/>
											</div>
										}
									</div>
								}
							</h3>
							<div className='CatalogCategory_groupItems'>
								{group.items.map(item =>
								{
									let className = 'CatalogCategory_item';
									const catalogItem = catalogItems
										.find(ci => ci.id === item.id);

									if (!edit && catalogItem && catalogItem.isInventory)
									{
										className += ' InventoryItem';
									}

									if (!edit && catalogItem && catalogItem.isWishlist)
									{
										className += ' WishlistItem';
									}

									return (
										<div key={item.id} className={className}>
											<div className='CatalogCategory_itemName'>
												{item.name}
											</div>
											{edit &&
												<div className='CatalogCategory_itemOptions'>
													<div className='CatalogCategory_itemOption'>
														<Checkbox
															name='inventory'
															htmlFor={`inventory_${item.id}`}
															label='I'
															value={item.id}
															checked={catalogItem ? catalogItem.isInventory : false}
															clickHandler={() => handleChange(item.id)}
														/>
													</div>
													<div className='CatalogCategory_itemOption'>
														<Checkbox
															name='wishlist'
															htmlFor={`wishlist_${item.id}`}
															label='W'
															value={item.id}
															checked={catalogItem ? catalogItem.isWishlist : false}
															clickHandler={() => handleChange(item.id)}
														/>
													</div>
													{item.museum && item.genuine &&
														<div className='CatalogCategory_itemOption'>
															<Checkbox
																name='museum'
																htmlFor={`museum_${item.id}`}
																label='M'
																value={item.id}
																checked={catalogItem ? catalogItem.inMuseum : false}
																clickHandler={() => handleChange(item.id)}
															/>
														</div>
													}
												</div>
											}
										</div>
									);
								})}
							</div>
						</div>
					);
				}),
			)}
		</div>
	);
};

type CatalogCategoryProps = {
	catalogItems: CatalogItemsType[]
	acgameCatalog: GroupItemType[]
	sortBy: string
	name: string
	edit?: boolean
};

export default CatalogCategory;
