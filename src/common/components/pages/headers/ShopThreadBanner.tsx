import React from 'react';
import { Link, useLoaderData, Outlet } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { constants } from '@utils';
import { Form, Check, TextArea } from '@form';
import { Header, Section, ReportProblem, Markup } from '@layout';
import { APIThisType, NodeType, RatingsGivenType, ShopNodeShopType } from '@types';

const ShopThreadBanner = () =>
{
	const { node, rating, shop } = useLoaderData() as ShopThreadBannerProps;

	const showRatings = Object.keys(constants.rating.configs)
		.map(x =>
		{
			return {
				id: (constants.rating.configs as any)[x].id,
				filename: (constants.rating.configs as any)[x].image,
			};
		});

	return (
		<>
			<div className='ShopThreadBanner'>
				<Header
					name={node.title}
					links={
						<Link to={`/shops/ratings/${encodeURIComponent(shop.userId)}`}>
							Employee Ratings
						</Link>
					}
					description={
						<>
							<Link to={`/shop/${encodeURIComponent(shop.id)}`}>Shop: {shop.name}</Link>
							<div className='Node_invitedUsers'>
								<span>Invited Users: </span>
								<ul>
									{node.users.map(({ username, granted, id }, index) =>
										<li key={index} className={granted ? `` : `removed`}>
											<Link to={`/profile/${encodeURIComponent(id)}`}>
												{username}
											</Link>
										</li>,
									)}
								</ul>
							</div>
						</>
					}
				/>

				{shop.order &&
					<Section>
						<div>
							Customer: <Link to={`/profile/${encodeURIComponent(shop.order.customer.id)}`}>{shop.order.customer.username}</Link>
						</div>

						<div>
							Service: {shop.order.service} ({shop.order.game.shortname})
						</div>

						{shop.order.items.length > 0 &&
							<div className='ShopThreadBanner_items'>
								Item(s):
								<ul>
									{shop.order.items.map(item =>
										<li key={item.id}>
											{item.name}, Qty: {item.quantity}
										</li>,
									)}
								</ul>
							</div>
						}

						{shop.order.comment &&
							<div className='ShopThreadBanner_comment'>
								<ReportProblem type={constants.userTicket.types.shopOrder} id={shop.order.id} />
								Comment: {shop.order.comment}
							</div>
						}

						<div>
							Ordered: {shop.order.formattedDate}
						</div>
					</Section>
				}

				{shop.application &&
					<Section>
						<ReportProblem type={constants.userTicket.types.shopApplication} id={shop.application.id} />
						<Markup
							text={shop.application.application.content}
							format={shop.application.application.format}
							emojiSettings={shop.application.emojiSettings}
						/>
					</Section>
				}

				{shop.customerIds.length > 0 && node.locked &&
					<RequireUser ids={shop.customerIds} silent>
						<Section>
							<h2>Feedback</h2>
							<Form
								action='v1/rating/save'
								className='ShopThreadBanner_rating'
								showButton
							>
								<input type='hidden' name='shopNodeId' value={node.id} />
								<input type='hidden' name='id' value={rating ? rating.id : 0} />

								<Form.Group>
									<Check
										options={showRatings}
										name='rating'
										defaultValue={rating ? [rating.rating] : []}
										required={true}
										imageLocation='rating'
										useImageFilename={true}
										label='Rating'
									/>
								</Form.Group>
								<Form.Group>
									<TextArea
										name='comment'
										label='Comment'
										required
										value={rating ? rating.comment : ''}
										maxLength={constants.max.comment}
									/>
								</Form.Group>
							</Form>
						</Section>
					</RequireUser>
				}
			</div>
			<Outlet />
		</>
	);
};

export async function loadData(this: APIThisType, { id }: { id: string }): Promise<ShopThreadBannerProps>
{
	const [node, ratings, shop] = await Promise.all([
		this.query('v1/node/full', { id: id }),
		this.query('v1/users/ratings_given', { page: 1, type: constants.rating.types.shop }),
		this.query('v1/shop/node/shop', { id: id }),
	]);

	return {
		node,
		rating: ratings.results.length > 0 ? ratings.results.pop() : null,
		shop,
	};
}

type ShopThreadBannerProps = {
	node: NodeType
	rating: RatingsGivenType['results'][number] | null
	shop: ShopNodeShopType
};

export default ShopThreadBanner;
