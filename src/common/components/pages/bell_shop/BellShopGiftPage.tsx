import { useState } from 'react';

import { RequireUser, RequireClientJS } from '@behavior';
import { Form, Button } from '@form';
import { UserContext } from '@contexts';
import { Header, Section, Markup, ErrorMessage, UserLookup } from '@layout';
import Avatar from '@/components/nodes/Avatar.tsx';
import { APIThisType, BellShopItemsType, UserDonationsType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const BellShopGiftPage = ({ loaderData }: { loaderData: BellShopGiftPageProps }) =>
{
	const { item, userDonations } = loaderData;

	const [chosenUserId, setChosenUserId] = useState<number>(0);

	return (
		<div className='BellShopGiftPage'>
			<RequireClientJS fallback={
				<ErrorMessage identifier='javascript-required' />
			}
			>
				<RequireUser permission='gift-bell-shop'>
					<UserContext.Consumer>
						{currentUser => currentUser &&
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
										{item.avatar &&
											<Avatar {...item.avatar} />
										}

										<div className='BellShopGiftPage_name'>
											{item.name}
										</div>

										{item.description &&
											<Markup
												text={item.description}
												format='markdown'
											/>
										}

										<div className='BellShopGiftPage_expires'>
											Expires: {item.expires === null ? 'Never' : item.expires}
										</div>

										<div className='BellShopGiftPage_prices'>
											{item.prices.map(price =>
											{
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
												currentUser.nonFormattedTotalBells - price.nonFormattedPrice < 0)
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
															<UserLookup
																label='User To Gift To'
																value={chosenUserId}
																changeHandler={(userId: number) => setChosenUserId(userId)}
															/>

															{chosenUserId > 0 &&
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
															}
														</>
													);
												}
											})}
										</div>
									</div>
								</Section>
							</>
						}
					</UserContext.Consumer>
				</RequireUser>
			</RequireClientJS>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<BellShopGiftPageProps>
{
	const [item, userDonations] = await Promise.all([
		this.query('v1/bell_shop/item', { id: id }),
		this.query('v1/users/donations'),
	]);

	return { item, userDonations };
}

export const loader = routerUtils.wrapLoader(loadData);

type BellShopGiftPageProps = {
	item: BellShopItemsType['all'][number]
	userDonations: UserDonationsType
};

export default BellShopGiftPage;
