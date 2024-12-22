import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { RequireUser, RequirePermission } from '@behavior';
import PostAuthorInfo from '@/components/nodes/PostAuthorInfo.tsx';
import { dateUtils, constants } from '@utils';
import { Form, Checkbox, Button, Confirm } from '@form';
import { NodeType, UserType, LocationType, NodeChildNodesType, NodeBoardType, EmojiSettingType } from '@types';
import { Breadcrumb, ReportProblem, Markup, PhotoSlideshow, PhotoGallery } from '@layout';
import { PermissionsContext } from '@contexts';

/* Component for displaying a node. Work in progress.
 *
 * Accepts props:
 * - The return values of v1/node/full
 * - breadcrumb - optional array of objects with properties 'id' and 'title' - navigation links to put in the breadcrumb trail
 * - index - optional: the number of posts made before this one in the thread
 * - emojiSettings - user emoji settings, for preview and gendered emojis
 */
const Node = ({
	breadcrumb,
	title,
	content,
	type,
	edits,
	index = 0,
	user,
	id,
	childLength = 0,
	followNode,
	parentId,
	threadType,
	locked,
	board,
	lastReply,
	created,
	revisionId,
	permissions,
	page,
	emojiSettings,
	numFollowed,
	followed,
	currentUser,
	latestPage,
	latestPost,
	subBoards,
	replyCount,
	unread,
	unreadTotal,
	parentPermissions = [],
	files,
	showImages,
	conciseMode = 3,
	nodeParentId = 0,
	formattedCreated,
	pageLink = 'forums',
	listBoards = [],
	userDonations = {
		id: 0,
		donations: 0,
		perks: 0, // this is the only one that's used
		monthlyPerks: 0,
	},
}: NodeProps) =>
{
	const [curFollowed, setCurFollowed] = useState<boolean>(followed);
	const [curNumFollowed, setCurNumFollowed] = useState<number>(numFollowed);
	const [fileIndex, setFileIndex] = useState<number>(-1);

	const location = useLocation() as LocationType;

	const updateNode = (data: NodeType) =>
	{
		setCurFollowed(data.followed);
		setCurNumFollowed(data.numFollowed);
	};

	// Each of the individual parts of a node display can be turned on or
	// off individually. This object contains the conditionals used to test
	// whether each one is enabled, to avoid cluttering up the If-statements
	// below.
	let displaying: any = {
		breadcrumb: !!(
			breadcrumb
			&& breadcrumb.length > 0
			&& title
		),
		content: !!content,
		dates: !!(type === 'post'),
		edits: !!(
			type === 'post'
			&& edits > 0
		),
		permalink: !!(
			!isNaN(index)
			&& !title
		),
		signature: !!(
			type === 'post'
			&& !!user
			&& 'signature' in user
			&& user.signature
		),
		title: !!title,
		user: !!(
			user
			&& type === 'post'
		),
		removeMe: id === constants.boardIds.privateThreads && childLength > 0,
		board: followNode,
	};

	displaying.titleInfo = !displaying.breadcrumb && type === 'thread';
	displaying.nodesCheckbox = !displaying.breadcrumb && parentId === constants.boardIds.privateThreads && location.pathname.includes(`/forums/${constants.boardIds.privateThreads}`);
	displaying.follow = (type === 'thread' || type === 'board') &&
		parentId !== constants.boardIds.privateThreads && ![constants.boardIds.publicThreads, constants.boardIds.accForums, constants.boardIds.announcements, constants.boardIds.privateThreads].includes(id);
	displaying.boards = subBoards && subBoards.length > 0;
	displaying.removeMe2 = parentId === constants.boardIds.privateThreads && displaying.breadcrumb;

	let className = 'Node';

	if (displaying.user && !!user && 'group' in user)
	{
		className += ` Node-${user.group?.identifier}`;
	}
	else if (threadType === 'sticky')
	{
		className += ` Node-sticky`;
	}
	else if (threadType === 'admin')
	{
		className += ` Node-admin-locked`;
	}

	const encodedId = encodeURIComponent(id);
	const encodedParentId = encodeURIComponent(parentId);
	const encodedPage = encodeURIComponent(Number(page || 0));

	let link = `/${pageLink}/${encodedId}`;

	if (latestPage)
	{
		link += `/${encodeURIComponent(latestPage)}`;

		if (latestPost)
		{
			link += `#${encodeURIComponent(latestPost)}`;
		}
	}

	if (unread && !displaying.breadcrumb)
	{
		className += ` Node-unread`;
	}

	return (
		<article className={className} id={String(id)} key={id}>
			{displaying.user && !!user && 'signature' in user &&
				<PostAuthorInfo {...user} perks={userDonations.perks} />
			}
			<div className='Node_main'>
				{displaying.title &&
					<>
						<div className='Node_titleLine'>
							<h1 className='Node_title'>
								{displaying.breadcrumb && !!breadcrumb &&
								<Breadcrumb segments={breadcrumb} />
								}
								{displaying.nodesCheckbox &&
									<Checkbox
										name='nodeIds'
										value={id}
										label='Remove Yourself'
										hideLabel
										form='removeFromPTs'
									/>
								}
								{!displaying.breadcrumb && !displaying.nodesCheckbox && type === 'thread' && parentPermissions.includes('lock') && permissions.includes('lock') && locked === null && !listBoards.includes(nodeParentId) &&
									<Checkbox
										name='nodeIds'
										value={id}
										label='Lock Thread'
										hideLabel
										form='lockThreads'
									/>
								}
								{displaying.follow &&
									<RequireUser silent>
										<Form
											action='v1/node/follow'
											updateFunction={updateNode}
										>
											<input type='hidden' name='id' value={id} />
											<input
												type='image'
												src={curFollowed ?
													`${constants.AWS_URL}/images/icons/followed.png` :
													`${constants.AWS_URL}/images/icons/unfollowed.png`}
												title='Follow'
											/>
										</Form>
									</RequireUser>
								}
								{threadType === 'sticky' &&
									<img src={`${constants.AWS_URL}/images/icons/sticky.png`} alt='Sticky' />
								}
								{threadType === 'admin' &&
									<img src={`${constants.AWS_URL}/images/icons/admin.png`} alt='Lock' />
								}
								<Link
									className={locked ? `locked` : ''}
									to={link}
									reloadDocument={link.includes(`#${latestPost}`)}
								>
									{title}
								</Link>
							</h1>
							{displaying.removeMe &&
								<Button
									type='submit'
									label='Remove Me'
									className='Node_button'
									form='removeFromPTs'
								/>
							}
							{displaying.removeMe2 &&
								<Form
									action='v1/node/remove'
									showButton
									buttonText='Remove Me'
									callback={`/forums/${encodeURIComponent(constants.boardIds.privateThreads)}`}
								>
									<input type='hidden' name='nodeIds' value={id} />
								</Form>
							}
							{displaying.titleInfo &&
								<div className='Node_extra'>
									{displaying.follow &&
										<RequirePermission permission='view-followers' silent>
											<div className='Node_followed'>
												{curNumFollowed} <img
													src={`${constants.AWS_URL}/images/icons/followed.png`}
													alt='Favorite'
												/>
											</div>
										</RequirePermission>
									}
									{type === 'thread' &&
										<ReportProblem
											type={constants.userTicket.types.thread}
											id={revisionId}
										/>
									}
								</div>
							}
						</div>
						{displaying.titleInfo && conciseMode > 1 &&
							<div className='Node_secondLine'>
								<div className='Node_postedBy'>
									{currentUser ?
										<>
											Posted By: <Link to={`/profile/${user?.id}`}>
												{user?.username}
											</Link>
										</>
										:
										<>
											Posted By: {user?.username}
										</>
									}
								</div>
								{lastReply &&
									<div className='Node_latestPost'>
										Latest Post: <span>
											{lastReply}
										</span>
									</div>
								}
							</div>
						}
						{displaying.titleInfo && conciseMode > 2 &&
							<div className='Node_thirdLine'>
								<div className='Node_replyCount'>
									Replies: <span>
										{replyCount}{unreadTotal !== null ? ` (${unreadTotal})` : ''}
									</span>
								</div>
								{displaying.board &&
									<div className='Node_board'>
										Board: <span>
											{board}
										</span>
									</div>
								}
							</div>
						}
						{displaying.titleInfo && conciseMode > 3 &&
							<div className='Node_fourthLine'>
								<div className='Node_created'>
									Created: <span>
										{formattedCreated}
									</span>
								</div>
							</div>
						}
					</>
				}
				{(displaying.permalink || displaying.dates || displaying.edits) &&
					<div className='Node_metadata'>
						{displaying.permalink &&
							<><Link to={`/${pageLink}/${encodedParentId}/${encodedPage}#${encodedId}`}>
								{'#'}{index}
							</Link>{' • '}</>
						}
						{displaying.dates &&
							formatDate(created)
						}
						{displaying.edits &&
							<>{' • '}
								<PermissionsContext.Consumer>
									{userPerms => userPerms &&
										<>
											{userPerms.indexOf('view-edit-history') === -1 ?
												<>{edits} edit(s)</>
												:
												<Link to={`/forums/${encodedId}/history`}>
													{edits} edit(s)
												</Link>
											}
										</>
									}
								</PermissionsContext.Consumer>
							</>
						}
						<RequirePermission permission='report-content' silent>
							<>{' • '}<ReportProblem type={constants.userTicket.types.post} id={revisionId} /></>
						</RequirePermission>
						{permissions.includes('edit') && !locked &&
							<>{' • '}<Link reloadDocument to={`/${pageLink}/${encodedParentId}/${encodedPage}/${encodedId}#TextBox`}>
								<img
									src={`${constants.AWS_URL}/images/icons/edit.png`}
									alt='Edit Post'
								/>
							</Link></>
						}
						<RequireUser silent>
							{currentUser?.id !== user?.id &&
								<RequirePermission permission='use-friend-codes' silent>
									{' • '}<Confirm
										action='v1/friend_code/whitelist/save'
										defaultSubmitImage={`${constants.AWS_URL}/images/icons/wifi.png`}
										imageTitle='Whitelist User'
										additionalBody={
											<>
												<input type='hidden' name='whiteListUser' value={user?.username} />
												<input type='hidden' name='action' value='add' />
											</>
										}
										label='Whitelist User'
										message='Whitelisting this user will allow them to see all your Friend Codes. Do you wish to proceed?'
									/>
								</RequirePermission>
							}
							{currentUser?.id !== user?.id &&
								<RequirePermission permission='use-buddy-system' silent>
									{' • '}<Form
										action='v1/users/buddy/save'
										defaultSubmitImage={`${constants.AWS_URL}/images/icons/buddy.png`}
										imageTitle={`Add ${user?.username} to your buddy list`}
									>
										<input type='hidden' name='buddyUsers' value={user?.username} />
										<input type='hidden' name='action' value='add' />
									</Form>
								</RequirePermission>
							}
							{currentUser?.id !== user?.id &&
								<>
									{' • '}<Link reloadDocument to={`/forums/${constants.boardIds.privateThreads}?addUsers=${user?.username}#TextBox`}>
										<img
											src={`${constants.AWS_URL}/images/icons/pt.png`}
											title={`Send a PT to ${user?.username}`}
											alt={`Send a PT to ${user?.username}`}
										/>
									</Link>
								</>
							}
						</RequireUser>
					</div>
				}

				{displaying.content && !!content &&
					<Markup text={content.text} format={content.format} emojiSettings={emojiSettings} />
				}

				{displaying.boards && Array.isArray(subBoards) &&
					<div className='Node_boards'>
						Sub-forums: {subBoards.map((b, i) => <React.Fragment key={i}>
							{i > 0 && ', '}
							<Link to={`/forums/${encodeURIComponent(b.id)}`}>{b.title}</Link>
						</React.Fragment>)}
					</div>
				}

				{files?.length > 0 && !!user && (
					showImages ?
						<PhotoGallery
							userId={user?.id}
							files={files}
							reportType={constants.userTicket.types.postImage}
						/>
						:
						<>
							<Button
								type='button'
								label='View Image(s)'
								className='Node_link'
								clickHandler={() => setFileIndex(0)}
							/>

							<PhotoSlideshow
								userId={user?.id}
								files={files}
								reportType={constants.userTicket.types.postImage}
								fileIndex={fileIndex}
								setFileIndex={setFileIndex}
								key={fileIndex}
							/>
						</>

				)}

				{displaying.signature && !!user && 'signature' in user &&
					<div className='Node_signature'>
						<ReportProblem
							type={constants.userTicket.types.profileSignature}
							id={user?.id}
						/>
						<Markup
							text={user?.signature}
							format={user?.signatureFormat}
							emojiSettings={emojiSettings}
						/>
					</div>
				}
			</div>
		</article>
	);
};

function formatDate(date: string): string
{
	if (dateUtils.formatYear(date) === dateUtils.getCurrentYear())
	{
		return dateUtils.formatDateTime2(date);
	}
	else
	{
		return dateUtils.formatDateTime3(date);
	}
}

type NodeProps = (NodeType | NodeChildNodesType) & {
	breadcrumb?: {
		id: number
		title: string
	}[]
	index?: number
	childLength?: number
	followNode?: boolean
	page?: number
	emojiSettings?: EmojiSettingType[]
	currentUser?: UserType | null
	subBoards?: NodeBoardType[]
	parentPermissions?: string[]
	nodeParentId?: number
	pageLink?: string
	listBoards?: number[]
};

export default Node;
