import React from 'react';
import { Link, useAsyncValue } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Form, Text, RichTextArea } from '@form';
import { Header, Section, ReportProblem } from '@layout';
import { constants } from '@utils';

const OrderPage = () =>
{
	const {order, userEmojiSettings, markupStyle} = getData(useAsyncValue());

	return (
		<div className='OrderPage'>
			<RequirePermission permission='modify-shops'>
				<Header
					name='Orders, Applications & Other Threads'
					links={
						<>
						<Link to='/shops'>
							Shops
						</Link>
						<Link to='/shops/threads'>
							Threads
						</Link>
						</>
					}
				/>

				<Section>
					<div>
						Customer: <Link to={`/profile/${encodeURIComponent(order.customer.id)}`}>{order.customer.username}</Link>
					</div>

					<div>
						Shop: <Link to={`/shop/${encodeURIComponent(order.shop.id)}`}>{order.shop.name}</Link>
					</div>

					<div>
						Service: {order.service} ({order.game.shortname})
					</div>

					{order.items.length > 0 && (
						<div className='OrderPage_items'>
							Item(s):
							<ul>
								{order.items.map(item =>
									<li key={item.id}>
										{item.name}, Qty: {item.quantity}
									</li>
								)}
							</ul>
						</div>
					)}

					{order.comment && (
						<div className='OrderPage_comment'>
							<ReportProblem type={constants.userTicket.types.shopOrder} id={order.id} />
							Comment: {order.comment}
						</div>
					)}

					<div>
						Ordered: {order.formattedDate}
					</div>
				</Section>

				<fieldset className='NodeWritingInterface'>
					<Form action='v1/shop/node/create' callback='/shops/threads/:id' showButton>
						<div role='group'>
							<h1 className='NodeWritingInterface_heading'>
								Create Order Thread
							</h1>
						</div>

						<input name='orderId' type='hidden' value={order.id} />

						<Text
							hideLabel
							className='NodeWritingInterface_title'
							name='title'
							label='Title'
							maxLength={constants.max.postTitle}
							required
						/>

						<div className='NodeWritingInterface_usernames'>
							<Text
								name='users'
								label='Username(s)'
								maxLength={constants.max.addMultipleUsers}
							/>
						</div>

						<RichTextArea
							textName='text'
							formatName='format'
							key={Math.random()}
							label='Create Order Thread'
							emojiSettings={userEmojiSettings}
							formatValue={markupStyle ? markupStyle : 'markdown'}
							maxLength={constants.max.post}
							required
						/>
					</Form>
				</fieldset>
			</RequirePermission>
		</div>
	);
}

export async function loadData({id})
{
	return Promise.all([
		this.query('v1/shop/thread', {id: id, category: constants.shops.categories.orders}),
		this.query('v1/settings/emoji'),
		this.query('v1/settings/forum'),
	]);
}

function getData(data)
{
	const [order, userEmojiSettings, forumSettings] = data;

	return {
		order,
		userEmojiSettings,
		markupStyle: forumSettings.markupStyle
	};
}

export default OrderPage;
