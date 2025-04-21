import { useState } from 'react';
import { Link } from 'react-router';

import { RequireUser, RequirePermission } from '@behavior';
import { Form, Check, Select, Switch, Alert, RichTextArea, Text } from '@form';
import { Pagination, Header, Section, Search, Grid } from '@layout';
import { utils, constants, routerUtils } from '@utils';
import { UserContext } from '@contexts';
import {
	APIThisType,
	ThreadsType,
	EmojiSettingType,
	ElementSelectType,
	ElementClickType,
	ThreadOrderType,
	ThreadApplicationType,
	ThreadType,
} from '@types';

export const action = routerUtils.formAction;

const ShopThreadsPage = ({ loaderData }: { loaderData: ShopThreadsPageProps }) =>
{
	const { totalCount, threads, page, pageSize, shopId, category, shops, type,
		status, waitlisted, locked, userEmojiSettings, markupStyle } = loaderData;

	const [selectedCategory, setSelectedCategory] = useState<ThreadsType['category']>(category);
	const [selectedShopId, setSelectedShopId] = useState<ThreadsType['shopId']>(shopId);

	const link = `&shopId=${encodeURIComponent(selectedShopId)}
		&category=${encodeURIComponent(selectedCategory)}
		&type=${encodeURIComponent(type)}
		&status=${encodeURIComponent(status)}
		&waitlisted=${encodeURIComponent(waitlisted)}
		&locked=${encodeURIComponent(locked)}
	`;

	const changeCategory = (e: ElementClickType): void =>
	{
		setSelectedCategory(e.currentTarget.value);
	};

	const changeShop = (e: ElementSelectType): void =>
	{
		setSelectedShopId(Number(e.target.value));
	};

	return (
		<div className='ShopThreadsPage'>
			<RequirePermission permission='view-shops'>
				<Header
					name='Orders, Applications & Other Threads'
					links={
						<>
							<RequireUser permission='modify-shops' silent>
								<Link to='/shops/add'>
									Create a Shop
								</Link>
							</RequireUser>
							<Link to='/shops'>
								Shops
							</Link>
						</>
					}
				/>

				{shops.length > 0 &&
					<>
						{selectedCategory === constants.shops.categories.orders &&
							<UserContext.Consumer>
								{user => user && (
									user.awayStartDate && user.awayEndDate &&
										<Alert>
											You are currently away and cannot claim orders.
										</Alert>

								)}
							</UserContext.Consumer>
						}

						<Search callback='/shops/threads'>
							<Form.Group>
								<Select
									label='Shop'
									name='shopId'
									value={selectedShopId}
									options={shops}
									optionsMapping={{ value: 'id', label: 'name' }}
									placeholder='Choose a shop...'
									changeHandler={changeShop}
								/>
							</Form.Group>

							<Form.Group>
								<Check
									label='Category'
									options={[
										{ id: constants.shops.categories.orders, name: 'Orders' },
										{ id: constants.shops.categories.applications, name: 'Applications' },
										{ id: constants.shops.categories.threads, name: 'Other Threads' },
									]}
									name='category'
									defaultValue={utils.realStringLength(selectedCategory) > 0 ?
										[selectedCategory] : [constants.shops.categories.orders]}
									onChangeHandler={changeCategory}
								/>
							</Form.Group>

							{selectedShopId > 0 &&
								<>
									{selectedCategory === constants.shops.categories.orders &&
										<>
											<Form.Group>
												<Check
													label='Type'
													options={[
														{ id: 'employee', name: 'Employee' },
														{ id: 'customer', name: 'Customer' },
														{ id: 'both', name: 'Both' },
													]}
													name='type'
													defaultValue={utils.realStringLength(type) > 0 ?
														[type] : ['both']}
												/>
											</Form.Group>
											<Form.Group>
												<Check
													label='Status'
													options={[
														{ id: 'unclaimed', name: 'Unclaimed' },
														{ id: 'in_progress', name: 'In Progress' },
														{ id: 'completed', name: 'Completed' },
														{ id: 'all', name: 'All' },
													]}
													name='status'
													defaultValue={utils.realStringLength(status) > 0 ?
														[status] : ['all']}
												/>
											</Form.Group>
										</>
									}

									{selectedCategory === constants.shops.categories.applications &&
										<>
											<Form.Group>
												<Check
													label='Waitlisted'
													options={constants.boolOptions}
													name='waitlisted'
													defaultValue={utils.realStringLength(waitlisted) > 0 ?
														[waitlisted] : ['both']}
												/>
											</Form.Group>
										</>
									}

									{selectedCategory === constants.shops.categories.threads &&
										<>
											<Form.Group>
												<Switch
													name='locked'
													label='Show Locked'
													value={locked}
												/>
											</Form.Group>
										</>
									}
								</>
							}
						</Search>
					</>
				}

				<Section>
					<Grid options={threads} message={`No threads found.`}>
						{threads.map((thread, index) =>
						{
							if (category === constants.shops.categories.orders)
							{
								const order = thread as ThreadOrderType;

								return (
									<section className='ShopThreadsPage_order' key={index}>
										<div className='ShopThreadsPage_links'>
											{order.claim &&
												<Link to={`/shop/order/${encodeURIComponent(thread.id)}`}>
													Claim
												</Link>
											}
										</div>
										<div>
											{order.nodeId ?
												<>Order #: <Link to={`/shops/threads/${encodeURIComponent(order.nodeId)}`}>{order.id}</Link></>
												:
												<>Order #: {order.id}</>
											}
										</div>

										{order.employee &&
											<div>
												Employee: <Link to={`/profile/${encodeURIComponent(order.employee.id)}`}>{order.employee.username}</Link>
											</div>
										}

										<div>
											Customer: <Link to={`/profile/${encodeURIComponent(order.customer.id)}`}>{order.customer.username}</Link>
										</div>

										<div>
											Shop: <Link to={`/shop/${encodeURIComponent(order.shop.id)}`}>{order.shop.name}</Link>
										</div>

										<div>
											Ordered: {order.formattedDate}
										</div>

										<div>
											Service: {order.service} ({order.game.shortname})
										</div>

										<div>
											Status: {order.status}
										</div>
									</section>
								);
							}
							else if (category === constants.shops.categories.applications)
							{
								const application = thread as ThreadApplicationType;

								return (
									<section className='ShopThreadsPage_application' key={index}>
										<div className='ShopThreadsPage_links'>
											{application.contact &&
												<Link to={`/shop/application/${encodeURIComponent(application.id)}`}>
													Contact User
												</Link>
											}
										</div>
										<div>
											{application.nodeId ?
												<>Application #: <Link to={`/shops/threads/${encodeURIComponent(application.nodeId)}`}>{application.id}</Link></>
												:
												<>Application #: {application.id}</>
											}
										</div>

										<div>
											User: <Link to={`/profile/${encodeURIComponent(application.user.id)}`}>{application.user.username}</Link>
										</div>

										<div>
											Shop: <Link to={`/shop/${encodeURIComponent(application.shop.id)}`}>{application.shop.name}</Link>
										</div>

										<div>
											Applied: {application.formattedDate}
										</div>

										<div>
											Role: {application.role}<br/>
											Games:
											<ul>
												{application.games.map(game =>
													<li key={game.id}>
														{game.shortname}
													</li>,
												)}
											</ul>
										</div>

										<div>
											Waitlisted: {application.waitlisted ? 'Yes' : 'No'}
										</div>
									</section>
								);
							}
							else if (category === constants.shops.categories.threads)
							{
								let link = `/shops/threads/${encodeURIComponent(thread.id)}`;

								thread = thread as ThreadType;

								if (thread.latestPage)
								{
									link += `/${encodeURIComponent(thread.latestPage)}`;

									if (thread.latestPost)
									{
										link += `#${encodeURIComponent(thread.latestPost)}`;
									}
								}

								return (
									<section className='ShopThreadsPage_thread' key={index}>
										<div>
											Thread #: <Link to={link} reloadDocument={link.includes(`#${thread.latestPost}`)}>{thread.id}</Link>
										</div>

										<div>
											Title: {thread.title}
										</div>

										<div>
											Shop: <Link to={`/shop/${encodeURIComponent(thread.shop.id)}`}>{thread.shop.name}</Link>
										</div>

										<div>
											Created: {thread.formattedDate}
										</div>
									</section>
								);
							}
						})}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`shops/threads`}
						endLink={link}
					/>
				</Section>

				{shops.some(s => s.employee) &&
					<fieldset className='NodeWritingInterface'>
						<Form action='v1/shop/node/create' callback='/shops/threads/:id' showButton>
							<div role='group'>
								<h1 className='NodeWritingInterface_heading'>
									Post a new shop thread
								</h1>
							</div>

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

							<Select
								label='Shop'
								name='shopId'
								options={shops.filter(s => s.employee)}
								optionsMapping={{ value: 'id', label: 'name' }}
								placeholder='Choose a shop...'
								required
							/>

							<RichTextArea
								textName='text'
								formatName='format'
								key={Math.random()}
								label='Post a new shop thread'
								emojiSettings={userEmojiSettings}
								formatValue={markupStyle ? markupStyle : 'markdown'}
								maxLength={constants.max.post1}
								required
							/>
						</Form>
					</fieldset>
				}
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, _: any, { page, shopId, category, type, status, waitlisted, locked }: { page?: string, shopId?: string, category?: string, type?: string, status?: string, waitlisted?: string, locked?: string }): Promise<ShopThreadsPageProps>
{
	const [returnValue, userEmojiSettings] = await Promise.all([
		this.query('v1/shop/threads', {
			page: page ? page : 1,
			shopId: shopId ? shopId : '',
			category: category ? category : constants.shops.categories.orders,
			type: type ? type : 'both',
			status: status ? status : 'all',
			waitlisted: waitlisted ? waitlisted : 'both',
			locked: locked ? locked : 'false',
		}),
		this.query('v1/settings/emoji'),
	]);

	return {
		threads: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		shops: returnValue.shops,
		category: returnValue.category,
		type: returnValue.type,
		status: returnValue.status,
		waitlisted: returnValue.waitlisted,
		locked: returnValue.locked,
		userEmojiSettings,
		shopId: returnValue.shopId,
		markupStyle: returnValue.markupStyle,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type ShopThreadsPageProps = {
	threads: ThreadsType['results']
	totalCount: ThreadsType['count']
	page: ThreadsType['page']
	pageSize: ThreadsType['pageSize']
	shops: ThreadsType['shops']
	category: ThreadsType['category']
	type: ThreadsType['type']
	status: ThreadsType['status']
	waitlisted: ThreadsType['waitlisted']
	locked: ThreadsType['locked']
	userEmojiSettings: EmojiSettingType[]
	shopId: ThreadsType['shopId']
	markupStyle: ThreadsType['markupStyle']
};

export default ShopThreadsPage;
