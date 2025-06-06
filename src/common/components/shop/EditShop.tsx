import { Fragment, useState } from 'react';
import axios from 'axios';
import Compressor from 'compressorjs';

import { RequireClientJS, RequirePermission } from '@behavior';
import { constants } from '@utils';
import { ShopType, ACGameType, ShopCatalogType } from '@types';
import { Form, Text, Switch, Select, TextArea, RichTextArea } from '@form';
import { ErrorMessage, ItemLookup } from '@layout';
import { iso } from 'common/iso.ts';

const EditShop = ({
	shop,
	acgames,
	catalogItems,
}: EditShopProps) =>
{
	const [errors, setErrors] = useState<string[]>([]);
	const [fileId, setFileId] = useState<string | null>(null);
	const [games, setGames] = useState<any[]>(shop && shop.games.length > 0 ? shop.games : []);

	const changeGames = (newGameIds: number[]): void =>
	{
		const newGames = newGameIds.map(gameId => acgames.find(ag => ag.id === gameId));

		setGames(newGames);
	};

	const scanFile = async (e: any): Promise<void> =>
	{
		const compressedFile: any = await compressImage(e.target.files[0]);

		// 10000 KB / 10 MB max size
		if (compressedFile.size > 10000000)
		{
			setErrors(['image-file-size-too-large']);

			return;
		}

		const fileName = await uploadImage(compressedFile);

		setFileId(fileName);
	};

	const compressImage = async (file: any): Promise<any> =>
	{
		return new Promise((resolve, reject) =>
		{
			new Compressor(file, {
				convertSize: 1000000,
				success: resolve,
				error: reject,
			});
		});
	};

	const uploadImage = async (file: any): Promise<string> =>
	{
		const params = {
			shopId: String(shop?.id || ''),
			imageExtension: file.type.replace(/(.*)\//g, ''),
		};

		return await (await iso).query(null, 'v1/shop/upload_image', params)
			.then(async ({ s3PresignedUrl, fileName }: { s3PresignedUrl: string, fileName: string }) =>
			{
				try
				{
					await axios.put(s3PresignedUrl, file, { headers: { 'Content-Type': file.type } });

					return fileName;
				}
				catch (error: any)
				{
					console.error('Error attempting to upload.', error);

					setErrors(['bad-format']);
				}
			})
			.catch((_: any) =>
			{
				setErrors(['bad-format']);
			});
	};

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
				}
				>
					<Form.Group>
						<Select
							label='Game(s)'
							name='games'
							multiple
							value={games.map((g: any) => g.id)}
							options={acgames.filter(g => g.hasTown === true).slice().sort((a, b) =>
							{
								const indexA = games.findIndex((g: any) => a.id === g.id);
								const indexB = games.findIndex((g: any) => b.id === g.id);
								return indexA - indexB;
							})}
							optionsMapping={{ value: 'id', label: 'name' }}
							placeholder='Choose Animal Crossing game(s)...'
							size={5}
							required
							changeHandler={changeGames}
						/>
					</Form.Group>

					{games.length > 0 &&
						<div className='EditShop_gameOptions'>
							{games.map((game: any) =>
							{
								const shopGame = shop ? shop.games.find(g => g.id === game.id) : null;

								return (
									<Fragment key={game.id}>
										<Form.Group>
											<Text
												type='number'
												label={`${game.shortname}: Max Items Allowed Per Order`}
												name='perOrders'
												required
												max={constants.max.shopPerOrder}
												min={constants.min.number}
												value={shopGame ? shopGame.perOrder : 20}
											/>
										</Form.Group>
										<Form.Group>
											<Switch
												name='stackOrQuantities'
												label={`${game.shortname}: Max Items by Stack`}
												value={shopGame ? shopGame.stackOrQuantity : true}
											/>
										</Form.Group>
										<Form.Group>
											<Switch
												name='completeOrders'
												label={`${game.shortname}: Complete Order Before Ordering Again`}
												value={shopGame ? shopGame.completeOrder : true}
											/>
										</Form.Group>
										<Form.Group>
											<ItemLookup
												label={`${game.shortname}: Unorderables`}
												options={catalogItems && catalogItems.find(g => g.gameId === game.id) ? catalogItems.find(g => g.gameId === game.id)?.items.filter((item: any) => item.tradeable) : []}
												value={shopGame ? shopGame.items : []}
												selectedGameId={game.id}
											/>
										</Form.Group>
									</Fragment>
								);
							})}
						</div>
					}
				</RequireClientJS>

				<Form.Group>
					<label>Vacation: </label>

					<div className='EditShop_away'>
						<Text
							type='date'
							name='vacationStartDate'
							label='Vacation Start Date'
							hideLabels
							value={shop && shop.vacation ? shop.vacation.startDate : ''}
						/> to <Text
							type='date'
							name='vacationEndDate'
							label='Vacation End Date'
							hideLabels
							value={shop && shop.vacation ? shop.vacation.endDate : ''}
						/>
					</div>
				</Form.Group>

				<Form.Group>
					<Switch
						name='allowTransfer'
						label='Allow Transfer of Ownership'
						value={shop ? shop.transfer : true}
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='active'
						label='Active (start taking orders)'
						value={shop ? shop.active : false}
					/>
				</Form.Group>

				{shop &&
					<>
						<RequirePermission permission='post-images' silent>
							<div className='EditShop_imageUpload'>
								{errors.map(
									(identifier, index) =>
										<ErrorMessage identifier={identifier} key={index} />,
								)}

								<RequireClientJS fallback={
									<ErrorMessage identifier='javascript-required' />
								}
								>
									<div className='EditShop_upload'>
										<h3>Upload Image:</h3>

										<input
											type='file'
											accept='.png,.jpg,.jpeg'
											onChange={scanFile}
											name='file'
										/>

										{fileId &&
											<input
												type='hidden'
												name='fileId'
												value={fileId}
											/>
										}

										{shop && shop.fileId &&
											<>
												You have a header uploaded! Upload it again to keep it, or leave it blank to remove it.
											</>
										}
									</div>
								</RequireClientJS>
							</div>
						</RequirePermission>
					</>
				}
			</Form>
		</section>
	);
};

type EditShopProps = {
	shop?: ShopType
	acgames: ACGameType[]
	catalogItems?: ShopCatalogType[]
};

export default EditShop;
