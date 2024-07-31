import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

async function save(this: APIThisType, {id, title, description, statusId, categoryId, isBug,
	isExploit, staffOnly, readOnly, assignedUsers, staffDescription, format, staffDescriptionFormat}: saveProps) : Promise<SuccessType|{id: number|string}>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'suggest-features'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	const [user, managePermission, claimPermission, status, category] = await Promise.all([
		this.query('v1/user', {id: this.userId}),
		this.query('v1/permission', {permission: 'manage-features'}),
		this.query('v1/permission', {permission: 'claim-features'}),
		utils.realStringLength(statusId) > 0 ? db.query(`
			SELECT
				feature_status.id
			FROM feature_status
			WHERE feature_status.id = $1
		`, statusId) : null,
		categoryId != null && categoryId > 0 ? db.query(`
			SELECT
				feature_category.id
			FROM feature_category
			WHERE feature_category.id = $1::int
		`, categoryId) : null,
	]);

	if (status != null && status.length === 0)
	{
		throw new UserError('no-such-feature-status');
	}

	if (category != null && category.length === 0)
	{
		throw new UserError('no-such-feature-category');
	}

	if (!managePermission)
	{
		assignedUsers = [];
	}

	if (!Array.isArray(assignedUsers))
	{
		if (assignedUsers)
		{
			if (utils.realStringLength(assignedUsers) > constants.max.addMultipleUsers)
			{
				throw new UserError('bad-format');
			}

			assignedUsers = assignedUsers.split(',').map((username:any) => username.trim());
		}
		else
		{
			assignedUsers = [];
		}
	}

	const assignedUserIds = await Promise.all(assignedUsers.map(async (username:any) =>
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

		return Number(check.id);
	}));

	let successMessage = false;

	if (id != null && id > 0)
	{
		if (!(managePermission || claimPermission))
		{
			throw new UserError('permission');
		}

		const [feature] = await db.query(`
			SELECT id
			FROM feature
			WHERE id = $1::int
		`, id);

		if (!feature)
		{
			throw new UserError('no-such-feature');
		}

		if (managePermission)
		{
			await db.query(`
				UPDATE feature
				SET title = $1::text, description = $2::text, status_id = $3, category_id = $4::int, is_bug = $5::boolean, staff_only = $7, read_only = $8, format = $9, staff_description = $10, staff_description_format = $11
				WHERE id = $6::int
			`, title, description, statusId, categoryId, isBug, id, staffOnly, readOnly, format, staffDescription, staffDescriptionFormat);
		}
		else
		{
			await db.query(`
				UPDATE feature
				SET title = $1::text, description = $2::text, category_id = $3::int, is_bug = $4::boolean, format = $6, staff_description = $7, staff_description_format = $8
				WHERE id = $5::int
			`, title, description, categoryId, isBug, id, format, staffDescription, staffDescriptionFormat);
		}

		await this.query('v1/notification/create', {
			id: id,
			type: constants.notification.types.followFeature
		});
	}
	else
	{
		if (!claimPermission)
		{
			staffDescription = null;
			staffDescriptionFormat = null;
		}

		if (!managePermission)
		{
			staffOnly = false;
			readOnly = false;
			statusId = constants.featureStatuses.suggestion;
		}

		if (isExploit)
		{
			staffOnly = true;

			successMessage = true;
		}

		if ([
			constants.staffIdentifiers.owner,
			constants.staffIdentifiers.admin,
			constants.staffIdentifiers.mod,
			constants.staffIdentifiers.researcherTL,
			constants.staffIdentifiers.researcher,
			constants.staffIdentifiers.devTL,
			constants.staffIdentifiers.dev,
			constants.staffIdentifiers.scout
		].includes(user.group.identifier) && !managePermission)
		{
			staffOnly = true;
			statusId = constants.featureStatuses.discussion;
		}

		const [newFeature] = await db.query(`
			INSERT INTO feature (title, description, status_id, category_id, is_bug, staff_only, read_only, created_user_id, format, staff_description, staff_description_format)
			VALUES ($1::text, $2::text, $3, $4::int, $5::boolean, $6, $7, $8, $9, $10, $11)
			RETURNING id
		`, title, description, statusId, categoryId, isBug, staffOnly, readOnly, this.userId, format, staffDescription, staffDescriptionFormat);

		id = newFeature.id;

		await db.query(`
			INSERT INTO feature_message (user_id, feature_id, message, staff_only, message_format)
			VALUES ($1, $2, $3, $4, $5)
		`, this.userId, id, description, staffOnly, format);

		await db.query(`
			INSERT INTO followed_feature (user_id, feature_id)
			VALUES ($1, $2)
		`, this.userId, id);

		await this.query('v1/notification/create', {
			id: id,
			type: constants.notification.types.feature
		});
	}

	if (assignedUserIds.length > 0)
	{
		await db.query(`
			DELETE FROM feature_assigned_user
			WHERE feature_id = $1::int
		`, id);

		await db.query(`
			INSERT INTO feature_assigned_user (feature_id, user_id)
			SELECT $1::int, unnest($2::int[])
		`, id, assignedUserIds);
	}

	if (successMessage)
	{
		return {
			id: Number(id||0),
			_success: 'This feature / bug has been submitted. Thank you for letting us know!',
			_useCallback: true,
		};
	}

	return {
		id: Number(id||0),
	};
}

save.apiTypes = {
	id: {
		type: APITypes.number,
		nullable: true,
	},
	title: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-title',
		length: constants.max.postTitle,
		profanity: true,
	},
	description: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-content',
		length: constants.max.post1,
		profanity: true,
	},
	format: {
		type: APITypes.string,
		default: '',
		includes: constants.formatOptions,
		required: true,
	},
	statusId: {
		type: APITypes.string,
		default: '',
	},
	categoryId: {
		type: APITypes.number,
		nullable: true,
		required: true,
	},
	isBug: {
		type: APITypes.boolean,
		default: 'false',
	},
	isExploit: {
		type: APITypes.boolean,
		default: 'false',
	},
	staffOnly: {
		type: APITypes.boolean,
		default: 'false',
	},
	readOnly: {
		type: APITypes.boolean,
		default: 'false',
	},
	// assignedUsers custom check above
	staffDescription: {
		type: APITypes.string,
		default: '',
		length: constants.max.post1,
		profanity: true,
	},
	staffDescriptionFormat: {
		type: APITypes.string,
		default: '',
		includes: constants.formatOptions,
	},
}

type saveProps = {
	id: number|null
	title: string
	description: string
	format: string
	statusId: string
	categoryId: number|null
	isBug: boolean
	isExploit: boolean
	staffOnly: boolean
	readOnly: boolean
	assignedUsers: any
	staffDescription: string|null
	staffDescriptionFormat: string|null
}

export default save;