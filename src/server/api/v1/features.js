import * as db from '@db';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';

async function features({page, statusId, isBug, categoryId, following, staffOnly, readOnly, createdUser, assignedUser})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	if (utils.realStringLength(statusId) > 0)
	{
		const [status] = await db.query(`
			SELECT
				feature_status.id
			FROM feature_status
			WHERE feature_status.id = $1::citext
		`, statusId);

		if (!status)
		{
			throw new UserError('no-such-feature-status');
		}
	}

	if (categoryId > 0)
	{
		const [category] = await db.query(`
			SELECT
				feature_category.id
			FROM feature_category
			WHERE feature_category.id = $1::int
		`, categoryId);

		if (!category)
		{
			throw new UserError('no-such-feature-category');
		}
	}

	const advancedPermission = await this.query('v1/permission', {permission: 'advanced-features'});

	if (!advancedPermission)
	{
		staffOnly = 'both';
		readOnly = 'both',
		createdUser = '';
		assignedUser = '';
	}

	// Do actual search
	const pageSize = 25;
	const offset = (page * pageSize) - pageSize;
	let params = [pageSize, offset];
	let paramIndex = params.length;
	let results = [], count = 0;

	let query = `
		SELECT
			feature.id,
			count(*) over() AS count
		FROM feature
	`;

	// Add joins
	if (['yes', 'no'].includes(following))
	{
		let leftjoin = '';

		if (following === 'no')
		{
			leftjoin = 'LEFT '
		}

		query += `
			${leftjoin}JOIN followed_feature ON (followed_feature.feature_id = feature.id)
		`;
	}

	if (utils.realStringLength(assignedUser) > 0)
	{
		query += `
			JOIN user_account_cache AS assigned_user_account_cache ON (assigned_user_account_cache.id = feature.assigned_user_id)
		`;
	}

	if (utils.realStringLength(createdUser) > 0)
	{
		query += `
			JOIN user_account_cache AS created_user_account_cache ON (created_user_account_cache.id = feature.created_user_id)
		`;
	}

	// Add wheres
	let wheres = [];

	if (!advancedPermission)
	{
		wheres.push(`feature.staff_only = false`);
	}

	if (utils.realStringLength(statusId) > 0)
	{
		params[paramIndex] = statusId;

		paramIndex++;

		wheres.push(`feature.status_id = $` + paramIndex);
	}

	if (['yes', 'no'].includes(isBug))
	{
		params[paramIndex] = isBug === 'yes' ? true : false;

		paramIndex++;

		wheres.push(`feature.is_bug = $` + paramIndex);
	}

	if (categoryId > -2 && categoryId != null)
	{
		if (categoryId === -1)
		{
			wheres.push(`feature.category_id IS NULL`);
		}
		else
		{
			params[paramIndex] = categoryId;

			paramIndex++;

			wheres.push(`feature.category_id = $` + paramIndex);
		}
	}

	if (['yes', 'no'].includes(following))
	{
		params[paramIndex] = this.userId;

		paramIndex++;

		if (following === 'yes')
		{
			wheres.push(`followed_feature.user_id = $` + paramIndex);
		}
		else
		{
			wheres.push(`followed_feature.user_id != $` + paramIndex);
		}
	}

	if (['yes', 'no'].includes(staffOnly))
	{
		params[paramIndex] = staffOnly;

		paramIndex++;

		wheres.push(`feature.staff_only = $` + paramIndex);
	}

	if (['yes', 'no'].includes(readOnly))
	{
		params[paramIndex] = readOnly;

		paramIndex++;

		wheres.push(`feature.read_only = $` + paramIndex);
	}

	if (utils.realStringLength(assignedUser) > 0)
	{
		params[paramIndex] = assignedUser;

		paramIndex++;

		wheres.push(`LOWER(assigned_user_account_cache.username) = LOWER($` + paramIndex + `)`);
	}

	if (utils.realStringLength(createdUser) > 0)
	{
		params[paramIndex] = createdUser;

		paramIndex++;

		wheres.push(`LOWER(created_user_account_cache.username) = LOWER($` + paramIndex + `)`);
	}

	if (wheres.length > 0)
	{
		query += `
			WHERE `;

		for (const key in wheres)
		{
			if (key > 0)
			{
				query += ` AND `;
			}

			query += wheres[key];
		}
	}

	// Add order by & limit
	query += `
		ORDER BY feature.id DESC
		LIMIT $1::int OFFSET $2::int
	`;

	// Run query
	const features = await db.query(query, ...params);

	if (features.length > 0)
	{
		results = await Promise.all(features.map(async(feature) => {
			return this.query('v1/feature', {id: feature.id})
		}));

		count = Number(features[0].count);
	}

	return {
		results: results,
		count: count,
		page: page,
		pageSize: pageSize,
		statusId: statusId,
		categoryId: categoryId,
		isBug: isBug,
	};
}

features.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	statusId: {
		type: APITypes.string,
		default: '',
		length: 11,
	},
	categoryId: {
		type: APITypes.number,
		nullable: true,
	},
	isBug: {
		type: APITypes.string,
		default: 'both',
		includes: constants.flatBoolOptions,
	},
	following: {
		type: APITypes.string,
		default: 'both',
		includes: constants.flatBoolOptions,
	},
	readOnly: {
		type: APITypes.string,
		default: 'both',
		includes: constants.flatBoolOptions,
	},
	staffOnly: {
		type: APITypes.string,
		default: 'both',
		includes: constants.flatBoolOptions,
	},
	createdUser: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
	assignedUser: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
}

export default features;