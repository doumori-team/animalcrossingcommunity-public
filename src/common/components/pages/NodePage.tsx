import { Fragment, useState, useEffect, useContext, useRef, useLayoutEffect } from 'react';
import { useLocation, Link } from 'react-router';

import Node from '@/components/nodes/Node.tsx';
import NodeWritingInterface from '@/components/nodes/NodeWritingInterface.tsx';
import { Pagination, Search, Accordion, PhotoGallery } from '@layout';
import { Form, Check, Switch } from '@form';
import { constants, dateUtils, routerUtils } from '@utils';
import { UserContext } from '@contexts';
import { APIThisType, NodesType, LocationType, ElementClickType, NodeType, BirthdaysType, ReactionType } from '@types';
import { notifications } from '@hooks';

export const action = routerUtils.formAction;

const NodePage = ({ loaderData }: { loaderData: NodePageProps }) =>
{
	const { node, childNodes, page, pageSize, totalCount, addUsers, order, reverse,
		locked, editNode, currentUserEmojiSettings, breadcrumb, nodeUsersEmojiSettings,
		boards, subBoards, staffBoards, archivedBoards, listBoards, userDonations, liveMode,
		birthdays, accEmojis } = loaderData;

	const [livePosts, setLivePosts] = useState<NodeType[]>([]);
	const [curTextValue, setCurTextValue] = useState<string>('');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const nodesRef = useRef<any>(null);

	const userContext = useContext(UserContext);

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

	const updateLiveMode = (_: ElementClickType) =>
	{
		if (liveMode === true)
		{
			notifications.unsetLiveMode(userContext!.id, node.id);
			window.location.href = `/${pageLink}/${encodeURIComponent(node.id)}`;
			return;
		}
		else
		{
			const lastPage = Math.ceil(totalCount / pageSize);

			notifications.setLiveMode(userContext!.id, node.id);
			window.location.href = `/${pageLink}/${encodeURIComponent(node.id)}/${lastPage}?live=true`;
			return;
		}
	};

	const wsPost: NodeType | null = notifications.useNotifications(userContext?.id ?? 0, constants.webSocketTypes.post);

	useEffect(() =>
	{
		if (!wsPost || !liveMode)
		{
			return;
		}

		let curLivePosts = [...livePosts];
		curLivePosts.push(wsPost);
		setLivePosts(curLivePosts);
	}, [wsPost]);

	useLayoutEffect(() =>
	{
		const div = nodesRef.current;

		if (div)
		{
			div.scrollTop = div.scrollHeight;
		}
	}, [livePosts]);

	return (
		<>
			{node.type === 'board' && !listBoards.includes(node.id) && ![constants.boardIds.publicThreads, constants.boardIds.staffThreads].includes(node.id) &&
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
							emojiSettings={node.user ?
								nodeUsersEmojiSettings.filter(s => s.userId === node.user?.id) :
								[]}
							currentUser={currentUser}
							subBoards={subBoards.filter(b => b.parentId === node.id)}
							parentPermissions={node.permissions}
							listBoards={listBoards}
						/>

						{node.files?.length > constants.max.imagesPost && node.user &&
							<PhotoGallery
								userId={node.user.id}
								files={node.files}
								reportType={constants.userTicket.types.postImage}
							/>
						}

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

						{!liveMode &&
							<Pagination
								page={page}
								pageSize={pageSize}
								totalCount={totalCount}
								startLink={`${pageLink}/${encodeURIComponent(node.id)}`}
								queryParam={false}
								endLink={link}
							/>
						}

						<div className={`NodePage_nodes ${liveMode ? 'NodePage_nodesLive' : ''}`} ref={nodesRef}>
							{
								sortedChildNodes.map((list, listIndex) =>
								{
									const header =
										uniqueCategories.length > 0 && list.length > 0 && list[0].forumCategory?.id ?
											<article className='Node Node_forumCategory'>
												<div className='Node_main'>
													<h2 className='Node_title'>{uniqueCategories.find(c => !!c && c?.id === list[0].forumCategory?.id)?.title ?? ''}</h2>
												</div>
											</article> :
											<></>;

									return <Fragment key={listIndex}>
										{header}
										{list.map(child =>
											<Node
												{...child}
												key={'revisionId' in child ? child.revisionId : child.id}
												emojiSettings={'user' in child && child.user !== null ?
													nodeUsersEmojiSettings.filter(s => s.userId === child.user?.id) :
													[]}
												currentUser={currentUser}
												followNode={[constants.boardIds.publicThreads, constants.boardIds.staffThreads].includes(node.id)}
												subBoards={subBoards.filter(b => b.parentId === child.id)}
												parentPermissions={node.permissions}
												pageLink={pageLink}
												listBoards={listBoards}
												liveMode={liveMode}
												setText={setCurTextValue}
												birthdays={birthdays}
												accEmojis={accEmojis}
											/>,
										)}
									</Fragment>;
								})
							}

							{liveMode &&
								<div className='NodePage_liveMode'>
									{
										livePosts.map(child =>
											<Node
												{...child}
												key={child.revisionId ?? child.id}
												emojiSettings={child.user !== null ?
													nodeUsersEmojiSettings.filter(s => s.userId === child.user?.id) :
													[]}
												currentUser={currentUser}
												followNode={[constants.boardIds.publicThreads, constants.boardIds.staffThreads].includes(node.id)}
												subBoards={subBoards.filter(b => b.parentId === child.id)}
												parentPermissions={node.permissions}
												pageLink={pageLink}
												listBoards={listBoards}
												setText={setCurTextValue}
												birthdays={birthdays}
												accEmojis={accEmojis}
											/>,
										)
									}
								</div>
							}
						</div>
					</>
				}
			</UserContext.Consumer>

			{!liveMode &&
				<Pagination
					page={page}
					pageSize={pageSize}
					totalCount={totalCount}
					startLink={`${pageLink}/${encodeURIComponent(node.id)}`}
					queryParam={false}
					endLink={link}
				/>
			}

			{!liveMode && childNodes.length > 0 && node.permissions.includes('lock') && node.type === 'board' && !listBoards.includes(node.id) &&
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
						files={editNode.files.concat(node.files)}
						staffBoards={staffBoards}
						userDonations={userDonations}
						threadType={node.threadType}
						markupStyle={node.markupStyle}
						liveMode={liveMode}
						setLiveMode={updateLiveMode}
						text={curTextValue}
						setText={setCurTextValue}
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
						liveMode={liveMode}
						setLiveMode={updateLiveMode}
						text={curTextValue}
						setText={setCurTextValue}
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

async function loadData(this: APIThisType, { id, page, editId }: { id: string, page?: string, editId?: string }, { addUsers, locked, order, reverse, live }: { addUsers?: string, locked?: string, order?: string, reverse?: string, live?: string }): Promise<NodePageProps>
{
	const [returnValue, birthdays, accEmojis] = await Promise.all([
		this.query('v1/nodes', {
			id: id,
			page: page,
			editId: editId,
			locked: locked ? locked : false,
			order: order,
			reverse: reverse,
		}),
		this.query('v1/birthdays'),
		this.query('v1/reactions'),
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
		liveMode: live === 'true',
		birthdays: birthdays,
		accEmojis: accEmojis,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type NodePageProps = NodesType & {
	addUsers?: string
	liveMode: boolean
	birthdays: BirthdaysType[]
	accEmojis: ReactionType[]
};

export default NodePage;
