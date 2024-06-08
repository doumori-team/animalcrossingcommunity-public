import React, { useState } from 'react';
import { Link, useAsyncValue } from 'react-router-dom';

import { RequireUser, RequirePermission } from '@behavior';
import { Form, Check, Select, Switch, Alert, RichTextArea, Text } from '@form';
import { Pagination, Header, Section, Search, Grid } from '@layout';
import { utils, constants } from '@utils';
import { UserContext } from '@contexts';

const ShopThreadsPage = () =>
{
	const {totalCount, threads, page, pageSize, shopId, category, shops, type,
		status, waitlisted, locked, userEmojiSettings, markupStyle} = getData(useAsyncValue());

	const [selectedCategory, setSelectedCategory] = useState(category);
	const [selectedShopId, setSelectedShopId] = useState(shopId);

	const link = `&shopId=${encodeURIComponent(selectedShopId)}
		&category=${encodeURIComponent(selectedCategory)}
		&type=${encodeURIComponent(type)}
		&status=${encodeURIComponent(status)}
		&waitlisted=${encodeURIComponent(waitlisted)}
		&locked=${encodeURIComponent(locked)}
	`;

	const changeCategory = (e) =>
	{
		setSelectedCategory(e.target.value);
	}

	const changeShop = (e) =>
	{
		setSelectedShopId(Number(e.target.value));
	}

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

				{shops.length > 0 && (
					<>
					{selectedCategory == constants.shops.categories.orders && (
						<UserContext.Consumer>
							{user => user && (
								(user.awayStartDate && user.awayEndDate) && (
									<Alert>
										You are currently away and cannot claim orders.
									</Alert>
								)
							)}
						</UserContext.Consumer>
					)}

					<Search callback='/shops/threads'>
						<Form.Group>
							<Select
								label='Shop'
								name='shopId'
								value={selectedShopId}
								options={shops}
								optionsMapping={{value: 'id', label: 'name'}}
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

						{selectedShopId > 0 && (
							<>
							{selectedCategory === constants.shops.categories.orders && (
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
							)}

							{selectedCategory === constants.shops.categories.applications && (
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
							)}

							{selectedCategory === constants.shops.categories.threads && (
								<>
								<Form.Group>
									<Switch
										name='locked'
										label='Show Locked'
										value={locked}
									/>
								</Form.Group>
								</>
							)}
							</>
						)}
					</Search>
					</>
				)}

				<Section>
					<Grid options={threads} message={`No threads found.`}>
						{threads.map((thread, index) => {
							if (category === constants.shops.categories.orders)
							{
								return (
									<section className='ShopThreadsPage_order' key={index}>
										<div className='ShopThreadsPage_links'>
											{thread.claim && (
												<Link to={`/shop/order/${encodeURIComponent(thread.id)}`}>
													Claim
												</Link>
											)}
										</div>
										<div>
											{thread.nodeId ? (
												<>Order #: <Link to={`/shops/threads/${encodeURIComponent(thread.nodeId)}`}>{thread.id}</Link></>
											) : (
												<>Order #: {thread.id}</>
											)}
										</div>

										{thread.employee && (
											<div>
												Employee: <Link to={`/profile/${encodeURIComponent(thread.employee.id)}`}>{thread.employee.username}</Link>
											</div>
										)}

										<div>
											Customer: <Link to={`/profile/${encodeURIComponent(thread.customer.id)}`}>{thread.customer.username}</Link>
										</div>

										<div>
											Shop: <Link to={`/shop/${encodeURIComponent(thread.shop.id)}`}>{thread.shop.name}</Link>
										</div>

										<div>
											Ordered: {thread.formattedDate}
										</div>

										<div>
											Service: {thread.service} ({thread.game.shortname})
										</div>

										<div>
											Status: {thread.status}
										</div>
									</section>
								);
							}
							else if (category === constants.shops.categories.applications)
							{
								return (
									<section className='ShopThreadsPage_application' key={index}>
										<div className='ShopThreadsPage_links'>
											{thread.contact && (
												<Link to={`/shop/application/${encodeURIComponent(thread.id)}`}>
													Contact User
												</Link>
											)}
										</div>
										<div>
											{thread.nodeId ? (
												<>Application #: <Link to={`/shops/threads/${encodeURIComponent(thread.nodeId)}`}>{thread.id}</Link></>
											) : (
												<>Application #: {thread.id}</>
											)}
										</div>

										<div>
											User: <Link to={`/profile/${encodeURIComponent(thread.user.id)}`}>{thread.user.username}</Link>
										</div>

										<div>
											Shop: <Link to={`/shop/${encodeURIComponent(thread.shop.id)}`}>{thread.shop.name}</Link>
										</div>

										<div>
											Applied: {thread.formattedDate}
										</div>

										<div>
											Role: {thread.role}<br/>
											Games:
											<ul>
												{thread.games.map(game =>
													<li key={game.id}>
														{game.shortname}
													</li>
												)}
											</ul>
										</div>

										<div>
											Waitlisted: {thread.waitlisted ? 'Yes' : 'No'}
										</div>
									</section>
								);
							}
							else if (category === constants.shops.categories.threads)
							{
								let link = `/shops/threads/${encodeURIComponent(thread.id)}`;

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

				{shops.some(s => s.employee) && (
					<fieldset className='NodeWritingInterface'>
						<Form action='v1/shop/node/create' callback='/shops/threads/:id' showButton>
							<div role='group'>
								<h1 className='NodeWritingInterface_heading'>
									Post a new shop thread
								</h1>
							</div>

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

							<Select
								label='Shop'
								name='shopId'
								options={shops.filter(s => s.employee)}
								optionsMapping={{value: 'id', label: 'name'}}
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
								maxLength={constants.max.post}
								required
							/>
						</Form>
					</fieldset>
				)}
			</RequirePermission>
		</div>
	);
}

export async function loadData(_, {page, shopId, category, type, status, waitlisted, locked})
{
	return Promise.all([
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
}

function getData(data)
{
	const [returnValue, userEmojiSettings] = data;

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

export default ShopThreadsPage;
