import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import Compressor from 'compressorjs';

import { RequireClientJS, RequirePermission } from '@behavior';
import { constants } from '@utils';
import { shopShape, acgameShape, catalogItemsShape } from '@propTypes';
import { Form, Text, Switch, Select, TextArea, RichTextArea } from '@form';
import { ErrorMessage } from '@layout';
import * as iso from 'common/iso.js';

const EditShop = ({shop, acgames, catalogItems}) =>
{
	const [errors, setErrors] = useState([]);
	const [fileId, setFileId] = useState(null);
	const [games, setGames] = useState(shop && shop.games.length > 0 ? shop.games : []);

	const changeGames = (newGameIds) =>
	{
		const newGames = newGameIds.map(gameId => acgames.find(ag => ag.id === gameId));

		setGames(newGames);
	}

	const scanFile = async (e) =>
	{
		const compressedFile = await compressImage(e.target.files[0]);

		// 10000 KB / 10 MB max size
		if (compressedFile.size > 10000000)
		{
			setErrors(['image-file-size-too-large']);

			return;
		}

		const fileName = await uploadImage(compressedFile);

		setFileId(fileName);
	}

	const compressImage = async (file) =>
	{
		return new Promise((resolve, reject) => {
			new Compressor(file, {
				convertSize: 1000000,
				success: resolve,
				error: reject,
			});
		});
	}

	const uploadImage = async (file) =>
	{
		let params = new FormData();
		params.append('shopId', shop.id);
		params.append('imageExtension', file.type.replace(/(.*)\//g, ''));

		return await iso.query(null, 'v1/shop/upload_image', params)
			.then(async ({s3PresignedUrl, fileName}) =>
			{
				try
				{
					await axios.put(s3PresignedUrl, file, {headers: {'Content-Type': file.type}});

					return fileName;
				}
				catch (e)
				{
					console.error('Error attempting to upload.');
					console.error(e);

					setErrors(['bad-format']);
				}
			})
			.catch(error =>
			{
				console.error('Error attempting to get presigned url.');
				console.error(error);

				setErrors(['bad-format']);
			});
	}

	const handleItemsLookup = async (query, selectedGameId) =>
	{
		let callback = 'v1/acgame/catalog';

		let params = new FormData();
		params.append('query', query);
		params.append('categoryName', 'all');
		params.append('sortBy', 'items');
		params.append('id', selectedGameId);

		return iso.query(null, callback, params)
			.then(async items =>
			{
				if (selectedGameId === 0)
				{
					return items;
				}

				return items.filter(item => item.tradeable);
			})
			.catch(error =>
			{
				console.error('Error attempting to get items.');
				console.error(error);

				return [];
			})
	}

	return (
		<section className='EditShop'>
			<Form action='v1/shop/save' callback='/shop/:id' showButton>
				<input type='hidden' name='id' value={shop ? shop.id : 0} />

				<Form.Group>
					<Text
						name='name'
						required
						label='Shop Name'
						maxLength={constants.max.shopName}
						value={shop ? shop.name : ''}
						className='text-full'
					/>
				</Form.Group>

				<Form.Group>
					<TextArea
						label='Short Description'
						name='shortDescription'
						maxLength={constants.max.shopShortDescription}
						required
						value={shop ? shop.shortDescription : ''}
					/>
				</Form.Group>

				<Form.Group>
					<label htmlFor='description'>Description:</label>
					<RichTextArea
						textName='description'
						formatName='format'
						label='Description'
						hideEmojis
						maxLength={constants.max.shopDescription}
						required
						textValue={shop ? shop.description.content : ''}
						formatValue={shop ? shop.description.format : 'markdown'}
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='fee'
						label='Fee'
						value={shop ? shop.free !== true : false}
					/>
				</Form.Group>

				<RequireClientJS fallback={
					<ErrorMessage identifier='javascript-required' />
				}>
					<Form.Group>
						<Select
							label='Game(s)'
							name='games'
							multiple
							value={games.map(g => g.id)}
							options={acgames.filter(g => g.hasTown === true).slice().sort((a, b) => {
								const indexA = games.findIndex(g => a.id === g.id);
								const indexB = games.findIndex(g => b.id === g.id);
								return indexA - indexB;
							})}
							optionsMapping={{value: 'id', label: 'name'}}
							placeholder='Choose Animal Crossing game(s)...'
							size={5}
							required
							changeHandler={changeGames}
						/>
					</Form.Group>

					{games.length > 0 && (
						<div className='EditShop_gameOptions'>
							{games.map((game, index) =>
							{
								const shopGame = shop ? shop.games.find(g => g.id === game.id) : null;

								return (
									<React.Fragment key={index}>
									<Form.Group>
										<Text
											type='number'
											label={`${game.shortname}: Max Items Allowed Per Order`}
											name={`perOrders[${index}]`}
											required
											max={constants.max.shopPerOrder}
											min={constants.min.number}
											value={shopGame ? shopGame.perOrder : 20}
										/>
									</Form.Group>
									<Form.Group>
										<Switch
											name={`stackOrQuantities[${index}]`}
											label={`${game.shortname}: Max Items by Stack`}
											value={shopGame ? shopGame.stackOrQuantity : true}
										/>
									</Form.Group>
									<Form.Group>
										<Switch
											name={`completeOrders[${index}]`}
											label={`${game.shortname}: Complete Order Before Ordering Again`}
											value={shopGame ? shopGame.completeOrder : true}
										/>
									</Form.Group>
									<Form.Group>
										<Select
											name={`items[${index}]`}
											label={`${game.shortname}: Unorderables`}
											options={catalogItems && catalogItems.find(g => g.gameId === game.id) ? catalogItems.find(g => g.gameId === game.id).items.filter(item => item.tradeable) : []}
											optionsMapping={{value: 'id', label: 'name'}}
											value={shopGame ? shopGame.items : []}
											placeholder='Select item(s)...'
											async
											multiple
											groupBy='categoryName'
											size={15}
											loadOptionsHandler={(query) => handleItemsLookup(query, game.id)}
										/>
									</Form.Group>
									</React.Fragment>
								);
							})}
						</div>
					)}
				</RequireClientJS>

				<Form.Group>
					<label>Vacation: </label>

					<div className='EditShop_away'>
						<Text
							type='date'
							name='vacationStartDate'
							label='Vacation Start Date'
							hideLabel
							value={shop && shop.vacation ? shop.vacation.startDate : ''}
						/> to <Text
							type='date'
							name='vacationEndDate'
							label='Vacation End Date'
							hideLabel
							value={shop && shop.vacation ? shop.vacation.endDate : ''}
						/>
					</div>
				</Form.Group>

				<Form.Group>
					<Switch
						name='allowTransfer'
						label='Allow Transfer of Ownership'
						value={shop ? shop.allowTransfer : true}
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='active'
						label='Active (start taking orders)'
						value={shop ? shop.active : false}
					/>
				</Form.Group>

				{shop && (
					<>
					<RequirePermission permission='post-images' silent>
						<div className='EditShop_imageUpload'>
							{errors.map(
								(identifier, index) =>
									(<ErrorMessage identifier={identifier} key={index} />)
							)}

							<RequireClientJS fallback={
								<ErrorMessage identifier='javascript-required' />
							}>
								<div className='EditShop_upload'>
									<h3>Upload Image:</h3>

									<input
										type='file'
										accept='.png,.jpg,.jpeg'
										onChange={scanFile}
										name='file'
									/>

									{fileId && (
										<input
											type='hidden'
											name='fileId'
											value={fileId}
										/>
									)}

									{(shop && shop.fileId) && (
										<>
										You have a header uploaded! Upload it again to keep it, or leave it blank to remove it.
										</>
									)}
								</div>
							</RequireClientJS>
						</div>
					</RequirePermission>
					</>
				)}
			</Form>
		</section>
	);
}

EditShop.propTypes = {
	shop: shopShape,
	acgames: PropTypes.arrayOf(acgameShape),
	catalogItems: PropTypes.arrayOf(catalogItemsShape),
};

export default EditShop;
