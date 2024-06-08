import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';

import { RequireUser, RequirePermission } from '@behavior';
import PostAuthorInfo from '@/components/nodes/PostAuthorInfo.js';
import { dateUtils, constants } from '@utils';
import { Form, Checkbox, Button, Confirm } from '@form';
import { nodeShape, emojiSettingsShape, userShape } from '@propTypes';
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
const Node = ({breadcrumb, title, content, type, edits, index, user, id,
	childLength, followNode, parentId, users, threadType, locked, board, lastReply,
	created, revisionId, permissions, page, emojiSettings, numFollowed, followed,
	currentUser, latestPage, latestPost, subBoards, replyCount, unread, unreadTotal,
	parentPermissions, files, showImages, conciseMode, nodeParentId,
	formattedCreated, pageLink, listBoards, userDonations}) =>
{
	const [curFollowed, setCurFollowed] = useState(followed);
	const [curNumFollowed, setCurNumFollowed] = useState(numFollowed);
	const [fileIndex, setFileIndex] = useState(-1);

	const location = useLocation();

	const updateNode = (data) =>
	{
		setCurFollowed(data.followed);
		setCurNumFollowed(data.numFollowed);
	}

	// Each of the individual parts of a node display can be turned on or
	// off individually. This object contains the conditionals used to test
	// whether each one is enabled, to avoid cluttering up the If-statements
	// below.
	let displaying = {
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
		parentId != constants.boardIds.privateThreads && ![constants.boardIds.publicThreads, constants.boardIds.accForums, constants.boardIds.announcements, constants.boardIds.privateThreads].includes(id);
	displaying.boards = subBoards && subBoards.length > 0;
	displaying.removeMe2 = parentId === constants.boardIds.privateThreads && displaying.breadcrumb;

	let className = 'Node';

	if (displaying.user)
	{
		className += ` Node-${user.group.identifier}`;
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
	const encodedPage = encodeURIComponent(page);

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
		<article className={className} id={id} key={id}>
			{displaying.user &&
				<PostAuthorInfo {...user} perks={userDonations.perks} />
			}
			<div className='Node_main'>
				{displaying.title &&
					<>
					<div className='Node_titleLine'>
						<h1 className='Node_title'>
							{displaying.breadcrumb &&
								<Breadcrumb segments={breadcrumb} />
							}
							{displaying.nodesCheckbox && (
								<Checkbox
									name='nodeIds'
									value={id}
									label='Remove Yourself'
									hideLabel
									form='removeFromPTs'
								/>
							)}
							{(!displaying.breadcrumb && !displaying.nodesCheckbox && type === 'thread' && parentPermissions.includes('lock') && permissions.includes('lock') && locked === null && !listBoards.includes(nodeParentId)) && (
								<Checkbox
									name='nodeIds'
									value={id}
									label='Lock Thread'
									hideLabel
									form='lockThreads'
								/>
							)}
							{displaying.follow && (
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
							)}
							{threadType === 'sticky' && (
								<img src={`${constants.AWS_URL}/images/icons/sticky.png`} alt='Sticky' />
							)}
							{threadType === 'admin' && (
								<img src={`${constants.AWS_URL}/images/icons/admin.png`} alt='Lock' />
							)}
							<Link
								className={locked && `locked`}
								to={link}
								reloadDocument={link.includes(`#${latestPost}`)}
							>
								{title}
							</Link>
						</h1>
						{displaying.removeMe && (
							<Button
								type='submit'
								label='Remove Me'
								className='Node_button'
								form='removeFromPTs'
							/>
						)}
						{displaying.removeMe2 && (
							<Form
								action='v1/node/remove'
								showButton
								buttonText='Remove Me'
								callback={`/forums/${encodeURIComponent(constants.boardIds.privateThreads)}`}
							>
								<input type='hidden' name='nodeIds' value={id} />
							</Form>
						)}
						{displaying.titleInfo && (
							<div className='Node_extra'>
								{displaying.follow && (
									<RequirePermission permission='view-followers' silent>
										<div className='Node_followed'>
											{curNumFollowed} <img
												src={`${constants.AWS_URL}/images/icons/followed.png`}
												alt='Favorite'
											/>
										</div>
									</RequirePermission>
								)}
								{type === 'thread' && (
									<ReportProblem
										type={constants.userTicket.types.thread}
										id={revisionId}
									/>
								)}
							</div>
						)}
					</div>
					{(displaying.titleInfo && conciseMode > 1) && (
						<div className='Node_secondLine'>
							<div className='Node_postedBy'>
								{currentUser ? (
									<>
									Posted By: <Link to={`/profile/${user.id}`}>
										{user.username}
									</Link>
									</>
								) : (
									<>
									Posted By: {user.username}
									</>
								)}
							</div>
							{lastReply && (
								<div className='Node_latestPost'>
									Latest Post: <span>
										{lastReply}
									</span>
								</div>
							)}
						</div>
					)}
					{(displaying.titleInfo && conciseMode > 2) && (
						<div className='Node_thirdLine'>
							<div className='Node_replyCount'>
								Replies: <span>
									{replyCount}{unreadTotal !== null ? ` (${unreadTotal})` : ''}
								</span>
							</div>
							{displaying.board && (
								<div className='Node_board'>
									Board: <span>
										{board}
									</span>
								</div>
							)}
						</div>
					)}
					{(displaying.titleInfo && conciseMode > 3) && (
						<div className='Node_fourthLine'>
							<div className='Node_created'>
								Created: <span>
									{formattedCreated}
								</span>
							</div>
						</div>
					)}
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
								{userPerms => userPerms && (
									<>
									{userPerms.indexOf('view-edit-history') === -1 ? (
										<>{edits} edit(s)</>
									) : (
										<Link to={`/forums/${encodedId}/history`}>
											{edits} edit(s)
										</Link>
									)}
									</>
								)}
							</PermissionsContext.Consumer>
							</>
						}
						<RequirePermission permission='report-content' silent>
							<>{' • '}<ReportProblem type={constants.userTicket.types.post} id={revisionId} /></>
						</RequirePermission>
						{(permissions.includes('edit') && !locked) && (
							<>{' • '}<Link reloadDocument to={`/${pageLink}/${encodedParentId}/${encodedPage}/${encodedId}#TextBox`}>
								<img
									src={`${constants.AWS_URL}/images/icons/edit.png`}
									alt='Edit Post'
								/>
							</Link></>
						)}
						<RequireUser silent>
							{currentUser?.id !== user.id && (
								<RequirePermission permission='use-friend-codes' silent>
									{' • '}<Confirm
										action='v1/friend_code/whitelist/save'
										defaultSubmitImage={`${constants.AWS_URL}/images/icons/wifi.png`}
										imageTitle='Whitelist User'
										additionalBody={
											<>
											<input type='hidden' name='whiteListUser' value={user.username} />
											<input type='hidden' name='action' value='add' />
											</>
										}
										label='Whitelist User'
										message='Whitelisting this user will allow them to see all your Friend Codes. Do you wish to proceed?'
									/>
								</RequirePermission>
							)}
							{currentUser?.id !== user.id && (
								<RequirePermission permission='use-buddy-system' silent>
									{' • '}<Form
										action='v1/users/buddy/save'
										defaultSubmitImage={`${constants.AWS_URL}/images/icons/buddy.png`}
										imageTitle={`Add ${user.username} to your buddy list`}
									>
										<input type='hidden' name='buddyUsers' value={user.username} />
										<input type='hidden' name='action' value='add' />
									</Form>
								</RequirePermission>
							)}
							{currentUser?.id !== user.id && (
								<>
								{' • '}<Link reloadDocument to={`/forums/${constants.boardIds.privateThreads}?addUsers=${user.username}#TextBox`}>
									<img
										src={`${constants.AWS_URL}/images/icons/pt.png`}
										title={`Send a PT to ${user.username}`}
										alt={`Send a PT to ${user.username}`}
									/>
								</Link>
								</>
							)}
						</RequireUser>
					</div>
				}

				{displaying.content &&
					<Markup {...content} emojiSettings={emojiSettings} />
				}

				{displaying.boards && (
					<div className='Node_boards'>
						Sub-forums: {subBoards.map((b, i) => <React.Fragment key={i}>
							{i > 0 && ', '}
							<Link to={`/forums/${encodeURIComponent(b.id)}`}>{b.title}</Link>
						</React.Fragment>)}
					</div>
				)}

				{files?.length > 0 && (
					showImages ? (
						<PhotoGallery
							userId={user.id}
							files={files}
							reportType={constants.userTicket.types.postImage}
						/>
					) : (
						<>
						<Button
							type='button'
							label='View Image(s)'
							className='Node_link'
							clickHandler={() => setFileIndex(0)}
						/>

						<PhotoSlideshow
							userId={user.id}
							files={files}
							reportType={constants.userTicket.types.postImage}
							fileIndex={fileIndex}
							setFileIndex={setFileIndex}
							key={fileIndex}
						/>
						</>
					)
				)}

				{displaying.signature &&
					<div className='Node_signature'>
						<ReportProblem
							type={constants.userTicket.types.profileSignature}
							id={user.id}
						/>
						<Markup
							text={user.signature}
							format={user.signatureFormat}
							emojiSettings={emojiSettings}
						/>
					</div>
				}
			</div>
		</article>
	);
}

function formatDate(date)
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

Node.propTypes = {
	// Props coming from v1/node/full:
	...nodeShape,

	// Props coming from elsewhere:
	breadcrumb: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number.isRequired,
		title: PropTypes.string.isRequired
	})),
	index: PropTypes.number,
	childLength: PropTypes.number,
	followNode: PropTypes.bool,
	page: PropTypes.number,
	emojiSettings: emojiSettingsShape,
	currentUser: userShape,
	subBoards: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		type: PropTypes.string,
		parentId: PropTypes.number,
		title: PropTypes.string,
		content: PropTypes.shape({
			text: PropTypes.string,
			format: PropTypes.string,
		}),
		followed: PropTypes.bool,
	})),
	parentPermissions: PropTypes.arrayOf(PropTypes.string),
	nodeParentId: PropTypes.number,
	pageLink: PropTypes.string,
	listBoards: PropTypes.arrayOf(PropTypes.number),
	userDonations: PropTypes.shape({
		id: PropTypes.number,
		perks: PropTypes.number,
		donations: PropTypes.number,
		monthlyPerks: PropTypes.number,
	}),
}

Node.defaultProps = {
	parentPermissions: [],
	conciseMode: 3,
	pageLink: 'forums',
	listBoards: [],
	userDonations: {
		perks: 0,
	},
}

export default Node;
