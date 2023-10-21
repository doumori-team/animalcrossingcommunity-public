import React, { useState } from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { Confirm } from '@form';
import { utils } from '@utils';
import { UserContext } from '@contexts';
import { Pagination, Header, Section, Grid, Markup } from '@layout';
import Avatar from '@/components/nodes/Avatar.js';

const BellShopPage = () =>
{
	const {categories, categoryItems, page, pageSize, totalCount, userItems,
		selectedCategoryId} = useLoaderData();

	const [curUserItems, setCurUserItems] = useState(userItems ? userItems : []);

	if (userItems && userItems.length > curUserItems.length)
	{
		setCurUserItems(userItems);
	}

	const updateUserItems = (data) =>
	{
		setCurUserItems(data.map(ui => ui.itemId));
	}

	return (
		<div className='BellShopPage'>
			<RequireUser permission='purchase-bell-shop'>
				<UserContext.Consumer>
					{currentUser => currentUser && (
						<>
						<Header
							name='Bell Shop'
							description={`Need some Bells before you get shopping? You can find multiple types of Bells around the site that will appear randomly while you use ACC. Just click on them to gain Bells. To view how many Bells you have, you can see the running total on your profile, on the left sidebar, or in the Bell Shop. If you have more questions about how to get Bells, view our FAQs.`}
							links={
								<Link to={`/bell-shop/redeemed`}>
									My Redeemed Items
								</Link>
							}
						>
							<div className='BellShopPage_bells'>
								<div className='BellShopPage_userBells'>
									Bells: {currentUser.bells}
								</div>
							</div>
						</Header>

						<Section>
							<Grid name='categorie' options={categories}>
								{categories.map(category =>
									<Link to={`/bell-shop/${encodeURIComponent(category.id)}`}
										key={category.id}
										className={`BellShopPage_category BellShopPage_category_${utils.convertForUrl(category.name)}`}
										aria-label={category.name}
									>
										<p>{category.name}</p>
									</Link>
								)}
							</Grid>
						</Section>

						{selectedCategoryId > 0 && (
							<Section>
								<Grid name='item' options={categoryItems}>
									{categoryItems.map(item =>
										<div className='BellShopPage_item' key={item.id}>
											{item.avatar && (
												<Avatar { ...item.avatar } />
											)}

											{utils.realStringLength(item.image) > 0 && (
												<img src={`${process.env.AWS_URL}/images/${item.image}`}
													className='BellShopPage_image' alt={item.name} />
											)}

											<div className='BellShopPage_name'>
												{item.name}
											</div>

											{item.description && (
												<Markup
													text={item.description}
													format='markdown'
												/>
											)}

											<div className='BellShopPage_expires'>
												Expires: {item.expires === null ? 'Never' : item.expires}
											</div>

											<div className='BellShopPage_prices'>
												{curUserItems.includes(item.id) ? (
													<button disabled className='BellShopPage_button BellShopPage_redeemed'>
														Redeemed!
													</button>
												) : (
													item.prices.map(price => {
														if (price.isBells &&
															(currentUser.nonFormattedTotalBells - price.nonFormattedPrice) < 0)
														{
															return <button disabled key={price.id}
																className='BellShopPrice_noAfford BellShopPage_button'>
																{`Redeem for ${price.price}`}
															</button>;
														}
														else
														{
															return <Confirm
																key={price.id}
																action='v1/bell_shop/redeem'
																callback={`/bell-shop/${selectedCategoryId}`}
																id={price.id}
																additionalBody={
																	<input type='hidden' name='itemId' value={item.id} />
																}
																label={`Redeem for ${price.price}`}
																message='Are you sure you want to redeem this item?'
																updateFunction={updateUserItems}
															/>;
														}
													})
												)}
											</div>
										</div>
									)}
								</Grid>

								<Pagination
									page={page}
									pageSize={pageSize}
									totalCount={totalCount}
									startLink={`bell-shop/${encodeURIComponent(selectedCategoryId)}`}
								/>
							</Section>
						)}
						</>
					)}
				</UserContext.Consumer>
			</RequireUser>
		</div>
	);
}

export async function loadData({categoryId}, {page})
{
	const selectedCategoryId = Number(categoryId || 0);

	const [categories, categoryItems, userItems] = await Promise.all([
		this.query('v1/bell_shop/categories'),
		selectedCategoryId > 0 ? this.query('v1/bell_shop/items', {
			page: page ? page : 1,
			categoryId: selectedCategoryId
		}) : null,
		selectedCategoryId > 0 ? this.query('v1/users/bell_shop/items', {
			ignoreExpired: false
		}) : null,
	]);

	return {
		categories,
		categoryItems: categoryItems?.results,
		totalCount: categoryItems?.count,
		page: categoryItems?.page,
		pageSize: categoryItems?.pageSize,
		userItems: userItems?.map(ui => ui.itemId),
		selectedCategoryId,
	};
}

export default BellShopPage;