import React from 'react';
import { useAsyncValue, useLocation, Link } from 'react-router-dom';

import Node from '@/components/nodes/Node.js';
import NodeWritingInterface from '@/components/nodes/NodeWritingInterface.js';
import { Pagination, Search, ErrorMessage, Accordion } from '@layout';
import { Form, Check, Switch } from '@form';
import { constants, dateUtils } from '@utils';
import { UserContext } from '@contexts';

const NodePage = () =>
{
	const {node, childNodes, page, pageSize, totalCount, addUsers, order, reverse,
		locked, editNode, currentUserEmojiSettings, breadcrumb, nodeUsersEmojiSettings,
		boards, subBoards, error, staffBoards, archivedBoards, listBoards} = getData(useAsyncValue());

	const location = useLocation();

	/**
	 * routes.js for non-defered routes handles if it's a permission error by redirecting to homepage.
	 * I can't figure out how defer handles it - docs say useAsyncError with Loading errorElement but
	 * doesn't work. So basically if we hit an error, instead of showing RouteError page show permission
	 * error. Either node not found or don't have permission for node, permission error appropriate either way.
	 * Users will see if they try to access something like PTs and aren't logged in (link from Discord).
	 */
	if (error)
	{
		return (
			<ErrorMessage identifier='permission' />
		)
	}

	const link = node.type === 'board' ? `&order=${encodeURIComponent(order)}
		&reverse=${encodeURIComponent(reverse)}
		&locked=${encodeURIComponent(locked)}
	` : '';

	let pageLink = 'forums';

	if (location.pathname.includes('shop'))
	{
		pageLink = 'shops/threads';
	}
	else if (location.pathname.includes('scout-hub'))
	{
		pageLink = 'scout-hub/adoption';
	}

	return (
		<>
			{(node.type === 'board' && !listBoards.includes(node.id) && node.id != constants.boardIds.publicThreads) && (
				<div className='NodePage_filter' key={node.id}>
					<Search callback={`/forums/${encodeURIComponent(node.id)}`}>
						<Form.Group>
							<Check
								label='Sort By'
								options={constants.orderOptions.node}
								name='order'
								defaultValue={[order]}
							/>
						</Form.Group>
						<Form.Group>
							<Check
								label='Order'
								options={constants.reverseOptions}
								name='reverse'
								defaultValue={[reverse]}
							/>
						</Form.Group>

						{!archivedBoards.includes(node.id) && (
							<Form.Group>
								<Switch
									name='locked'
									label='Show Locked'
									value={locked}
								/>
							</Form.Group>
						)}
					</Search>
				</div>
			)}

			{node.id === constants.boardIds.privateThreads && (
				<Form action='v1/node/remove' id='removeFromPTs' />
			)}

			<UserContext.Consumer>
				{currentUser =>
					<>
					<Node
						key={`${node.id}-${node.followed}`}
						{...node}
						breadcrumb={breadcrumb}
						childLength={childNodes.length}
						page={page}
						emojiSettings={node.user ?
							nodeUsersEmojiSettings.filter(s => s.userId === node.user.id) :
							[]}
						currentUser={currentUser}
						subBoards={subBoards.filter(b => b.parentId === node.id)}
						parentPermissions={node.permissions}
						listBoards={listBoards}
					/>

					{(node.parentId === constants.boardIds.privateThreads && node.users.length > 0) && (
						<div className='Node_invitedUsers'>
							<Accordion
								data={[
									{
										title: 'Invited Users',
										description: <ul>
											{node.users.map(({username, granted, id, viewed}, index) =>
												<li key={index} className={granted ? `` : `removed`}>
													<Link to={`/profile/${encodeURIComponent(id)}`}>
														{username}
													</Link>{viewed ? ` (${formatDate(viewed)})` : ''}
												</li>
											)}
										</ul>,
										fallback: <div class='AccordionFallback'>
											<span>Invited Users: </span>
											<ul>
												{node.users.map(({username, granted, id, viewed}, index) =>
													<li key={index} className={granted ? `` : `removed`}>
														<Link to={`/profile/${encodeURIComponent(id)}`}>
															{username}
														</Link>{viewed ? ` (${formatDate(viewed)})` : ''}
													</li>
												)}
											</ul>
										</div>,
									}
								]}
							/>
						</div>
					)}

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`${pageLink}/${encodeURIComponent(node.id)}`}
						queryParam={false}
						endLink={link}
					/>

					{childNodes.map((child, index) =>
						<Node
							{...child}
							index={page > 1 ? index+1+(pageSize*(page-1)) : index+1}
							key={child.revisionId}
							page={page}
							emojiSettings={child.user ?
								nodeUsersEmojiSettings.filter(s => s.userId === child.user.id) :
								[]}
							currentUser={currentUser}
							followNode={node.id === constants.boardIds.publicThreads}
							subBoards={subBoards.filter(b => b.parentId === child.id)}
							parentPermissions={node.permissions}
							nodeParentId={node.id}
							pageLink={pageLink}
							listBoards={listBoards}
						/>
					)}
					</>
				}
			</UserContext.Consumer>

			<Pagination
				page={page}
				pageSize={pageSize}
				totalCount={totalCount}
				startLink={`${pageLink}/${encodeURIComponent(node.id)}`}
				queryParam={false}
				endLink={link}
			/>

			{(childNodes.length > 0 && node.permissions.includes('lock') && node.type === 'board' && !listBoards.includes(node.id)) && (
				<div className='Node_boardActions'>
					<Form action='v1/node/lock' id='lockThreads' showButton buttonText='Lock' />
				</div>
			)}

			{editNode ? (
					<>
					{(editNode.permissions.indexOf('edit') > -1 && !node.locked) &&
						<NodeWritingInterface
							parentId={editNode.id}
							parentType={editNode.type}
							permissions={node.permissions}
							lastPage={page}
							parentTitle={node.title}
							parentContent={editNode.content}
							threadId={node.id}
							key={Math.random()}
							emojiSettings={currentUserEmojiSettings}
							nodeParentId={node.parentId}
							files={editNode.files}
							staffBoards={staffBoards}
						/>
					}
					</>
			) : (
				<>
				{/* Only show the "new post/thread" form if the user has
					* permission to reply
					*/}
				{(node.permissions.indexOf('reply') > -1 && node.type !== 'post') &&
					<NodeWritingInterface
						parentId={node.id}
						parentType={node.type}
						permissions={node.permissions}
						lastPage={Math.ceil((totalCount+1) / pageSize)}
						addUsers={addUsers}
						nodeParentId={node.parentId}
						threadType={node.id === constants.boardIds.announcements ? 'admin' : node.threadType}
						key={Math.random()}
						threadId={node.id}
						parentTitle={node.permissions.includes('edit') ? node.title : ''}
						emojiSettings={currentUserEmojiSettings}
						boards={boards}
						markupStyle={node.markupStyle}
						staffBoards={staffBoards}
					/>
				}
				</>
			)}
		</>
	);
}

function formatDate(date)
{
	if (dateUtils.formatYear(date) === dateUtils.getCurrentYear())
	{
		return dateUtils.formatDateTime6(date);
	}
	else
	{
		return dateUtils.formatDateTime(date);
	}
}

export async function loadData({id, page, editId}, {addUsers, locked, order, reverse})
{
	return Promise.all([
		this.query('v1/nodes', {
			id: id,
			page: page,
			editId: editId,
			addUsers: addUsers,
			locked: locked ? locked : false,
			order: order,
			reverse: reverse,
		}),
	]);
}

function getData(data)
{
	if (data[0] === undefined)
	{
		return {
			error: 'unknown'
		};
	}

	const {node, breadcrumb, childNodes, page, totalCount, pageSize, addUsers,
		reverse, order, locked, editNode, currentUserEmojiSettings,
		nodeUsersEmojiSettings, boards, subBoards,
		staffBoards, archivedBoards, listBoards} = data[0];

	return {
		node,
		breadcrumb,
		childNodes,
		page,
		totalCount,
		pageSize,
		addUsers,
		reverse,
		order,
		locked,
		editNode,
		currentUserEmojiSettings,
		nodeUsersEmojiSettings,
		boards,
		subBoards,
		staffBoards,
		archivedBoards,
		listBoards,
	};
}

export default NodePage;
