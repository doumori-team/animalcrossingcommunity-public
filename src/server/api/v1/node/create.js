import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';
import { ACCCache } from '@cache';

/*
 * Create thread or post.
 *
 * parameters:
 * 	parentId - number - the board, thread or post being replied to
 * 	title - string or null - title of the node, if it is to have any
 * 	text - string or null - text of the node, if it is to have any
 * 	format - string or null - what kind of markup is used for the text. Valid
 * 		options are 'plaintext', 'markdown', 'bbcode'
 * 	lock - boolean - whether to lock the thread
 * 	users - string - comma-delimited string of users, for PT only
 * 	type - string - normal, sticky or adminLock
 * 	boardId - number - board id to move thread to
 *
 * Possible errors (other than permission):
 * 	- no-such-parent-node: if no parent node is given, or if it doesn't exist
 * 	- bad-format: if the format field is not a valid option, or if the node is
 * 		a response to a thread but also includes a title
 *  - missing-title: if the node is a thread but includes no title
 * 	- missing-content: if the node contains no text
 *
 * Returns an object with the following keys:
 * 	id - number - ID of the newly created node.
 */
async function create({parentId, title, text, format, lock, addUsers, removeUsers,
	type, boardId, fileIds, fileNames, fileWidths, fileHeights, fileCaptions})
{
	if (!Array.isArray(addUsers))
	{
		if (addUsers)
		{
			if (utils.realStringLength(addUsers) > constants.max.addMultipleUsers)
			{
				throw new UserError('bad-format');
			}

			addUsers = addUsers.split(',').map(username => username.trim());
		}
		else
		{
			addUsers = [];
		}
	}

	if (!Array.isArray(removeUsers))
	{
		if (removeUsers)
		{
			if (utils.realStringLength(removeUsers) > constants.max.addMultipleUsers)
			{
				throw new UserError('bad-format');
			}

			removeUsers = removeUsers.split(',').map(username => username.trim());
		}
		else
		{
			removeUsers = [];
		}
	}

	let addUserIds = [], removeUserIds = [];

	await Promise.all(addUsers.map(async (username) =>
	{
		const [check] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE LOWER(username) = LOWER($1)
		`, username);

		if (!check)
		{
			throw new UserError('no-such-user');
		}

		const [blocked] = await db.query(`
			SELECT user_id
			FROM block_user
			WHERE block_user_id = $1::int AND user_id = $2::int
		`, this.userId, check.id);

		if (blocked)
		{
			throw new UserError('blocked');
		}

		let userId = Number(check.id);

		if (check.id !== this.userId && !addUserIds.includes(userId))
		{
			addUserIds.push(userId);
		}
	}));

	await Promise.all(removeUsers.map(async (username) =>
	{
		const [check] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE LOWER(username) = LOWER($1)
		`, username);

		if (!check)
		{
			throw new UserError('no-such-user');
		}

		const [blocked] = await db.query(`
			SELECT user_id
			FROM block_user
			WHERE block_user_id = $1::int AND user_id = $2::int
		`, this.userId, check.id);

		if (blocked)
		{
			throw new UserError('blocked');
		}

		let userId = Number(check.id);

		if (!removeUserIds.includes(userId))
		{
			removeUserIds.push(userId);
		}
	}));

	// First: input validation...
	// Sanity limitations: Does the input make sense?

	// Not physically possible to post anonymously
	if (this.userId === null)
	{
		throw new UserError('login-needed');
	}

	const postUser = await this.query('v1/user', {id: this.userId});

	if (typeof(postUser) === 'undefined' || postUser.length === 0)
	{
		throw new UserError('no-such-user');
	}

	// Check the thing we're replying to actually exists
	let parentDetails;

	[parentDetails] = await db.query(`
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
			parent.locked AS parent_locked
		FROM node
		JOIN node AS parent ON (parent.id = node.parent_node_id)
		WHERE node.id = $1::int
	`, parentId);

	if (!parentDetails)
	{
		throw new UserError('no-such-parent-node');
	}

	const staffBoards = (await db.query(`
		SELECT id
		FROM node
		WHERE type = 'board' AND board_type = 'staff'
	`)).map(x => x.id);

	if (parentDetails.id === constants.boardIds.userSubmissions || ![parentDetails.id, parentDetails.parent_node_id].some(pid => staffBoards.includes(pid)))
	{
		await this.query('v1/profanity/check', {text: title});
		await this.query('v1/profanity/check', {text: text});
	}

	// disallow nested replies
	// as long as not editing post
	const [editPermGranted1, editPermGranted2, editPermGranted3, editPermGranted4] = await Promise.all([
		this.query('v1/node/permission', {permission: 'edit', nodeId: parentId}),
		this.query('v1/node/permission', {permission: 'read', nodeId: parentId}),
		parentDetails.type === 'post' ? this.query('v1/node/permission', {permission: 'edit', nodeId: parentDetails.parent_node_id}) : false,
		parentDetails.type === 'post' ? this.query('v1/node/permission', {permission: 'read', nodeId: parentDetails.parent_node_id}) : false,
	])

	const editPermGranted = editPermGranted1 && editPermGranted2;
	const editPermGrantedParent = editPermGranted3 && editPermGranted4;

	if (parentDetails.type === 'post' && !editPermGranted)
	{
		throw new UserError('bad-format');
	}

	if (lock && parentDetails.type !== 'thread' && parentDetails.type !== 'post')
	{
		throw new UserError('bad-format');
	}

	const movePermGranted = boardId ? await this.query('v1/node/permission', {permission: 'move', nodeId: parentId}) : false;

	if (boardId && (parentDetails.type !== 'thread' || !movePermGranted))
	{
		throw new UserError('bad-format');
	}

	if (boardId)
	{
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

	// Second: more input validation...
	// Administrative limitations: Is the user allowed to post this thing as
	// written?

	// Save up any errors we find to display to the user all at once
	let errors = [];

	if (
		![parentDetails.id, parentDetails.parent_node_id].some(pid => staffBoards.includes(pid)) &&
		(
			utils.realStringLength(text) > constants.max.post3 ||
			postUser.monthlyPerks < 10 && utils.realStringLength(text) > constants.max.post2 ||
			postUser.monthlyPerks < 5 && utils.realStringLength(text) > constants.max.post1
		)
	)
	{
		errors.push('bad-format');
	}

	// Determine whether we are just creating a single post, or a whole new
	// thread.
	let newNodeType;
	if (parentDetails.type === 'board')
	{
		newNodeType = 'thread';
	}
	else
	{
		newNodeType = 'post';
	}

	if (parentDetails.locked)
	{
		errors.push('node-locked');
	}

	if (newNodeType === 'post' || newNodeType === 'thread')
	{
		// replace text with closing template
		if (lock && utils.realStringLength(text) === 0)
		{
			const [adoption] = await db.query(`
				SELECT
					adoptee_id,
					scout_id
				FROM adoption
				WHERE node_id = $1::int
			`, parentId);

			if (adoption?.scout_id === this.userId)
			{
				const [scout, adoptee, scoutSettings] = await Promise.all([
					this.query('v1/user_lite', {id: adoption.scout_id}),
					this.query('v1/user_lite', {id: adoption.adoptee_id}),
					this.query('v1/scout_hub/settings', {id: adoption.scout_id}),
				]);

				let closingTemplate = scoutSettings.closingTemplate ? scoutSettings.closingTemplate : constants.scoutHub.defaultClosingTemplate;

				utils.getScoutTemplateConfig(scout, adoptee).map(config => {
					closingTemplate = closingTemplate.replaceAll(config.character, config.replace);
				});

				text = closingTemplate;
				format = scoutSettings.closingTemplateFormat ? scoutSettings.closingTemplateFormat : 'plaintext';
			}
		}

		if (utils.realStringLength(text) === 0)
		{
			errors.push('missing-content');
		}
	}

	// if you have a title for posting on a thread you can't edit
	if (newNodeType === 'post' && ((parentDetails.type === 'post' && !editPermGrantedParent) || (parentDetails.type !== 'post' && !editPermGranted)) && title != null && parentDetails.parent_node_id != constants.boardIds.userSubmissions)
	{
		errors.push('bad-format');
	}

	// Remove excess whitespace from the title and post content
	// Everything should have titles (except when posting on another user's thread)
	if (((editPermGranted && parentDetails.type !== 'post') || newNodeType === 'thread') && utils.realStringLength(title) === 0)
	{
		errors.push('missing-title');
	}

	// Check the user has permission to reply to the parent node
	const permission = await this.query('v1/node/permission', {permission: 'reply', nodeId: parentId});
	if (!permission)
	{
		errors.push('permission');
	}
	// NB: we DON'T check the user has permission to READ the parent node
	// because sometimes users can post to private boards (User Submissions)

	if (lock)
	{
		const permGranted = await this.query('v1/node/permission', {permission: 'lock', nodeId: parentId});

		if (!permGranted)
		{
			errors.push('permission');
		}
	}

	if (parentDetails.type === 'post' && (!editPermGranted || parentDetails.parent_locked))
	{
		errors.push('permission');
	}
	else
	{
		/*
		Restrictions last for 5 days
		25 public posts per day
		10 public threads per day
		No limit on daily private threads/daily posts on private threads
		1 minute between posts, public and private
		5 minutes between threads, public and private
		*/
		const accountData = await accounts.getData(this.userId);

		// if we're a new member, making a thread / post, and we're not in: Adoptee stuff
		if (dateUtils.shouldHaveNewMemberRestrictions(accountData.signup_date) &&
			![parentDetails.id, parentDetails.parent_node_id].includes(constants.boardIds.adopteeBT) &&
			![parentDetails.id, parentDetails.parent_node_id].includes(constants.boardIds.adopteeThread)
		)
		{
			if (![parentDetails.id, parentDetails.parent_node_id].includes(constants.boardIds.privateThreads))
			{
				const [typeCount] = await db.query(`
					SELECT count(*) AS count
					FROM node
					WHERE type = $2 and user_id = $1::int AND creation_time > now() - interval '1' day
				`, this.userId, newNodeType);

				if ((newNodeType === 'thread' && typeCount.count >= 10) || (newNodeType === 'post' && typeCount.count >= 25))
				{
					errors.push('new-member-restrictions');
				}
			}

			const [lastNode] = await db.query(`
				SELECT creation_time
				FROM node
				WHERE type = $2 and user_id = $1::int
				ORDER BY creation_time DESC
				LIMIT 1
			`, this.userId, newNodeType);

			if (lastNode)
			{
				if ((newNodeType === 'post' && dateUtils.isAfterTimezone(lastNode.creation_time, dateUtils.subtractFromCurrentDateTimezone(1, 'minutes'))) || (newNodeType === 'thread' && dateUtils.isAfterTimezone(lastNode.creation_time, dateUtils.subtractFromCurrentDateTimezone(5, 'minutes'))))
				{
					errors.push('new-member-restrictions');
				}
			}
		}
	}

	const stickyPermGranted = await this.query('v1/node/permission', {permission: 'sticky', nodeId: parentId});
	const adminLockPermGranted = await this.query('v1/node/permission', {permission: 'admin-lock', nodeId: parentId});

	if (type === 'sticky')
	{
		if (!stickyPermGranted)
		{
			errors.push('permission');
		}
	}
	else if (type === 'admin')
	{
		if (!adminLockPermGranted)
		{
			errors.push('permission');
		}
	}

	const addUsersPermGranted = await this.query('v1/node/permission', {permission: 'add-users', nodeId: parentId});
	const removeUsersPermGranted = await this.query('v1/node/permission', {permission: 'remove-users', nodeId: parentId});

	if (addUsers.length > 0 && !addUsersPermGranted)
	{
		errors.push('permission');
	}

	if (removeUsers.length > 0 && !removeUsersPermGranted)
	{
		errors.push('permission');
	}

	if (newNodeType === 'post')
	{
		const [blocked] = await db.query(`
			SELECT user_id
			FROM block_user
			WHERE block_user_id = $1::int AND user_id = $2::int
		`, this.userId, parentDetails.user_id);

		if (blocked)
		{
			throw new UserError('blocked');
		}
	}

	if (fileIds.length != fileNames.length || fileIds.length != fileWidths.length || fileIds.length != fileHeights.length || fileIds.length != fileCaptions.length)
	{
		errors.push('bad-format');
	}

	if (fileIds.length > constants.max.imagesPost)
	{
		throw new UserError('too-many-files');
	}

	fileCaptions.map(caption =>
	{
		if (utils.realStringLength(caption) > constants.max.imageCaption || utils.realStringLength(caption) === 0)
		{
			errors.push('bad-format');
		}
	});

	if (fileIds.length > 0)
	{
		if (dateUtils.isNewMember(postUser.signupDate))
		{
			errors.push('permission');
		}
	}

	if (errors.length > 0)
	{
		throw new UserError(...errors);
	}

	// Third: actually creating the node!

	// If we're creating a thread, save the content (we'll insert it as a new
	// post later)
	let innerText, innerFormat;

	if (newNodeType === 'thread')
	{
		innerText = text;
		text = null;
		innerFormat = format;
		format = null;
	}

	// Run the query
	const types = constants.notification.types;

	const newId = await db.transaction(async query =>
	{
		if (newNodeType === 'post' && ((parentDetails.type === 'post' && editPermGrantedParent) || (parentDetails.type !== 'post' && editPermGranted)))
		{
			if (title != null && ((parentDetails.type !== 'post' && parentDetails.title != title) ||
				(parentDetails.type === 'post' && parentDetails.parent_title != title)))
			{
				await query(`
					INSERT INTO node_revision (node_id, reviser_id, title)
					VALUES ($1::int, $2::int, $3::text)
				`, (parentDetails.type !== 'post' ? parentId : parentDetails.parent_node_id), this.userId, title);
			}

			title = null;
		}

		let newId = null;

		if (newNodeType === 'post' && parentDetails.type === 'post')
		{
			newId = parentId;
		}
		else
		{
			const [result] = await query(`
				INSERT INTO node (parent_node_id, user_id, type)
				VALUES ($1::int, $2::int, $3::node_type)
				RETURNING id
			`, parentId, this.userId, newNodeType);

			newId = result.id;
		}

		const [nodeRevision] = await query(`
			INSERT INTO node_revision (node_id, reviser_id, title, content, content_format)
			VALUES ($1::int, $2::int, $3::text, $4::text, $5::node_content_format)
			RETURNING id
		`, newId, this.userId, title, text, format);

		if (newNodeType === 'post' && fileIds.length > 0)
		{
			await Promise.all(fileIds.map(async (id, index) => {
				const [file] = await query(`
					INSERT INTO file (file_id, name, width, height, caption, sequence)
					VALUES ($1, $2, $3, $4, $5, $6)
					RETURNING id
				`, id, fileNames[index], fileWidths[index], fileHeights[index], fileCaptions[index], index);

				await query(`
					INSERT INTO node_revision_file (node_revision_id, file_id)
					VALUES ($1, $2)
				`, nodeRevision.id, file.id);
			}));
		}

		return newId;
	});

	if (parentDetails.id === constants.boardIds.privateThreads)
	{
		addUserIds.push(this.userId);
	}

	if (addUserIds.length > 0 || removeUserIds.length > 0)
	{
		let threadDetails;

		if (newNodeType === 'post')
		{
			threadDetails = await this.query('v1/node/lite', {id: parentDetails.parent_node_id});
		}

		let userNodeId = parentDetails?.id;

		if ([constants.boardIds.privateThreads, constants.boardIds.shopThread].includes(parentDetails.id))
		{
			userNodeId = newId;
		}
		else if ([constants.boardIds.privateThreads, constants.boardIds.shopThread].includes(threadDetails?.parentId))
		{
			userNodeId = threadDetails.id;
		}

		if (addUserIds.length > 0 && !addUserIds.includes(this.userId))
		{
			addUserIds.push(this.userId);
		}

		await Promise.all([
			Promise.all([
				addUserIds.map(async (userId) => {
					await db.query(`
						INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
						VALUES ($1::int, $2::int, $3::int, true)
						ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
					`, userId, userNodeId, constants.nodePermissions.read);

					await db.query(`
						INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
						VALUES ($1::int, $2::int, $3::int, true)
						ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
					`, userId, userNodeId, constants.nodePermissions.reply);
				})
			]),
			Promise.all([
				removeUserIds.map(async (userId) => {
					await db.query(`
						DELETE FROM user_node_permission
						WHERE user_id = $1 AND node_id = $2
					`, userId, userNodeId);
				})
			]),
		]);
	}

	const [user] = await db.query(`
		SELECT flag_option
		FROM users
		WHERE id = $1::int
	`, this.userId);

	if (newNodeType === 'thread')
	{
		// If making a thread: retrieve the text that we saved earlier and insert
		// it into a new post in the thread
		await this.query('v1/node/create', {parentId: newId, title: title, text: innerText, format: innerFormat, fileIds: fileIds, fileNames: fileNames, fileWidths: fileWidths, fileHeights: fileHeights, fileCaptions: fileCaptions});

		// follow thread if possible
		if (['create'].includes(user.flag_option))
		{
			try
			{
				await this.query('v1/node/follow', {id: newId});
			}
			catch (error)
			{
				console.error(error);
			}
		}

		if (parentId === constants.boardIds.announcements)
		{
			this.query('v1/notification/create', {id: newId, type: types.announcement});

			ACCCache.deleteMatch(constants.cacheKeys.announcements);
		}
		else
		{
			this.query('v1/notification/create', {id: newId, type: types.FB});
		}
	}
	else
	{
		// follow thread if possible
		// only need create_reply here because this is hit when creating a thread too
		if (['create_reply'].includes(user.flag_option))
		{
			const [followedNode] = await db.query(`
				SELECT node_id
				FROM followed_node
				WHERE node_id = $1::int AND user_id = $2::int
			`, parentId, this.userId);

			if (!followedNode)
			{
				try
				{
					await this.query('v1/node/follow', {id: parentId});
				}
				catch (error)
				{
					console.error(error);
				}
			}
		}

		Promise.all([
			this.query('v1/notification/create', {id: newId, type: types.FT}),
			this.query('v1/notification/create', {id: newId, type: types.usernameTag}),
			parentDetails.parent_node_id === constants.boardIds.privateThreads ?
				this.query('v1/notification/create', {id: newId, type: types.PT}) : null,
			parentId === constants.boardIds.adopteeBT ?
				this.query('v1/notification/create', {id: newId, type: types.scoutBT}) : null,
			parentId !== constants.boardIds.adopteeBT && parentDetails.parent_node_id === constants.boardIds.adopteeThread ?
				this.query('v1/notification/create', {id: newId, type: types.scoutThread}) : null,
			parentDetails.parent_node_id === constants.boardIds.shopThread ?
				this.query('v1/notification/create', {id: newId, type: types.shopThread}) : null,
		]);
	}

	if (stickyPermGranted || adminLockPermGranted)
	{
		await db.query(`
			UPDATE node
			SET thread_type = $2
			WHERE id = $1::int
		`, (newNodeType === 'thread' ? newId : (newNodeType === 'post' && parentDetails.type === 'post' ? parentDetails.parent_node_id : parentDetails.id)), type);
	}

	if (lock)
	{
		await db.query(`
			UPDATE node
			SET locked = NOW(), thread_type = 'normal'
			WHERE id = $1::int
		`, newNodeType === 'post' && parentDetails.type === 'post' ? parentDetails.parent_node_id : parentId);

		await db.query(`
			UPDATE shop_order
			SET completed = NOW()
			WHERE node_id = $1::int
		`, newNodeType === 'post' && parentDetails.type === 'post' ? parentDetails.parent_node_id : parentId);
	}

	if (movePermGranted && boardId)
	{
		await db.query(`
			UPDATE node
			SET parent_node_id = $2
			WHERE id = $1
		`, parentId, boardId);
	}

	await db.updateThreadStats(newNodeType === 'thread' ? newId : parentId);

	return {id: newId};
}

create.apiTypes = {
	parentId: {
		type: APITypes.number,
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
		type: APITypes.string,
		default: '',
	},
	removeUsers: {
		type: APITypes.string,
		default: '',
	},
	type: {
		type: APITypes.string,
		default: 'normal',
		includes: ['normal', 'sticky', 'admin'],
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
}

export default create;