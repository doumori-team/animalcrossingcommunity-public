import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { constants } from '@utils';
import { residentShape, catalogGroupItemsShape } from '@propTypes';
import { RequireClientJS, RequireTestSite } from '@behavior';
import { Form, Check, Select, Text } from '@form';
import { ErrorMessage } from '@layout';

const EditListing = ({gameId, acgameCatalog, residents, type, acItemsCatalog}) =>
{
	const [items, setItems] = useState([]);
	const [quantities, setQuantities] = useState([]);

	const changeItems = (newItems) =>
	{
		// map old quantities to new quantity indexes
		let newQuantities = [];

		newItems.map((itemId, index) => {
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
	}

	const changeQuantity = (index, event) =>
	{
		let newQuantities = [...quantities];
		newQuantities[index] = Number(event.target.value);

		setQuantities(newQuantities);
	}

	const catalogItems = gameId > 0 ?
		acgameCatalog.filter(item => item.tradeable) :
		acItemsCatalog;

	const listingTypes = constants.tradingPost.listingTypes;
	const tradeTypes = constants.tradingPost.tradeTypes;

	return (
		<div className='EditListing'>
			{type === constants.tradingPost.tradeTypes.real && (
				<RequireTestSite>
					<ErrorMessage identifier='test-account-required' />
				</RequireTestSite>
			)}

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
				}>
					<Form.Group>
						<Select
							name='items'
							label='Item(s)'
							multiple
							async
							options={catalogItems}
							optionsMapping={{value: 'id', label: 'name'}}
							value={items}
							placeholder='Select item(s)...'
							changeHandler={changeItems}
							required={gameId === constants.gameIds.ACGC || type === tradeTypes.real}
							groupBy='categoryName'
							size={15}
						/>
					</Form.Group>

					{((gameId > constants.gameIds.ACGC || type === tradeTypes.real) && items.length > 0) && (
						<div className='EditListing_option'>
							{items.map((itemId, index) =>
								<Form.Group key={index}>
									<Text
										type='number'
										label={`${catalogItems.find(item => item.id === itemId).name} Quantity`}
										name='quantities'
										value={quantities[index]}
										changeHandler={(e) => changeQuantity(index, e)}
										required
										max={constants.max.number}
										min={constants.min.number}
									/>
								</Form.Group>
							)}
						</div>
					)}
				</RequireClientJS>

				{gameId > constants.gameIds.ACGC && (
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
								options={gameId <= 0 ? [] : residents.filter(r => r.isTown === true)}
								optionsMapping={{value: 'id', label: 'name'}}
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
				)}
			</Form>
		</div>
	);
}

EditListing.propTypes = {
	gameId: PropTypes.number,
	acgameCatalog: PropTypes.arrayOf(catalogGroupItemsShape),
	residents: PropTypes.arrayOf(residentShape),
	type: PropTypes.string,
	acItemsCatalog: PropTypes.arrayOf(catalogGroupItemsShape),
};

export default EditListing;
