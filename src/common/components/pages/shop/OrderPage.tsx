import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { Form, Text, RichTextArea } from '@form';
import { Header, Section, ReportProblem } from '@layout';
import { constants, routerUtils } from '@utils';
import { APIThisType, ThreadOrderType, EmojiSettingType, MarkupStyleType } from '@types';

export const action = routerUtils.formAction;

const OrderPage = ({ loaderData }: { loaderData: OrderPageProps }) =>
{
	const { order, userEmojiSettings, markupStyle } = loaderData;

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

					{order.items.length > 0 &&
						<div className='OrderPage_items'>
							Item(s):
							<ul>
								{order.items.map(item =>
									<li key={item.id}>
										{item.name}, Qty: {item.quantity}
									</li>,
								)}
							</ul>
						</div>
					}

					{order.comment &&
						<div className='OrderPage_comment'>
							<ReportProblem type={constants.userTicket.types.shopOrder} id={order.id} />
							Comment: {order.comment}
						</div>
					}

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
							hideLabels
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
							maxLength={constants.max.post1}
							required
						/>
					</Form>
				</fieldset>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<OrderPageProps>
{
	const [order, userEmojiSettings, forumSettings] = await Promise.all([
		this.query('v1/shop/thread', { id: id, category: constants.shops.categories.orders, getItems: true }),
		this.query('v1/settings/emoji'),
		this.query('v1/settings/forum'),
	]);

	return {
		order,
		userEmojiSettings,
		markupStyle: forumSettings.markupStyle,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type OrderPageProps = {
	order: ThreadOrderType
	userEmojiSettings: EmojiSettingType[]
	markupStyle: MarkupStyleType
};

export default OrderPage;
