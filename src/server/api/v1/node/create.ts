import MarkdownIt from 'markdown-it';

import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';
import { ACCCache } from '@cache';
import { APIThisType, UserType, UserDonationsType, MarkupStyleType, SuccessType, NodeType, UserLiteType, ScoutSettingsType } from '@types';
import { sendNotificationToUser, getAllLiveModeUserIds } from 'server/notificationService.ts';
import poll from 'common/markup/markdown-poll.ts';

/*
 * Create thread, create post or edit post.
 */
async function create(this: APIThisType, { parentId, title, text, format, lock, addUsers, removeUsers,
	type, boardId, fileIds, fileNames, fileWidths, fileHeights, fileCaptions }: createProps): Promise<SuccessType>
{
	const permission: boolean = await this.query('v1/node/permission', { permission: 'reply', nodeId: parentId });

	if (!permission)
	{
		throw new UserError('permission');
	}
	// NB: we DON'T check the user has permission to READ the parent node
	// because sometimes users can post to private boards (User Submissions)

	// Check parameters

	const [[parentDetails], editParentIdPermGranted, readParentIdPermGranted, [childNode]]: [[ParentDetailsType], boolean, boolean, [{ id: number }]] = await Promise.all([
		// get thread if post, board if thread, post if editing post
		db.query(`
			SELECT
				node.id,
				node.type,
				node.locked,
				node.parent_node_id,
				node.thread_type,
				(
					SELECT title
					FROM node_revision
					WHERE node_revision.node_id = node.id
					ORDER BY time DESC
					LIMIT 1
				) AS title,
				(
					SELECT title
					FROM node_revision
					WHERE node_revision.node_id = node.parent_node_id
					ORDER BY time DESC
					LIMIT 1
				) AS parent_title,
				node.user_id,
				parent.locked AS parent_locked,
				parent2.id AS parent2_id,
				parent2.parent_node_id AS parent2_parent_id
			FROM node
			JOIN node AS parent ON (parent.id = node.parent_node_id)
			LEFT JOIN node AS parent2 ON (parent2.id = parent.parent_node_id)
			WHERE node.id = $1::int
		`, parentId),
		this.query('v1/node/permission', { permission: 'edit', nodeId: parentId }),
		this.query('v1/node/permission', { permission: 'read', nodeId: parentId }),
		db.query(`
			SELECT node.id
			FROM node
			JOIN node AS target ON target.id = $1::int
			WHERE node.parent_node_id = target.parent_node_id
			ORDER BY node.creation_time ASC
			LIMIT 1
		`, parentId),
	]);

	const editingPost = parentDetails.type === 'post';

	const editingThreadPost = editingPost && childNode.id === parentId;

	const editPermGranted: boolean = editParentIdPermGranted && readParentIdPermGranted;

	// Determine whether we are just creating / editing a single post, or a whole new thread.
	const newNodeType: NewNodeType = parentDetails.type === 'board' ? 'thread' : 'post';

	const [editParentParentPermGranted, readParentParentPermGranted]: [boolean, boolean] = await Promise.all([
		editingPost ? this.query('v1/node/permission', { permission: 'edit', nodeId: parentDetails.parent_node_id }) : false,
		editingPost ? this.query('v1/node/permission', { permission: 'read', nodeId: parentDetails.parent_node_id }) : false,
	]);

	const editPermGrantedParent: boolean = editParentParentPermGranted && readParentParentPermGranted;

	// Validate (bad-format) & Permissions
	await Promise.all([
		validateEditPost(editingPost, editPermGranted),
		validateTextTitle.bind(this)(title, text, parentDetails, newNodeType, editingPost, editPermGranted, editPermGrantedParent),
		validateLock.bind(this)(lock, parentDetails),
		validateAddRemoveUsers.bind(this)(addUsers, removeUsers, parentDetails),
		validateThreadType.bind(this)(type, parentDetails),
		validateBoardId.bind(this)(boardId, parentDetails),
		validateFileArrays.bind(this)(newNodeType, editingThreadPost, fileIds, fileNames, fileWidths, fileHeights, fileCaptions),
	]);

	// replace text with scout hub closing template
	if (lock && utils.realStringLength(text) === 0)
	{
		const [adoption] = await db.query(`
			SELECT
				adoptee_id,
				scout_id
			FROM adoption
			WHERE node_id = $1::int
		`, parentDetails.id);

		if (adoption?.scout_id === this.userId)
		{
			const [scout, adoptee, scoutSettings]: [UserLiteType, UserLiteType, ScoutSettingsType] = await Promise.all([
				this.query('v1/user_lite', { id: adoption.scout_id }),
				this.query('v1/user_lite', { id: adoption.adoptee_id }),
				this.query('v1/scout_hub/settings', { id: adoption.scout_id }),
			]);

			let closingTemplate = scoutSettings.closingTemplate ? scoutSettings.closingTemplate : constants.scoutHub.defaultClosingTemplate;

			utils.getScoutTemplateConfig(scout, adoptee).map(config =>
			{
				closingTemplate = closingTemplate.replaceAll(config.character, config.replace);
			});

			text = closingTemplate;
			format = scoutSettings.closingTemplateFormat ? scoutSettings.closingTemplateFormat : 'plaintext';
		}
	}

	// server side checks can't do easily client side + add / remove user ids
	const [addUserIds, removeUserIds] = await validateServerSide.bind(this)(
		title,
		text,
		addUsers,
		removeUsers,
		newNodeType,
		editPermGranted,
		editPermGrantedParent,
		editingPost,
		parentDetails,
	);

	// Perform queries

	const newId = await updateTitleOrPost.bind(this)(
		title,
		newNodeType === 'thread' ? null : text,
		newNodeType === 'thread' ? null : format,
		lock,
		addUserIds,
		removeUserIds,
		type,
		boardId,
		fileIds,
		fileNames,
		fileWidths,
		fileHeights,
		fileCaptions,
		editingPost,
		editingThreadPost,
		newNodeType,
		parentDetails,
	);

	// if creating a thread, insert post (separate)
	if (newNodeType === 'thread')
	{
		if (fileIds.length > constants.max.imagesPost)
		{
			fileIds = fileNames = fileWidths = fileHeights = fileCaptions = [];
		}

		await this.query('v1/node/create', { parentId: newId, title, text, format, fileIds, fileNames, fileWidths, fileHeights, fileCaptions });
	}

	await Promise.all([
		updateFollowAndNotifications.bind(this)(newNodeType, newId, parentDetails, editingPost),
		db.updateThreadStats(newNodeType === 'thread' ? newId : parentDetails.id),
	]);

	Promise.all([
		newNodeType === 'post' ? this.query('v1/users/badge/check', { badgeId: constants.badges.totpd }) : null,
		newNodeType === 'thread' ? this.query('v1/users/badge/check', { badgeId: constants.badges.threadstickied }) : null,
		newNodeType === 'post' ? this.query('v1/users/badge/check', { badgeId: constants.badges.tenwelcomes }) : null,
		newNodeType === 'thread' ? this.query('v1/users/badge/check', { badgeId: constants.badges.tencreatorthreads }) : null,
	]);

	return {
		id: newId,
	};
}

export async function validateEditPost(editingPost: boolean, editPermGranted: boolean): Promise<void>
{
	// you can only edit a post if you can edit and read it
	// (you have edit access if your post, but you should only be able to edit if read)
	if (editingPost && !editPermGranted)
	{
		throw new UserError('permission');
	}
}

export async function validateTextTitle(this: APIThisType, title: createProps['title'], text: createProps['text'], parentDetails: ParentDetailsType, newNodeType: NewNodeType, editingPost: boolean, editPermGranted: boolean, editPermGrantedParent: boolean): Promise<void>
{
	// if you have a title for posting on a thread you can't edit
	if (
		title !== null &&
		newNodeType === 'post' &&
		parentDetails.parent_node_id !== constants.boardIds.userSubmissions
	)
	{
		if (editingPost && !editPermGrantedParent)
		{
			throw new UserError('bad-format');
		}
		else if (!editPermGranted)
		{
			throw new UserError('bad-format');
		}
	}

	// check profanity, post length, for all non-staff boarsd
	// (including User Submissions, a staff board users post to)
	if (utils.realStringLength(title) > 0 || utils.realStringLength(text) > 0)
	{
		const staffBoards = (await db.query(`
			SELECT id
			FROM node
			WHERE type = 'board' AND board_type = 'staff'
		`)).map((x: { id: number }) => x.id);

		if (parentDetails.id === constants.boardIds.userSubmissions ||
			![parentDetails.id, parentDetails.parent_node_id, parentDetails.parent2_parent_id].some(pid => staffBoards.includes(pid)))
		{
			await db.profanityCheck(title);

			if (utils.realStringLength(text) > 0)
			{
				await db.profanityCheck(text);

				const userDonations: UserDonationsType = await this.query('v1/users/donations', { id: this.userId });

				if (
					utils.realStringLength(text) > constants.max.post3 ||
					userDonations.monthlyPerks < 10 && utils.realStringLength(text) > constants.max.post2 ||
					userDonations.monthlyPerks < 5 && utils.realStringLength(text) > constants.max.post1
				)
				{
					throw new UserError('bad-format');
				}
			}
		}
	}
}

export async function validateLock(this: APIThisType, lock: createProps['lock'], parentDetails: ParentDetailsType): Promise<void>
{
	if (lock)
	{
		// you can lock a thread, but only when posting on a thread
		if (parentDetails.type !== 'thread')
		{
			throw new UserError('bad-format');
		}

		const permGranted: boolean = await this.query('v1/node/permission', { permission: 'lock', nodeId: parentDetails.id });

		if (!permGranted)
		{
			throw new UserError('permission');
		}
	}
}

export async function validateAddRemoveUsers(this: APIThisType, addUsers: createProps['addUsers'], removeUsers: createProps['removeUsers'], parentDetails: ParentDetailsType): Promise<void>
{
	// node/permission prevents adding / removing users on non-PTs/non-Shop-Threads

	if (addUsers.length > 0)
	{
		const addUsersPermGranted: boolean = await this.query('v1/node/permission', { permission: 'add-users', nodeId: parentDetails.id });

		if (!addUsersPermGranted)
		{
			throw new UserError('permission');
		}
	}

	if (removeUsers.length > 0)
	{
		const removeUsersPermGranted: boolean = await this.query('v1/node/permission', { permission: 'remove-users', nodeId: parentDetails.id });

		if (!removeUsersPermGranted)
		{
			throw new UserError('permission');
		}
	}
}

export async function validateThreadType(this: APIThisType, type: createProps['type'], parentDetails: ParentDetailsType): Promise<void>
{
	if (type === 'sticky')
	{
		const stickyPermGranted: boolean = await this.query('v1/node/permission', { permission: 'sticky', nodeId: parentDetails.id });

		if (!stickyPermGranted)
		{
			throw new UserError('permission');
		}
	}
	else if (type === 'admin')
	{
		const adminLockPermGranted: boolean = await this.query('v1/node/permission', { permission: 'admin-lock', nodeId: parentDetails.id });

		if (!adminLockPermGranted)
		{
			throw new UserError('permission');
		}
	}
}

export async function validateBoardId(this: APIThisType, boardId: createProps['boardId'], parentDetails: ParentDetailsType): Promise<void>
{
	if (boardId > 0)
	{
		// you can only move a thread when posting on a thread
		if (parentDetails.type !== 'thread')
		{
			throw new UserError('bad-format');
		}

		const movePermGranted: boolean = await this.query('v1/node/permission', { permission: 'move', nodeId: parentDetails.id });

		if (!movePermGranted)
		{
			throw new UserError('permission');
		}

		// confirm board exists and is a board
		const [boardDetails] = await db.query(`
			SELECT
				node.id,
				node.type
			FROM node
			WHERE node.id = $1::int
		`, boardId);

		if (!boardDetails || boardDetails.type !== 'board')
		{
			throw new UserError('bad-format');
		}
	}
}

export async function validateFileArrays(this: APIThisType, newNodeType: NewNodeType, editingThreadPost: boolean, fileIds: createProps['fileIds'], fileNames: createProps['fileNames'], fileWidths: createProps['fileWidths'], fileHeights: createProps['fileHeights'], fileCaptions: createProps['fileCaptions']): Promise<void>
{
	if (
		fileIds.length !== fileNames.length ||
		fileIds.length !== fileWidths.length ||
		fileIds.length !== fileHeights.length ||
		fileIds.length !== fileCaptions.length
	)
	{
		throw new UserError('bad-format');
	}

	let maxImages = constants.max.imagesPost;

	if (newNodeType === 'thread' || editingThreadPost)
	{
		maxImages = constants.max.imagesThread;
	}

	if (fileIds.length > maxImages)
	{
		throw new UserError('too-many-files');
	}

	fileCaptions.map(caption =>
	{
		if (utils.realStringLength(caption) > constants.max.imageCaption || utils.realStringLength(caption) === 0)
		{
			throw new UserError('bad-format');
		}
	});

	if (fileIds.length > 0)
	{
		const postUser: UserType = await this.query('v1/user', { id: this.userId });

		if (dateUtils.isNewMember(postUser.signupDate))
		{
			throw new UserError('permission');
		}
	}
}

export async function validateServerSide(this: APIThisType, title: createProps['title'], text: createProps['text'], addUsers: createProps['addUsers'], removeUsers: createProps['removeUsers'], newNodeType: NewNodeType, editPermGranted: boolean, editPermGrantedParent: boolean, editingPost: boolean, parentDetails: ParentDetailsType): Promise<[number[], number[]]>
{
	// Save up any errors we find to display to the user all at once
	let errors: string[] = [];

	// Only threads have titles (if making a thread or have permissions to edit thread title while posting)
	if (utils.realStringLength(title) === 0 && (newNodeType === 'thread' || !editingPost && editPermGranted || editingPost && editPermGrantedParent))
	{
		errors.push('missing-title');
	}

	if (utils.realStringLength(text) === 0)
	{
		errors.push('missing-content');
	}

	// see node/permission
	// that checks lock, sticky, admin-lock with reply permission check at beginning

	let addUserIds: number[] = [], removeUserIds: number[] = [];

	await Promise.all(addUsers.map(async (username) =>
	{
		const [check] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE LOWER(username) = LOWER($1)
		`, username);

		if (!check)
		{
			errors.push('no-such-user');
		}
		else
		{
			const [blocked] = await db.query(`
				SELECT user_id
				FROM block_user
				WHERE block_user_id = $1::int AND user_id = $2::int
			`, this.userId, check.id);

			if (blocked)
			{
				errors.push('blocked');
			}
			else
			{
				let userId = Number(check.id);

				if (check.id !== this.userId && !addUserIds.includes(userId))
				{
					addUserIds.push(userId);
				}
			}
		}
	}));

	// if a PT, add yourself, because you can have a PT with just yourself.
	// If there are already other people, add yourself (Shop Thread).
	if (parentDetails.id === constants.boardIds.privateThreads || addUserIds.length > 0)
	{
		addUserIds.push(this.userId as number);
	}

	await Promise.all(removeUsers.map(async (username) =>
	{
		const [check] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE LOWER(username) = LOWER($1)
		`, username);

		if (!check)
		{
			errors.push('no-such-user');
		}
		else
		{
			const [blocked] = await db.query(`
				SELECT user_id
				FROM block_user
				WHERE block_user_id = $1::int AND user_id = $2::int
			`, this.userId, check.id);

			if (blocked)
			{
				errors.push('blocked');
			}
			else
			{
				let userId = Number(check.id);

				if (!removeUserIds.includes(userId))
				{
					removeUserIds.push(userId);
				}
			}
		}
	}));

	if (!editingPost)
	{
		/*
		Restrictions last for 5 days
		25 public posts per day
		10 public threads per day
		No limit on daily private threads/daily posts on private threads
		1 minute between posts, public and private
		5 minutes between threads, public and private
		*/
		if (
			![parentDetails.id, parentDetails.parent_node_id].includes(constants.boardIds.adopteeBT) &&
			![parentDetails.id, parentDetails.parent_node_id].includes(constants.boardIds.adopteeThread)
		)
		{
			const accountData = await accounts.getData(this.userId);

			// if we're a new member, making a thread / post, and we're not in: Adoptee stuff
			if (dateUtils.shouldHaveNewMemberRestrictions(accountData.signup_date))
			{
				// if we're not in PTs, check count
				if (![parentDetails.id, parentDetails.parent_node_id].includes(constants.boardIds.privateThreads))
				{
					const [typeCount] = await db.query(`
						SELECT count(*) AS count
						FROM node
						WHERE type = $2 and user_id = $1::int AND creation_time > now() - interval '1' day
					`, this.userId, newNodeType);

					if (newNodeType === 'thread' && typeCount.count >= 10 || newNodeType === 'post' && typeCount.count >= 25)
					{
						errors.push('new-member-restrictions');
					}
				}

				// check timing
				const [lastNode]: [{ creation_time: Date } | undefined] = await db.query(`
					SELECT creation_time
					FROM node
					WHERE type = $2 and user_id = $1::int
					ORDER BY creation_time DESC
					LIMIT 1
				`, this.userId, newNodeType);

				if (lastNode)
				{
					if (
						newNodeType === 'post' && dateUtils.isAfterTimezone(lastNode.creation_time, dateUtils.subtractFromCurrentDateTimezone(1, 'minutes')) ||
						newNodeType === 'thread' && dateUtils.isAfterTimezone(lastNode.creation_time, dateUtils.subtractFromCurrentDateTimezone(5, 'minutes')))
					{
						errors.push('new-member-restrictions');
					}
				}
			}
		}

		// cannot post on a thread where that user has blocked you
		if (newNodeType === 'post')
		{
			const [blocked] = await db.query(`
				SELECT user_id
				FROM block_user
				WHERE block_user_id = $1::int AND user_id = $2::int
			`, this.userId, parentDetails.user_id);

			if (blocked)
			{
				errors.push('blocked');
			}
		}
	}

	if (errors.length > 0)
	{
		throw new UserError(...errors);
	}

	return [addUserIds, removeUserIds];
}

export async function updateTitleOrPost(this: APIThisType, title: createProps['title'], text: createProps['text'], format: createProps['format'], lock: createProps['lock'], addUserIds: number[], removeUserIds: number[], type: createProps['type'], boardId: createProps['boardId'], fileIds: createProps['fileIds'], fileNames: createProps['fileNames'], fileWidths: createProps['fileWidths'], fileHeights: createProps['fileHeights'], fileCaptions: createProps['fileCaptions'], editingPost: boolean, editingThreadPost: boolean, newNodeType: NewNodeType, parentDetails: ParentDetailsType): Promise<number>
{
	return await db.transaction(async (query: db.QueryType) =>
	{
		let nodeRevisionParent: { id: number } | null = null;
		const parentTitle = title;

		// if changing the thread title, which happens when posting or editing a post, record it
		if (newNodeType === 'post')
		{
			// only if title set and it doesn't match existing title
			if (title !== null &&
				(!editingPost && parentDetails.title !== title ||
				editingPost && parentDetails.parent_title !== title)
			)
			{
				[nodeRevisionParent] = await query(`
					INSERT INTO node_revision (node_id, reviser_id, title)
					VALUES ($1::int, $2::int, $3::text)
					RETURNING id
				`, !editingPost ? parentDetails.id : parentDetails.parent_node_id, this.userId, title);
			}

			// posts can come with titles for parent, but clear it for new row for post
			title = null;
		}

		let newId: number | null = null;

		// if we are editing a post, then the content is against the post that already exists
		if (editingPost)
		{
			newId = parentDetails.id;
		}
		// otherwise, create a new post / thread and use that
		else
		{
			const [result] = await query(`
				INSERT INTO node (parent_node_id, user_id, type)
				VALUES ($1::int, $2::int, $3::node_type)
				RETURNING id
			`, parentDetails.id, this.userId, newNodeType);

			newId = result.id;
		}

		const [nodeRevision] = await query(`
			INSERT INTO node_revision (node_id, reviser_id, title, content, content_format)
			VALUES ($1::int, $2::int, $3::text, $4::text, $5::node_content_format)
			RETURNING id
		`, newId, this.userId, title, text, format);

		if (fileIds.length > 0 && (newNodeType === 'post' && fileIds.length <= constants.max.imagesPost || (newNodeType === 'thread' || editingThreadPost) && fileIds.length > constants.max.imagesPost))
		{
			const useThread = editingThreadPost && fileIds.length > constants.max.imagesPost;

			if (useThread && nodeRevisionParent === null)
			{
				[nodeRevisionParent] = await query(`
					INSERT INTO node_revision (node_id, reviser_id, title)
					VALUES ($1::int, $2::int, $3::text)
					RETURNING id
				`, parentDetails.parent_node_id, this.userId, parentTitle);
			}

			await Promise.all(
				fileIds.map(async (id, index) =>
				{
					const [file] = await query(`
						INSERT INTO file (file_id, name, width, height, caption, sequence)
						VALUES ($1, $2, $3, $4, $5, $6)
						RETURNING id
					`, id, fileNames[index], fileWidths[index], fileHeights[index], fileCaptions[index], index);

					await query(`
						INSERT INTO node_revision_file (node_revision_id, file_id)
						VALUES ($1, $2)
					`, useThread ? nodeRevisionParent!.id : nodeRevision.id, file.id);
				}),
			);
		}

		if (addUserIds.length > 0 || removeUserIds.length > 0)
		{
			// figure out how to grab thread node
			// usually it's the parent... if we're creating a PT or Shop Thread
			let userNodeId = parentDetails.id;

			// if we're posting on a PT or Shop Thread
			if ([constants.boardIds.privateThreads, constants.boardIds.shopThread].includes(parentDetails.id))
			{
				userNodeId = newId as number;
			}
			// if we're editing a post on a PT or Shop Thread
			else if (
				parentDetails.parent2_parent_id !== null &&
						parentDetails.parent2_id !== null &&
						[constants.boardIds.privateThreads, constants.boardIds.shopThread].includes(parentDetails.parent2_parent_id))
			{
				userNodeId = parentDetails.parent2_id;
			}

			await Promise.all([
				addUserIds.length > 0 ? query(`
					INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
					SELECT unnest($1::int[]), $2::int, $3::int, true
					ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
				`, addUserIds, userNodeId, constants.nodePermissions.read) : null,
				addUserIds.length > 0 ? query(`
					INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
					SELECT unnest($1::int[]), $2::int, $3::int, true
					ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
				`, addUserIds, userNodeId, constants.nodePermissions.reply) : null,
				addUserIds.length > 0 ? query(`
					INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
					SELECT unnest($1::int[]), $2::int, $3::int, true
					ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
				`, addUserIds, userNodeId, constants.nodePermissions.react) : null,
				removeUserIds.length > 0 ? query(`
					DELETE FROM user_node_permission
					WHERE user_id = ANY($1) AND node_id = $2::int
				`, removeUserIds, userNodeId) : null,
			]);
		}

		if (utils.realStringLength(type) > 0)
		{
			await query(`
				UPDATE node
				SET thread_type = $2
				WHERE id = $1::int
			`, newNodeType === 'thread' ? newId : editingPost ? parentDetails.parent_node_id : parentDetails.id, type);
		}

		if (lock)
		{
			await query(`
				UPDATE node
				SET locked = NOW(), thread_type = 'normal'
				WHERE id = $1::int
			`, editingPost ? parentDetails.parent_node_id : parentDetails.id);

			await db.query(`
				UPDATE shop_order
				SET completed = NOW()
				WHERE node_id = $1::int
			`, editingPost ? parentDetails.parent_node_id : parentDetails.id);
		}

		if (boardId > 0)
		{
			await query(`
				UPDATE node
				SET parent_node_id = $2
				WHERE id = $1
			`, parentDetails.id, boardId);
		}

		if (newNodeType === 'post' && text !== null && format === 'markdown')
		{
			const md = new MarkdownIt();
			md.use(poll);

			const tokens = md.parse(text, {});

			const quotes: string[] = [];

			const polls: {
				options: string[]
				multi: boolean
			}[] = [];

			for (let i = 0; i < tokens.length; i++)
			{
				const token = tokens[i];

				if (token.type === 'blockquote_open')
				{
					let content = '';
					let j = i + 1;

					while (tokens[j] && tokens[j].type !== 'blockquote_close')
					{
						if (tokens[j].type === 'inline')
						{
							content += tokens[j].content.trim() + '%';
						}

						j++;
					}

					quotes.push(content.replace(/[’‘']/g, '%').replace(/[“”"]/g, '%').replace(/%+/g, '%'));
				}

				if (token.type === 'poll_open' && token.meta)
				{
					const options = token.meta.options || [];
					const multi = token.meta.pollType === 'multi';

					polls.push({ options, multi });
				}
			}

			if (quotes.length > 0)
			{
				await query(`
					WITH quotes AS (
						SELECT quote, ord
						FROM unnest($2::text[]) WITH ORDINALITY AS t(quote, ord)
					),
					matched AS (
						SELECT q.quote, q.ord, nr.node_id AS quoted_node_id
						FROM quotes q
						LEFT JOIN LATERAL (
							SELECT nr.node_id
							FROM node_revision nr
							JOIN node AS parent ON (parent.id = nr.node_id)
							WHERE parent.parent_node_id = $1 AND nr.content ILIKE '%' || q.quote || '%'
							ORDER BY nr.node_id ASC, nr.time DESC
							LIMIT 1
						) nr ON TRUE
					)
					INSERT INTO node_revision_quote (node_revision_id, node_id, sort_order)
					SELECT $3, quoted_node_id, ord
					FROM matched
					WHERE quoted_node_id IS NOT NULL AND quoted_node_id != $4
					ORDER BY ord
				`, editingPost ? parentDetails.parent_node_id : parentDetails.id, quotes, nodeRevision.id, newId);
			}

			if (polls.length > 0)
			{
				for (const [index, row] of polls.entries())
				{
					const [poll] = await query(`
						INSERT INTO node_revision_poll (node_revision_id, is_multiple_choice, sort_order)
						VALUES ($1, $2, $3)
						RETURNING id
					`, nodeRevision.id, row.multi, index);

					await query(`
						INSERT INTO node_revision_poll_option (poll_id, description, sequence)
						SELECT $1, unnest($2::text[]), unnest($3::int[])
					`, poll.id, row.options, row.options.map((_, idx) => idx + 1));
				}
			}
		}

		return newId;
	});
}

export async function updateFollowAndNotifications(this: APIThisType, newNodeType: NewNodeType, newId: number, parentDetails: ParentDetailsType, editingPost: boolean = false): Promise<void>
{
	const [user] = await db.query(`
		SELECT flag_option
		FROM users
		WHERE id = $1::int
	`, this.userId);

	const types = constants.notification.types;

	if (newNodeType === 'thread')
	{
		// follow thread if possible
		if (['create'].includes(user.flag_option))
		{
			try
			{
				await this.query('v1/node/follow', { id: newId });
			}
			catch (error)
			{
				console.error('node.create node/follow error (thread):', error);
			}
		}

		if (parentDetails.id === constants.boardIds.announcements)
		{
			this.query('v1/notification/create', { id: newId, type: types.announcement });

			ACCCache.deleteMatch(constants.cacheKeys.announcements);
		}
		else
		{
			this.query('v1/notification/create', { id: newId, type: types.FB });
		}
	}
	else
	{
		// follow thread if possible
		// only need create_reply here because this is hit when creating a thread too
		if (!editingPost && ['create_reply'].includes(user.flag_option))
		{
			const [followedNode] = await db.query(`
				SELECT node_id
				FROM followed_node
				WHERE node_id = $1::int AND user_id = $2::int
			`, parentDetails.id, this.userId);

			if (!followedNode)
			{
				try
				{
					await this.query('v1/node/follow', { id: parentDetails.id });
				}
				catch (error)
				{
					console.error('node.create node/follow error (post):', error);
				}
			}
		}

		Promise.all([
			this.query('v1/notification/create', { id: newId, type: editingPost ? types.FT_edit : types.FT }),
			this.query('v1/notification/create', { id: newId, type: types.usernameTag }),
			this.query('v1/notification/create', { id: newId, type: types.postQuote }),
			parentDetails.parent_node_id === constants.boardIds.privateThreads ?
				this.query('v1/notification/create', { id: newId, type: types.PT }) : null,
			parentDetails.id === constants.boardIds.adopteeBT ?
				this.query('v1/notification/create', { id: newId, type: types.scoutBT }) : null,
			parentDetails.id !== constants.boardIds.adopteeBT && parentDetails.parent_node_id === constants.boardIds.adopteeThread ?
				this.query('v1/notification/create', { id: newId, type: types.scoutThread }) : null,
			parentDetails.parent_node_id === constants.boardIds.shopThread ?
				this.query('v1/notification/create', { id: newId, type: types.shopThread }) : null,
		]);

		for (const userId of await getAllLiveModeUserIds(parentDetails.id))
		{
			try
			{
				const post = await this.fullQuery(userId, 'v1/node/full', { id: newId, loadingNode: true });

				sendNotificationToUser(userId, constants.webSocketTypes.post, post);
			}
			catch (err)
			{
				console.error('Error sending new post via WebSocket.', newId, userId, err);
			}
		}
	}
}

create.permissions = [
	'userId',
];

create.apiTypes = {
	parentId: {
		type: APITypes.nodeId,
		required: true,
	},
	title: {
		type: APITypes.string,
		default: '',
		length: constants.max.postTitle,
		nullable: true,
	},
	text: {
		type: APITypes.string,
		default: '',
		length: constants.max.staffPost,
	},
	format: {
		type: APITypes.string,
		default: '',
		includes: ['markdown', 'bbcode', 'plaintext'],
		required: true,
	},
	lock: {
		type: APITypes.boolean,
		default: 'false',
	},
	addUsers: {
		type: APITypes.array,
		length: constants.max.addMultipleUsers,
		userInput: true,
	},
	removeUsers: {
		type: APITypes.array,
		length: constants.max.addMultipleUsers,
		userInput: true,
	},
	type: {
		type: APITypes.string,
		default: '',
		includes: ['', 'normal', 'sticky', 'admin'],
	},
	boardId: {
		type: APITypes.nodeId,
		nullable: true,
	},
	fileIds: {
		type: APITypes.array,
	},
	fileNames: {
		type: APITypes.array,
	},
	fileWidths: {
		type: APITypes.array,
	},
	fileHeights: {
		type: APITypes.array,
	},
	fileCaptions: {
		type: APITypes.array,
	},
};

type createProps = {
	parentId: number
	title: string | null
	text: string | null
	format: MarkupStyleType | null
	lock: boolean
	addUsers: string[]
	removeUsers: string[]
	type: NodeType['threadType']
	boardId: number
	fileIds: string[]
	fileNames: string[]
	fileWidths: string[]
	fileHeights: string[]
	fileCaptions: string[]
};

export type ParentDetailsType = {
	id: number
	type: NodeType['type']
	locked: string | null
	// users can't do anything against top parent node 'ACC Forums'
	parent_node_id: number
	thread_type: NodeType['threadType']
	title: string
	parent_title: string
	user_id: number | null
	parent_locked: string | null
	parent2_id: number | null
	parent2_parent_id: number | null
};

type NewNodeType = 'thread' | 'post';

export default create;
