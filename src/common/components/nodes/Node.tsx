import { Fragment, useState } from 'react';
import { Link, useLocation } from 'react-router';

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

	const DotSeparator = () => <div className='Node_dotSeparator'>•</div>;

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
								{unreadTotal !== null && unreadTotal > 0 &&
									<div className='Node_unreadIndicator' >
										<img src={`${constants.AWS_URL}/images/icons/icon_new_replies.png`} alt='New replies' title='New replies' />
									</div>
								}
								{threadType === 'sticky' &&
									<img src={`${constants.AWS_URL}/images/icons/sticky.png`} alt='Sticky' title='Sticky' />
								}
								{threadType === 'admin' &&
									<img src={`${constants.AWS_URL}/images/icons/admin.png`} alt='Locked' title='Locked' />
								}
								<Link
									className={locked ? `locked` : ''}
									to={link}
									reloadDocument={link.includes(`#${latestPost}`)}
								>
									{title}
								</Link>
							</h1>
							<div className='Node_controls'>
								{displaying.titleInfo && type === 'thread' &&
									<div className='Node_extra'>
										<ReportProblem
											type={constants.userTicket.types.thread}
											id={revisionId}
										/>
									</div>
								}
								{displaying.follow &&
									<RequireUser silent>
										<Form
											action='v1/node/follow'
											updateFunction={updateNode}
											formId={`node-follow-${id}`}
										>
											<input type='hidden' name='id' value={id} />
											<input
												type='image'
												src={curFollowed ?
													`${constants.AWS_URL}/images/icons/followed.png` :
													`${constants.AWS_URL}/images/icons/unfollowed.png`}
												title={curFollowed ?
													'Unfollow' :
													'Follow'}
											/>
										</Form>
									</RequireUser>
								}
								{displaying.nodesCheckbox &&
									<Checkbox
										name='nodeIds'
										value={id}
										label='Remove Yourself'
										hideLabels
										form='removeFromPTs'
									/>
								}
								{!displaying.breadcrumb && !displaying.nodesCheckbox && type === 'thread' && parentPermissions.includes('lock') && permissions.includes('lock') && locked === null && !listBoards.includes(nodeParentId) &&
									<Checkbox
										name='nodeIds'
										value={id}
										label='Lock Thread'
										hideLabels
										form='lockThreads'
									/>
								}
								{displaying.removeMe &&
								<Button
									type='submit'
									label='Remove me from checked'
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
									formId={`node-remove-${id}`}
								>
									<input type='hidden' name='nodeIds' value={id} />
								</Form>
								}
							</div>
						</div>
						{displaying.titleInfo && (conciseMode > 2 || displaying.board) &&
							<div className='Node_secondLine'>
								{conciseMode > 2 && <div className='Node_postedBy'>
									<span>
										Posted by{' '}
										{
											currentUser ? <Link to={`/profile/${user?.id}`}>{user?.username}</Link> : <>{user?.username}</>
										}
									</span>
									{displaying.board &&
										<>
											{' '}in{' '}
											{parentId ?
												<Link to={`/forums/${parentId}`}><span className='Node_board'>{board}</span></Link> :
												<span className='Node_board'>{board}</span>
											}
										</>
									}
									{conciseMode > 3 &&
										<span className='Node_created'>
											{' '}on{' '}{formattedCreated}
										</span>
									}
								</div>
								}
								{conciseMode > 3 && lastReply &&
									<div className='Node_latestPost'>
										Latest post: <span>
											{lastReply}
										</span>
									</div>
								}
							</div>
						}
						{displaying.titleInfo && conciseMode > 1 &&
							<div className='Node_thirdLine'>
								<span className='Node_replyCount'>
									{replyCount} {replyCount === 1 ? 'reply' : 'replies'}{unreadTotal !== null ? ` (${unreadTotal} new)` : ''}
									{displaying.follow && conciseMode > 2 &&
										<RequirePermission permission='view-followers' silent>
											<span className='Node_followed'>
												,{' '}{curNumFollowed}{' '}follower{curNumFollowed === 1 ? '' : 's'}
											</span>
										</RequirePermission>
									}
								</span>
							</div>
						}
					</>
				}
				{(displaying.permalink || displaying.dates || displaying.edits) &&
					<div className='Node_metadata'>
						{displaying.permalink &&
							<><Link to={`/${pageLink}/${encodedParentId}/${encodedPage}#${encodedId}`}>
								{'#'}{index}
							</Link><DotSeparator/></>
						}
						{displaying.dates &&
							<>
								{formatDate(created)}
								<DotSeparator/>
							</>
						}
						{displaying.edits &&
							<>
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
											<DotSeparator/>
										</>
									}
								</PermissionsContext.Consumer>
							</>
						}
						<RequirePermission permission='report-content' silent>
							<><ReportProblem type={constants.userTicket.types.post} id={revisionId} /><DotSeparator/></>
						</RequirePermission>
						{permissions.includes('edit') && !locked &&
							<><Link reloadDocument to={`/${pageLink}/${encodedParentId}/${encodedPage}/${encodedId}#TextBox`}>
								<img
									src={`${constants.AWS_URL}/images/icons/edit.png`}
									alt='Edit Post'
								/>
							</Link><DotSeparator/></>
						}
						<RequireUser silent>
							{currentUser?.id !== user?.id &&
								<>
									<RequirePermission permission='use-friend-codes' silent>
										<Confirm
											action='v1/friend_code/whitelist/save'
											formId={`friend-code-save-${id}`}
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
										/><DotSeparator/>
									</RequirePermission>
									<RequirePermission permission='use-buddy-system' silent>
										<Form
											action='v1/users/buddy/save'
											defaultSubmitImage={`${constants.AWS_URL}/images/icons/buddy.png`}
											imageTitle={`Add ${user?.username} to your buddy list`}
											formId={`users-buddy-save-${id}`}
										>
											<input type='hidden' name='buddyUsers' value={user?.username} />
											<input type='hidden' name='action' value='add' />
										</Form><DotSeparator/>
									</RequirePermission>
									<>
										<Link reloadDocument to={`/forums/${constants.boardIds.privateThreads}?addUsers=${user?.username}#TextBox`}>
											<img
												src={`${constants.AWS_URL}/images/icons/pt.png`}
												title={`Send a PT to ${user?.username}`}
												alt={`Send a PT to ${user?.username}`}
											/>
										</Link>
									</>
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
						Sub-forums: {subBoards.map((b, i) => <Fragment key={i}>
							{i > 0 && ', '}
							<Link to={`/forums/${encodeURIComponent(b.id)}`}>{b.title}</Link>
						</Fragment>)}
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
