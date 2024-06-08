import React, { useState } from 'react';
import { Link, useLoaderData, Form as ReactRouterForm } from 'react-router-dom';

import { RequireUser, RequireClientJS } from '@behavior';
import { Confirm, Form, Select, Button } from '@form';
import { utils, constants } from '@utils';
import { UserContext } from '@contexts';
import { Pagination, Header, Section, Grid, Markup } from '@layout';
import Avatar from '@/components/nodes/Avatar.js';

const BellShopPage = () =>
{
	const {categories, categoryItems, page, pageSize, totalCount, userItems,
		selectedCategoryId, sortBy, groupBy, tags} = useLoaderData();

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
									<Link to={`/bell-shop/${encodeURIComponent(category.id)}${sortBy ? `?sort=${encodeURIComponent(sortBy)}` : ''}`}
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
								<div className='BellShopPage_sort'>
									<h3>Sort by:</h3>
									<Link
										className={sortBy === 'date' ? 'BellShopPage_sortLink selected' : 'BellShopPage_sortLink'}
										to={`/bell-shop/${encodeURIComponent(selectedCategoryId)}?sort=date${utils.realStringLength(groupBy) > 0 ? `&group=${encodeURIComponent(groupBy)}` : ''}`}>
										Date Added
									</Link>
									{' | '}
									<Link
										className={sortBy === 'price' ? 'BellShopPage_sortLink selected' : 'BellShopPage_sortLink'}
										to={`/bell-shop/${encodeURIComponent(selectedCategoryId)}?sort=price${utils.realStringLength(groupBy) > 0 ? `&group=${encodeURIComponent(groupBy)}` : ''}`}>
										Price
									</Link>
									{' | '}
									<Link
										className={sortBy === 'name' ? 'BellShopPage_sortLink selected' : 'BellShopPage_sortLink'}
										to={`/bell-shop/${encodeURIComponent(selectedCategoryId)}?sort=name${utils.realStringLength(groupBy) > 0 ? `&group=${encodeURIComponent(groupBy)}` : ''}`}>
										Name
									</Link>
								</div>

								{tags.length > 0 && (
									<div className='BellShopPage_group'>
										<ReactRouterForm
											action={`/bell-shop/${encodeURIComponent(selectedCategoryId)}`}
											method='get'
											className='FriendCodesPage_game'
											reloadDocument
										>
											<input type='hidden' name='sort' value={sortBy} />

											<Form.Group>
												<Select
													label='Filters'
													name='group'
													hideLabel
													options={tags}
													optionsMapping={{value: 'id', label: 'name'}}
													placeholder='Select filters...'
													value={groupBy}
													changeHandler={e => e.target.form.submit()}
												/>
											</Form.Group>

											<RequireClientJS
												fallback={
													<Button
														type='submit'
														label='Go'
														className='BellShopPage_button'
													/>
												}
											/>
										</ReactRouterForm>
									</div>
								)}

								<Grid name='item' options={categoryItems}>
									{categoryItems.map(item =>
										<div className='BellShopPage_item' key={item.id}>
											{item.avatar && (
												<Avatar { ...item.avatar } />
											)}

											{utils.realStringLength(item.image) > 0 && (
												<img src={`${constants.AWS_URL}/images/${item.image}`}
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
												<>
												{curUserItems.includes(item.id) && (
													<Button
														label='Redeemed!'
														className='BellShopPage_button BellShopPage_redeemed'
														disabled
													/>
												)}

												{item.prices.map(price => {
													let itemPrice = price.nonFormattedPrice;

													if (currentUser.monthlyPerks >= 5 && currentUser.monthlyPerks < 10)
													{
														itemPrice = itemPrice - Math.ceil(itemPrice * 0.05);
													}
													else if (currentUser.monthlyPerks >= 10)
													{
														itemPrice = itemPrice - Math.ceil(itemPrice * 0.10);
													}

													return (
														<>
														{!curUserItems.includes(item.id) && (
															price.isBells && (currentUser.nonFormattedTotalBells - price.nonFormattedPrice) < 0 ? (
																<Button
																	key={price.id}
																	label={`Redeem for ${`${itemPrice.toLocaleString()} ${price.currency}`}`}
																	className='BellShopPrice_noAfford BellShopPage_button'
																	disabled
																/>
															) : (
																<Confirm
																	key={price.id}
																	action='v1/bell_shop/redeem'
																	callback={`/bell-shop/${selectedCategoryId}`}
																	id={price.id}
																	additionalBody={
																		<>
																		<input type='hidden' name='userId' value={currentUser.id} />
																		<input type='hidden' name='itemId' value={item.id} />
																		</>
																	}
																	label={`Redeem for ${`${itemPrice.toLocaleString()} ${price.currency}`}`}
																	message='Are you sure you want to redeem this item?'
																	updateFunction={updateUserItems}
																/>
															)
														)}

														{(price.isBells && price.nonFormattedPrice <= constants.bellShop.giftBellLimit) && (
															(currentUser.nonFormattedTotalBells - price.nonFormattedPrice) < 0 ? (
																<Button
																	key={`${price.id}-gift`}
																	label='Gift to User'
																	className='BellShopPrice_noAfford BellShopPage_button'
																	disabled
																/>
															) : (
																<RequireClientJS>
																	<Link to={`/bell-shop/${item.id}/gift`} className='BellShopPage_button'>
																		Gift to User
																	</Link>
																</RequireClientJS>
															)
														)}
														</>
													);
												})}
												</>
											</div>
										</div>
									)}
								</Grid>

								<Pagination
									page={page}
									pageSize={pageSize}
									totalCount={totalCount}
									startLink={`bell-shop/${encodeURIComponent(selectedCategoryId)}`}
									endLink={`&sort=${encodeURIComponent(sortBy)}${utils.realStringLength(groupBy) > 0 ? `&group=${encodeURIComponent(groupBy)}` : ''}`}
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

export async function loadData({categoryId}, {page, sort, group, debug})
{
	const selectedCategoryId = Number(categoryId || 0);

	const [categories, categoryItems, userItems] = await Promise.all([
		this.query('v1/bell_shop/categories'),
		selectedCategoryId > 0 ? this.query('v1/bell_shop/items', {
			page: page ? page : 1,
			categoryId: selectedCategoryId,
			sortBy: sort ? sort : 'date',
			groupBy: group ? group : '',
			debug: debug,
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
		sortBy: categoryItems?.sortBy,
		groupBy: categoryItems?.groupBy,
		tags: categoryItems?.tags,
	};
}

export default BellShopPage;