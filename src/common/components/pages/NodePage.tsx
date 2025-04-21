import { Fragment } from 'react';
import { useLocation, Link } from 'react-router';

import Node from '@/components/nodes/Node.tsx';
import NodeWritingInterface from '@/components/nodes/NodeWritingInterface.tsx';
import { Pagination, Search, Accordion } from '@layout';
import { Form, Check, Switch } from '@form';
import { constants, dateUtils, routerUtils } from '@utils';
import { UserContext } from '@contexts';
import { APIThisType, NodesType, LocationType } from '@types';

export const action = routerUtils.formAction;

const NodePage = ({ loaderData }: { loaderData: NodePageProps }) =>
{
	const { node, childNodes, page, pageSize, totalCount, addUsers, order, reverse,
		locked, editNode, currentUserEmojiSettings, breadcrumb, nodeUsersEmojiSettings,
		boards, subBoards, staffBoards, archivedBoards, listBoards, userDonations } = loaderData;

	const uniqueCategories = Array.from(new Set(childNodes.map(n => n.forumCategory?.id)))
		// @ts-ignore typescript
		.map(id => childNodes.find(n => n.forumCategory?.id === id).forumCategory)
		// @ts-ignore typescript
		.sort((a, b) => a.id - b.id);

	const sortedChildNodes = [
		...uniqueCategories
			.map(cat => childNodes
			// @ts-ignore typescript
			.filter(n => n.forumCategory && n.forumCategory.id === cat.id)
			// @ts-ignore typescript
			.sort((a, b) => a.forumCategory.order - b.forumCategory.order)),
		childNodes.filter(n => !n.forumCategory),
	];

	const location = useLocation() as LocationType;

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
			{node.type === 'board' && !listBoards.includes(node.id) && node.id !== constants.boardIds.publicThreads &&
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

						{!archivedBoards.includes(node.id) &&
							<Form.Group>
								<Switch
									name='locked'
									label='Show Locked'
									value={locked}
								/>
							</Form.Group>
						}
					</Search>
				</div>
			}

			{node.id === constants.boardIds.privateThreads &&
				<Form action='v1/node/remove' id='removeFromPTs' />
			}

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
								nodeUsersEmojiSettings.filter(s => s.userId === node.user?.id) :
								[]}
							currentUser={currentUser}
							subBoards={subBoards.filter(b => b.parentId === node.id)}
							parentPermissions={node.permissions}
							listBoards={listBoards}
						/>

						{node.parentId === constants.boardIds.privateThreads && node.users.length > 0 &&
							<div className='Node_invitedUsers'>
								<Accordion
									data={[
										{
											title: 'Invited Users',
											description: <ul>
												{node.users.map(({ username, granted, id, viewed }, index) =>
													<li key={index} className={granted ? `` : `removed`}>
														<Link to={`/profile/${encodeURIComponent(id)}`}>
															{username}
														</Link>{viewed ? ` (${formatDate(viewed)})` : ''}
													</li>,
												)}
											</ul>,
											fallback: <div className='AccordionFallback'>
												<span>Invited Users: </span>
												<ul>
													{node.users.map(({ username, granted, id, viewed }, index) =>
														<li key={index} className={granted ? `` : `removed`}>
															<Link to={`/profile/${encodeURIComponent(id)}`}>
																{username}
															</Link>{viewed ? ` (${formatDate(viewed)})` : ''}
														</li>,
													)}
												</ul>
											</div>,
										},
									]}
								/>
							</div>
						}

						<Pagination
							page={page}
							pageSize={pageSize}
							totalCount={totalCount}
							startLink={`${pageLink}/${encodeURIComponent(node.id)}`}
							queryParam={false}
							endLink={link}
						/>

						{
							sortedChildNodes.map((list, listIndex) =>
							{
								const header =
									uniqueCategories.length > 0 && list.length > 0 && list[0].forumCategory?.id ?
										<article className='Node Node_forumCategory'>
											<div className='Node_main'>
												<h1 className='Node_title'>{uniqueCategories.find(c => !!c && c?.id === list[0].forumCategory?.id)?.title ?? ''}</h1>
											</div>
										</article> :
										<></>;

								return <Fragment key={listIndex}>
									{header}
									{list.map((child, index) =>
										<Node
											{...child}
											index={page > 1 ? index + 1 + pageSize * (page - 1) : index + 1}
											key={child.revisionId ?? child.id}
											page={page}
											emojiSettings={child.user !== null ?
												nodeUsersEmojiSettings.filter(s => s.userId === child.user?.id) :
												[]}
											currentUser={currentUser}
											followNode={node.id === constants.boardIds.publicThreads}
											subBoards={subBoards.filter(b => b.parentId === child.id)}
											parentPermissions={node.permissions}
											nodeParentId={node.id}
											pageLink={pageLink}
											listBoards={listBoards}
										/>,
									)}
								</Fragment>;
							})
						}

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

			{childNodes.length > 0 && node.permissions.includes('lock') && node.type === 'board' && !listBoards.includes(node.id) &&
				<div className='Node_boardActions'>
					<Form action='v1/node/lock' id='lockThreads' showButton buttonText='Lock selected' />
				</div>
			}

			{editNode ?
				editNode.permissions.indexOf('edit') > -1 && !node.locked &&
					<NodeWritingInterface
						parentId={editNode.id}
						parentType={editNode.type}
						permissions={node.permissions}
						lastPage={page}
						parentTitle={node.title}
						parentContent={editNode.content}
						threadId={node.id}
						emojiSettings={currentUserEmojiSettings}
						nodeParentId={node.parentId}
						files={editNode.files}
						staffBoards={staffBoards}
						userDonations={userDonations}
						threadType={node.threadType}
						markupStyle={node.markupStyle}
					/>
				:
				node.permissions.indexOf('reply') > -1 && node.type !== 'post' &&
					<NodeWritingInterface
						parentId={node.id}
						parentType={node.type}
						permissions={node.permissions}
						lastPage={Math.ceil((totalCount + 1) / pageSize)}
						addUsers={addUsers}
						nodeParentId={node.parentId}
						threadType={node.id === constants.boardIds.announcements ? 'admin' : node.threadType}
						threadId={node.id}
						parentTitle={node.permissions.includes('edit') ? node.title : ''}
						emojiSettings={currentUserEmojiSettings}
						boards={boards}
						markupStyle={node.markupStyle}
						staffBoards={staffBoards}
						userDonations={userDonations}
					/>
			}
		</>
	);
};

function formatDate(date: string): string
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

async function loadData(this: APIThisType, { id, page, editId }: { id: string, page?: string, editId?: string }, { addUsers, locked, order, reverse }: { addUsers?: string, locked?: string, order?: string, reverse?: string }): Promise<NodePageProps>
{
	const [returnValue] = await Promise.all([
		this.query('v1/nodes', {
			id: id,
			page: page,
			editId: editId,
			locked: locked ? locked : false,
			order: order,
			reverse: reverse,
		}),
	]);

	return {
		node: returnValue.node,
		breadcrumb: returnValue.breadcrumb,
		childNodes: returnValue.childNodes,
		page: returnValue.page,
		totalCount: returnValue.totalCount,
		pageSize: returnValue.pageSize,
		addUsers: addUsers,
		reverse: returnValue.reverse,
		order: returnValue.order,
		locked: returnValue.locked,
		editNode: returnValue.editNode,
		currentUserEmojiSettings: returnValue.currentUserEmojiSettings,
		nodeUsersEmojiSettings: returnValue.nodeUsersEmojiSettings,
		boards: returnValue.boards,
		subBoards: returnValue.subBoards,
		staffBoards: returnValue.staffBoards,
		archivedBoards: returnValue.archivedBoards,
		listBoards: returnValue.listBoards,
		userDonations: returnValue.userDonations,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type NodePageProps = NodesType & {
	addUsers?: string
};

export default NodePage;
