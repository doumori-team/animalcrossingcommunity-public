import { useState } from 'react';

import { constants } from '@utils';
import { ACGameItemType, ElementInputType, ResidentsType } from '@types';
import { RequireClientJS, RequireTestSite } from '@behavior';
import { Form, Check, Select, Text } from '@form';
import { ErrorMessage } from '@layout';

const EditListing = ({
	gameId,
	acgameCatalog,
	residents,
	type,
	acItemsCatalog,
}: EditListingProps) =>
{
	const [items, setItems] = useState<string[]>([]);
	const [quantities, setQuantities] = useState<number[]>([]);

	const changeItems = (newItems: string[]): void =>
	{
		// map old quantities to new quantity indexes
		let newQuantities: number[] = [];

		newItems.map((itemId: string, index: number) =>
		{
			let itemIndex = items.findIndex(id => id === itemId);

			if (itemIndex >= 0)
			{
				newQuantities[index] = quantities[itemIndex];
			}
			else
			{
				newQuantities[index] = 1;
			}
		});

		setItems(newItems);
		setQuantities(newQuantities);
	};

	const changeQuantity = (index: number, event: ElementInputType): void =>
	{
		let newQuantities = [...quantities];
		newQuantities[index] = Number(event.target.value);

		setQuantities(newQuantities);
	};

	let catalogItems: ACGameItemType[number]['all']['items'] = [];

	if (gameId && acgameCatalog)
	{
		catalogItems = acgameCatalog.filter(item => item.tradeable);
	}
	else if (acItemsCatalog)
	{
		catalogItems = acItemsCatalog;
	}

	const listingTypes = constants.tradingPost.listingTypes;
	const tradeTypes = constants.tradingPost.tradeTypes;

	return (
		<div className='EditListing'>
			{type === constants.tradingPost.tradeTypes.real &&
				<RequireTestSite>
					<ErrorMessage identifier='test-account-required' />
				</RequireTestSite>
			}

			<Form
				action='v1/trading_post/listing/save'
				callback='/trading-post/:id'
				showButton
			>
				<input type='hidden' name='gameId' value={gameId} />

				<Form.Group>
					<Check
						options={constants.tradingPost.listingTypesArray.filter(x => x.id !== listingTypes.both)}
						name='type'
						defaultValue={[listingTypes.sell]}
						label='Type'
					/>
				</Form.Group>

				<RequireClientJS fallback={
					<ErrorMessage identifier='javascript-required' />
				}
				>
					<Form.Group>
						<Select
							name='items'
							label='Item(s)'
							multiple
							async
							options={catalogItems}
							optionsMapping={{ value: 'id', label: 'name' }}
							value={items}
							placeholder='Select item(s)...'
							changeHandler={changeItems}
							required={gameId === constants.gameIds.ACGC || type === tradeTypes.real}
							groupBy='categoryName'
							size={15}
						/>
					</Form.Group>

					{(gameId > constants.gameIds.ACGC || type === tradeTypes.real) && items.length > 0 &&
						<div className='EditListing_option'>
							{items.map((itemId, index) =>
								<Form.Group key={index}>
									<Text
										type='number'
										label={`${catalogItems.find(item => item.id === itemId)?.name} Quantity`}
										name='quantities'
										value={quantities[index]}
										changeHandler={(e) => changeQuantity(index, e)}
										required
										max={constants.max.number}
										min={constants.min.number}
									/>
								</Form.Group>,
							)}
						</div>
					}
				</RequireClientJS>

				{gameId > constants.gameIds.ACGC &&
					<>
						<Form.Group>
							<Text
								name='bells'
								type='number'
								label='Bells'
								max={constants.max.number}
							/>
						</Form.Group>

						<Form.Group>
							<Select
								name='residents'
								label='Villager(s)'
								multiple
								placeholder='Select villager(s)...'
								options={gameId <= 0 ? [] : residents.filter((r: any) => r.isTown === true)}
								optionsMapping={{ value: 'id', label: 'name' }}
								size={15}
							/>
						</Form.Group>

						<Form.Group>
							<Text
								name='comment'
								label='Additional Info'
								maxLength={constants.max.additionalInfo}
							/>
						</Form.Group>
					</>
				}
			</Form>
		</div>
	);
};

type EditListingProps = {
	gameId: number
	acgameCatalog: ACGameItemType[number]['all']['items'] | null
	residents: ResidentsType[number]
	type: string
	acItemsCatalog: ACGameItemType[number]['all']['items'] | null
};

export default EditListing;
