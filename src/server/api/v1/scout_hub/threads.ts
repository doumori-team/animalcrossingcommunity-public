import * as db from '@db';
import { UserError } from '@errors';
import { utils, dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, AdoptionThreadsType, UserType } from '@types';

/*
 * Gets adoption threads.
 */
async function threads(this: APIThisType, { page, scoutIds, adoptee, newMembers, locked }: threadsProps): Promise<AdoptionThreadsType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'scout-pages' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check parameters
	scoutIds = await Promise.all(scoutIds.map(async(id) =>
	{
		if (isNaN(id))
		{
			throw new UserError('no-such-user');
		}

		let [checkId] = await db.query(`
			SELECT id
			FROM users
			WHERE id = $1::int
		`, id);

		if (!checkId)
		{
			throw new UserError('no-such-user');
		}

		return Number(id);
	}));

	const user: UserType = await this.query('v1/user', { id: this.userId });

	if (user.group.identifier === constants.staffIdentifiers.scout && scoutIds.length === 0 && this.userId != null)
	{
		scoutIds = [this.userId];
	}

	// Do actual search
	const pageSize = 24;
	const offset = page * pageSize - pageSize;
	let params: any = [pageSize, offset];
	let paramIndex = params.length;
	let results = [], count = 0;

	let query = `
		SELECT
			adoption.node_id,
			adoption.scout_id,
			adoption.adoptee_id,
			adoption.adopted,
			adoptee_account_cache.username AS adoptee_username,
			scout_account_cache.username AS scout_username,
			(
				SELECT node_revision.time
				FROM node_revision
				JOIN node ON (node.id = node_revision.node_id)
				WHERE node.parent_node_id = adoption.node_id
				ORDER BY node_revision.time DESC
				LIMIT 1
			) AS last_updated,
			count(*) over() AS count
		FROM adoption
		JOIN user_account_cache AS adoptee_account_cache ON (adoptee_account_cache.id = adoption.adoptee_id)
		JOIN user_account_cache AS scout_account_cache ON (scout_account_cache.id = adoption.scout_id)
	`;

	// Add joins
	if (['yes', 'no'].includes(locked))
	{
		query += `
			JOIN node ON (node.id = adoption.node_id)
		`;
	}

	// Add wheres
	let wheres = [];

	if (utils.realStringLength(adoptee) > 0)
	{
		params[paramIndex] = adoptee;

		paramIndex++;

		wheres.push(`LOWER(adoptee_account_cache.username) = LOWER($` + paramIndex + `)`);
	}

	if (['yes', 'no'].includes(newMembers))
	{
		params[paramIndex] = constants.scoutHub.newMemberEligibility;

		paramIndex++;

		if (newMembers === 'yes')
		{
			wheres.push(`adoptee_account_cache.signup_date > (current_date - interval '1 day' * $` + paramIndex + `)`);
		}
		else
		{
			wheres.push(`adoptee_account_cache.signup_date < (current_date - interval '1 day' * $` + paramIndex + `)`);
		}
	}

	if (['yes', 'no'].includes(locked))
	{
		if (locked === 'yes')
		{
			wheres.push(`node.locked IS NOT NULL`);
		}
		else
		{
			wheres.push(`node.locked IS NULL`);
		}
	}

	if (scoutIds.length > 0)
	{
		params[paramIndex] = scoutIds;

		paramIndex++;

		wheres.push(`adoption.scout_id = ANY($` + paramIndex + `)`);
	}

	if (wheres.length > 0)
	{
		query += `
			WHERE `;

		for (const key in wheres)
		{
			if (Number(key) > 0)
			{
				query += ` AND `;
			}

			query += wheres[key];
		}
	}

	// Add order by & limit
	query += `
		ORDER BY adoption.adopted DESC
		LIMIT $1::int OFFSET $2::int
	`;

	// Run query
	const [threads, scouts] = await Promise.all([
		db.query(query, ...params),
		db.query(`
			SELECT user_account_cache.id, user_account_cache.username
			FROM adoption
			JOIN user_account_cache ON (user_account_cache.id = adoption.scout_id)
			GROUP BY user_account_cache.id
			ORDER BY user_account_cache.username ASC
		`),
	]);

	if (threads.length > 0)
	{
		results = await Promise.all(threads.map(async (thread: any) =>
		{
			return {
				id: thread.node_id,
				scoutId: thread.scout_id,
				scoutUsername: thread.scout_username,
				adopteeId: thread.adoptee_id,
				adopteeUsername: thread.adoptee_username,
				adopted: dateUtils.formatDateTime(thread.adopted),
				lastUpdated: thread.last_updated ? dateUtils.formatDateTime(thread.last_updated) : null,
				hasPermission: thread.node_id ? await this.query('v1/node/permission', { permission: 'read', nodeId: thread.node_id }) : false,
			};
		}));

		count = Number(threads[0].count);
	}

	return <AdoptionThreadsType>{
		threads: results,
		count: count,
		page: page,
		adoptee: adoptee,
		pageSize: pageSize,
		newMembers: newMembers,
		locked: locked,
		scoutIds: scoutIds,
		scouts: scouts,
	};
}

threads.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	adoptee: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
	newMembers: {
		type: APITypes.string,
		default: '',
		includes: ['yes', 'no', 'both'],
	},
	locked: {
		type: APITypes.string,
		default: '',
		includes: ['yes', 'no', 'both'],
	},
	scoutIds: {
		type: APITypes.array,
	},
};

type threadsProps = {
	page: number
	adoptee: string
	newMembers: string
	locked: string
	scoutIds: number[]
};

export default threads;
