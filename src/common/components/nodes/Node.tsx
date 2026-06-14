import { Fragment, useState } from 'react';
import { Link, useLocation } from 'react-router';

import { RequireUser, RequirePermission, RequireClientJS } from '@behavior';
import PostAuthorInfo from '@/components/nodes/PostAuthorInfo.tsx';
import { dateUtils, constants, utils } from '@utils';
import { Form, Checkbox, Button, Confirm } from '@form';
import { NodeType, UserType, LocationType, NodeChildNodesType, NodeBoardType, EmojiSettingType, BirthdaysType, ReactionType } from '@types';
import { Breadcrumb, ReportProblem, Markup, PhotoSlideshow, PhotoGallery, FontAwesomeIcon, EmojiPicker, EmojiUsersModal } from '@layout';
import { PermissionsContext } from '@contexts';
import { iso } from 'common/iso.ts';

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
	// @ts-ignore typescript
	edits,
	// @ts-ignore typescript
	postNumber,
	// @ts-ignore typescript
	user,
	id,
	childLength = 0,
	followNode,
	parentId,
	parentId2,
	// @ts-ignore typescript
	threadType,
	// @ts-ignore typescript
	locked,
	// @ts-ignore typescript
	board,
	// @ts-ignore typescript
	lastReply,
	// @ts-ignore typescript
	created,
	// @ts-ignore typescript
	revisionId,
	// @ts-ignore typescript
	permissions,
	// @ts-ignore typescript
	page,
	emojiSettings,
	// @ts-ignore typescript
	numFollowed,
	followed,
	notified,
	currentUser,
	// @ts-ignore typescript
	latestPage,
	// @ts-ignore typescript
	latestPost,
	subBoards,
	// @ts-ignore typescript
	replyCount,
	// @ts-ignore typescript
	unread,
	// @ts-ignore typescript
	unreadTotal,
	parentPermissions = [],
	// @ts-ignore typescript
	files,
	// @ts-ignore typescript
	reactions,
	// @ts-ignore typescript
	showImages,
	// @ts-ignore typescript
	conciseMode = 3,
	// @ts-ignore typescript
	formattedCreated,
	pageLink = 'forums',
	listBoards = [],
	// @ts-ignore typescript
	userDonations = {
		id: 0,
		donations: 0,
		perks: 0, // this is the only one that's used
		monthlyPerks: 0,
	},
	liveMode = false,
	// @ts-ignore typescript
	nodeQuotes,
	setText,
	// @ts-ignore typescript
	hidePostEmojis,
	birthdays,
	// @ts-ignore typescript
	polls,
	accEmojis,
}: NodeProps) =>
{
	const [curFollowed, setCurFollowed] = useState<boolean>(followed);
	const [curNotified, setCurNotified] = useState<boolean>(notified);
	const [curNumFollowed, setCurNumFollowed] = useState<number>(numFollowed);
	const [fileIndex, setFileIndex] = useState<number>(-1);
	const [curReactions, setCurReactions] = useState<NodeType['reactions']>(reactions);

	const location = useLocation() as LocationType;

	const DotSeparator = () => <div className='Node_dotSeparator'>•</div>;

	const updateNode = (data: NodeType) =>
	{
		setCurFollowed(data.followed);
		setCurNumFollowed(data.numFollowed);
		setCurReactions(data.reactions);
		setCurNotified(data.notified);
	};

	const reactToPost = async (data: { id: string }) =>
	{
		let params = {
			id: id,
			emoji: data.id,
		};

		(await iso).query(null, 'v1/node/react', params)
			.then((data: NodeType) =>
			{
				setCurReactions(data.reactions);
			})
			.catch((_: unknown) =>
			{
				// records error on server side
			});
	};

	// Each of the individual parts of a node display can be turned on or
	// off individually. This object contains the conditionals used to test
	// whether each one is enabled, to avoid cluttering up the If-statements
	// below.
	let displaying: {
		breadcrumb: boolean
		content: boolean
		dates: boolean
		edits: boolean
		permalink: boolean
		signature: boolean
		title: boolean
		user: boolean
		removeMe: boolean
		board: boolean | undefined
		titleInfo: boolean
		nodesCheckbox: boolean
		follow: boolean
		boards: boolean | undefined
		removeMe2: boolean
		react: boolean
	} = {
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
			postNumber > 0
			&& !title
		),
		signature: !!(
			type === 'post'
			&& !!user
			&& 'signature' in user
			&& user.signature
			&& !liveMode
		),
		title: !!title,
		user: !!(
			user
			&& type === 'post'
		),
		removeMe: id === constants.boardIds.privateThreads && childLength > 0,
		board: followNode,
		titleInfo: false,
		nodesCheckbox: false,
		follow: false,
		boards: false,
		removeMe2: false,
		react: type === 'post' && !hidePostEmojis,
	};

	displaying.titleInfo = !displaying.breadcrumb && type === 'thread';
	displaying.nodesCheckbox = !displaying.breadcrumb && parentId === constants.boardIds.privateThreads && location.pathname.includes(`/forums/${constants.boardIds.privateThreads}`);
	displaying.follow = parentId !== constants.boardIds.privateThreads && (parentId2 !== null && ![constants.boardIds.shopThread, constants.boardIds.adopteeThread].includes(parentId2) || parentId2 === null) && ![constants.boardIds.publicThreads, constants.boardIds.staffThreads, constants.boardIds.accForums, constants.boardIds.announcements, constants.boardIds.privateThreads].includes(id);
	displaying.boards = subBoards && subBoards.length > 0;
	displaying.removeMe2 = parentId === constants.boardIds.privateThreads && displaying.breadcrumb;

	let className = 'Node';

	if (displaying.user && !!user)
	{
		if ('group' in user)
		{
			className += ` Node-${user.group?.identifier}`;
		}

		if (birthdays?.some(x => x.id === user.id))
		{
			className += ` Node-birthday`;
		}

		if (dateUtils.isSameCurrentDate(user.signupDate, 'yyyy-MM-dd'))
		{
			className += ` Node-anniversary`;
		}
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
	// @ts-ignore typescript
	const encodedParentId = encodeURIComponent(parentId);
	const encodedPage = encodeURIComponent(utils.safeNumber(page));

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

	const handleQuoteClick = (postId: number) =>
	{
		const selection = window.getSelection();
		const selectedText = selection?.toString().trim();

		const postElement = document.querySelector<HTMLElement>(`article[id='${postId}'] .Markup`);
		const postText = postElement?.innerText.trim();

		const textToQuote = selectedText || postText;

		if (!textToQuote)
		{
			return;
		}

		const format = document.getElementById('format') as HTMLSelectElement | null;

		const quotedMarkdown = `> ${textToQuote.replace(/\n/g, '\n> ')}\n\n`;
		const quotedTraditional = `[bq]${textToQuote}[/bq]\n\n`;

		if (setText)
		{
			setText(format && format.value === 'bbcode' ? quotedTraditional : quotedMarkdown);
		}

		const replyBox = document.querySelector<HTMLTextAreaElement>('#TextBox textarea');

		if (replyBox)
		{
			replyBox.focus();
		}
	};

	return (
		<article className={className} id={String(id)} key={id}>
			{displaying.user && !!user && 'signature' in user &&
				<PostAuthorInfo
					{...user}
					perks={userDonations.perks}
					birthdays={birthdays}
				/>
			}
			<div className='Node_main'>
				{displaying.title &&
					<>
						<div className='Node_titleLine'>
							<h2 className='Node_title'>
								{displaying.breadcrumb && !!breadcrumb &&
									<Breadcrumb segments={breadcrumb} />
								}
								{unreadTotal !== null && unreadTotal > 0 &&
									<div className='Node_unreadIndicator' >
										<img
											src={constants.allImages['icons/icon_new_replies.png']}
											alt='New replies'
											title='New replies'
										/>
									</div>
								}
								{threadType === 'sticky' &&
									<img
										src={constants.allImages['icons/sticky.png']}
										alt='Sticky'
										title='Sticky'
									/>
								}
								{threadType === 'admin' &&
									<img
										src={constants.allImages['icons/admin.png']}
										alt='Locked'
										title='Locked'
									/>
								}
								<Link
									className={locked ? `locked` : ''}
									to={link}
									reloadDocument={link.includes(`#${latestPost}`)}
								>
									{title}
								</Link>
							</h2>
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
												src={
													curFollowed
														? constants.allImages['icons/followed.png']
														: constants.allImages['icons/unfollowed.png']
												}
												title={curFollowed ?
													'Unfollow' :
													'Follow'}
											/>
										</Form>
										<Form
											action='v1/node/notify'
											updateFunction={updateNode}
											formId={`node-notify-${id}`}
										>
											<input type='hidden' name='id' value={id} />
											<input
												type='image'
												src={
													curNotified
														? constants.allImages['icons/notifications.png']
														: constants.allImages['icons/nonotifications.png']
												}
												title={curNotified ?
													'Mute' :
													'Notify'}
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
								{!displaying.breadcrumb && !displaying.nodesCheckbox && type === 'thread' && parentPermissions.includes('lock') && locked === null && (parentId !== null && !listBoards.includes(parentId)) &&
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
								{'#'}{postNumber}
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
						<ReportProblem type={constants.userTicket.types.post} id={revisionId}><DotSeparator/></ReportProblem>
						{permissions.includes('edit') && !locked &&
							<><Link reloadDocument to={`/${pageLink}/${encodedParentId}/${encodedPage}/${encodedId}#TextBox`}>
								<img
									src={constants.allImages['icons/edit.png']}
									alt='Edit Post'
								/>
							</Link><DotSeparator/></>
						}
						{displaying.follow &&
							<RequireClientJS>
								<Form
									action='v1/node/follow'
									updateFunction={updateNode}
									formId={`node-follow-${id}`}
								>
									<input type='hidden' name='id' value={id} />
									<input
										type='image'
										src={
											curFollowed
												? constants.allImages['icons/followed.png']
												: constants.allImages['icons/unfollowed.png']
										}
										title={curFollowed ?
											'Unfollow' :
											'Follow'}
									/>
								</Form>
								<DotSeparator/>
							</RequireClientJS>
						}
						<RequireUser silent>
							{currentUser && user && currentUser.id !== user.id &&
								<>
									<RequirePermission permission='use-friend-codes' silent>
										<Confirm
											action='v1/friend_code/whitelist/save'
											formId={`friend-code-save-${id}`}
											defaultSubmitImage={
												constants.allImages['icons/wifi.png']
											}
											imageTitle='Whitelist User'
											additionalBody={
												<>
													<input type='hidden' name='whiteListUser' value={user.username} />
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
											defaultSubmitImage={
												constants.allImages['icons/buddy.png']
											}
											imageTitle={`Add ${user.username} to your buddy list`}
											formId={`users-buddy-save-${id}`}
										>
											<input type='hidden' name='buddyUsers' value={user.username} />
											<input type='hidden' name='action' value='add' />
										</Form><DotSeparator/>
									</RequirePermission>
									<>
										<Link reloadDocument to={`/forums/${constants.boardIds.privateThreads}?addUsers=${user.username}#TextBox`}>
											<img
												src={constants.allImages['icons/pt.png']}
												title={`Send a PT to ${user.username}`}
												alt={`Send a PT to ${user.username}`}
											/>
										</Link>
										<DotSeparator/>
									</>
									{parentPermissions.includes('reply') && setText &&
										<RequireClientJS>
											<div className='Node_quote' onClick={() => handleQuoteClick(id)}>
												<FontAwesomeIcon
													name='quote-right'
													alt='Quote'
												/>
											</div>
											<DotSeparator/>
										</RequireClientJS>
									}
								</>
							}
						</RequireUser>
					</div>
				}

				{displaying.content && !!content &&
					<Markup
						text={content.text}
						// @ts-ignore typescript
						format={content.format}
						emojiSettings={emojiSettings}
						nodeQuotes={nodeQuotes}
						pageLink={`/${pageLink}/${encodedParentId}`}
						polls={polls}
						pollVoteApiCall='v1/node/vote'
						pollVoteRedirect={`/${pageLink}/${encodedParentId}`}
					/>
				}

				{displaying.boards && Array.isArray(subBoards) &&
					<div className='Node_boards'>
						Sub-forums: {subBoards.map((b, i) => <Fragment key={i}>
							{i > 0 && ', '}
							<Link to={`/forums/${encodeURIComponent(b.id)}`}>{b.title}</Link>
						</Fragment>)}
					</div>
				}

				{files?.length > 0 && files?.length <= constants.max.imagesPost && !!user && (
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

				{displaying.react &&
					<div className='Node_reactionsSection'>
						{permissions.includes('react') && accEmojis &&
							<EmojiPicker
								onEmojiSelect={reactToPost}
								accEmojis={accEmojis}
							/>
						}

						{curReactions.length > 0 &&
							<EmojiUsersModal nodeId={id}>
								<div className='Node_reactions'>
									{curReactions.slice(0, 3).map(reaction =>
										<div className='Node_reaction' key={reaction.emoji}>
											<img
												src={`${constants.AWS_URL}/images/games/nh/reactions/${reaction.src}.png`}
												alt={reaction.emoji}
												title={reaction.emoji}
											/>
										</div>,
									)}
									<span className='Node_reactionsCount'>
										{curReactions.reduce((sum, reaction) => sum + Number(reaction.count), 0).toLocaleString()}
									</span>
								</div>
							</EmojiUsersModal>
						}
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

type NodeProps = (NodeType | NodeChildNodesType | NodeBoardType) & {
	breadcrumb?: {
		id: number
		title: string
	}[]
	childLength?: number
	followNode?: boolean
	emojiSettings?: EmojiSettingType[]
	currentUser?: UserType | null
	subBoards?: NodeBoardType[]
	parentPermissions?: string[]
	pageLink?: string
	listBoards?: number[]
	liveMode?: boolean
	setText?: (value: string) => void
	birthdays?: BirthdaysType[]
	accEmojis?: ReactionType[]
};

export default Node;
