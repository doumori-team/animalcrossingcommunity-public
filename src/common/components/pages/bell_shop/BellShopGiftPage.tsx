import React, { useState } from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser, RequireClientJS } from '@behavior';
import { Form, Select, Button } from '@form';
import { UserContext } from '@contexts';
import { Header, Section, Markup, ErrorMessage } from '@layout';
import Avatar from '@/components/nodes/Avatar.tsx';
import * as iso from 'common/iso.js';
import { APIThisType, BellShopItemsType, UsersType, UserDonationsType } from '@types';

const BellShopGiftPage = () =>
{
	const {item, userDonations} = useLoaderData() as BellShopGiftPageProps;

	const [chosenUserId, setChosenUserId] = useState<number>(0);

	const handleUserLookup = async (query:string) : Promise<UsersType[]> =>
	{
		let params = new FormData();
		params.append('query', query);

		return (iso as any).query(null, 'v1/users', params)
			.then(async (users:UsersType[]) =>
			{
				return users;
			})
			.catch((error:any) =>
			{
				console.error('Error attempting to get users.');
				console.error(error);

				return [];
			});
	}

	return (
		<div className='BellShopGiftPage'>
			<RequireClientJS fallback={
				<ErrorMessage identifier='javascript-required' />
			}>
				<RequireUser permission='gift-bell-shop'>
					<UserContext.Consumer>
						{currentUser => currentUser && (
							<>
							<Header
								name='Gifting: Bell Shop'
							>
								<div className='BellShopGiftPage_bells'>
									<div className='BellShopGiftPage_userBells'>
										Bells: {currentUser.bells}
									</div>
								</div>
							</Header>

							<Section>
								<div className='BellShopGiftPage_item'>
									{item.avatar && (
										<Avatar { ...item.avatar } />
									)}

									<div className='BellShopGiftPage_name'>
										{item.name}
									</div>

									{item.description && (
										<Markup
											text={item.description}
											format='markdown'
										/>
									)}

									<div className='BellShopGiftPage_expires'>
										Expires: {item.expires === null ? 'Never' : item.expires}
									</div>

									<div className='BellShopGiftPage_prices'>
										{item.prices.map(price => {
											let itemPrice = price.nonFormattedPrice;

											if (userDonations.monthlyPerks >= 5 && userDonations.monthlyPerks < 10)
											{
												itemPrice = itemPrice - Math.ceil(itemPrice * 0.05);
											}
											else if (userDonations.monthlyPerks >= 10)
											{
												itemPrice = itemPrice - Math.ceil(itemPrice * 0.10);
											}

											if (price.isBells &&
												(currentUser.nonFormattedTotalBells - price.nonFormattedPrice) < 0)
											{
												return (
													<Button
														key={price.id}
														label={`Gift for ${`${itemPrice.toLocaleString()} ${price.currency}`}`}
														className='BellShopPrice_noAfford BellShopGiftPage_button'
														disabled
													/>
												);
											}
											else
											{
												return (
													<>
													<Select
														name='users'
														label='User To Gift To'
														optionsMapping={{value: 'id', label: 'username'}}
														async
														value={chosenUserId}
														changeHandler={(userId:number) => setChosenUserId(userId)}
														loadOptionsHandler={handleUserLookup}
													/>

													{chosenUserId > 0 && (
														<Form
															action='v1/bell_shop/redeem'
															callback={`/bell-shop/${item.categoryId}`}
															showButton
															buttonText={`Gift for ${`${itemPrice.toLocaleString()} ${price.currency}`}`}
														>
															<input type='hidden' name='id' value={price.id} />
															<input type='hidden' name='userId' value={chosenUserId} />
															<input type='hidden' name='itemId' value={item.id} />
														</Form>
													)}
													</>
												);
											}
										})}
									</div>
								</div>
							</Section>
							</>
						)}
					</UserContext.Consumer>
				</RequireUser>
			</RequireClientJS>
		</div>
	);
}

export async function loadData(this: APIThisType, {id}: {id: string}) : Promise<BellShopGiftPageProps>
{
	const [item, userDonations] = await Promise.all([
		this.query('v1/bell_shop/item', {id: id}),
		this.query('v1/users/donations'),
	]);

	return {item, userDonations};
}

type BellShopGiftPageProps = {
	item: BellShopItemsType['all'][number]
	userDonations: UserDonationsType
}

export default BellShopGiftPage;