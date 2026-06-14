import * as db from '@db';
import { utils, constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, TopBellsType } from '@types';

/*
 * Get users' bell information.
 */
async function top_bells(this: APIThisType, { page, searchUser, order, reverse, type }: topBellsProps): Promise<TopBellsType>
{
	// Do actual search
	const pageSize = 25;
	const offset = page * pageSize - pageSize;
	let params: (number | string)[] = [pageSize, offset];
	let paramIndex = params.length;
	let results: TopBellsType['results'] = [], count = 0;

	let query = `
		SELECT
			top_bell.count,
			top_bell.id,
			top_bell.username,
			top_bell.rank,
			top_bell.total_bells,
			top_bell.missed_bells,
			top_bell.total_jackpot_bells,
			top_bell.jackpots_found,
			top_bell.jackpots_missed
	`;

	if (type === 'seasonal')
	{
		query += `
			FROM seasonal_bell_search AS top_bell
		`;
	}
	else
	{
		query += `
			FROM top_bell_search AS top_bell
		`;
	}

	// Add wheres
	let wheres: string[] = [];

	if (utils.realStringLength(searchUser) > 0)
	{
		params[paramIndex] = searchUser;

		paramIndex++;

		wheres.push(`LOWER(top_bell.username) = LOWER($` + paramIndex + `)`);
	}

	// Combine wheres
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

	// Add group by, order by & limit
	query += `
		ORDER BY ${order === 'rank' ? 'top_bell.total_bells' : order} ${order === 'rank' ? reverse ? '' : 'DESC' : reverse ? 'DESC' : ''}
		LIMIT $1::int OFFSET $2::int
	`;

	// Run query
	const [[lastJackpot], users]: [[{
		username: string
		offer: Date
		bells: number
	} | undefined], {
		count: number
		id: number
		username: string
		rank: number
		total_bells: number
		missed_bells: number
		total_jackpot_bells: number
		jackpots_found: number
		jackpots_missed: number
	}[]] = await Promise.all([
		db.query(`
			SELECT user_account_cache.username, treasure_offer.offer, treasure_offer.bells
			FROM treasure_offer
			JOIN user_account_cache ON (user_account_cache.id = treasure_offer.redeemed_user_id)
			WHERE treasure_offer.type = 'jackpot' and treasure_offer.redeemed_user_id = treasure_offer.user_id
			ORDER BY treasure_offer.offer DESC
			LIMIT 1
		`),
		db.query(query, ...params),
	]);

	if (users.length > 0)
	{
		results = users.map(user =>
		{
			return {
				id: user.id,
				username: user.username,
				rank: Number(user.rank),
				totalBells: Number(user.total_bells).toLocaleString(),
				missedBells: Number(user.missed_bells).toLocaleString(),
				totalJackpotBells: Number(user.total_jackpot_bells).toLocaleString(),
				jackpotsFound: Number(user.jackpots_found),
				jackpotsMissed: Number(user.jackpots_missed),
			};
		});

		count = utils.realStringLength(searchUser) > 0 ? 1 : Number(users[0].count);
	}

	return <TopBellsType>{
		results: results,
		count: count,
		page: page,
		pageSize: pageSize,
		searchUser: searchUser,
		order: order,
		reverse: reverse,
		lastJackpot: lastJackpot ? {
			username: lastJackpot.username,
			formattedOffered: dateUtils.formatDateTime5(lastJackpot.offer),
			amount: Number(lastJackpot.bells).toLocaleString(),
		} : null,
		type: type,
	};
}

top_bells.permissions = [
	'userId',
];

const orderOptions = constants.orderOptions.topBells.map(x => x.id);

const typeOptions = constants.bellTypeOptions.map(x => x.id);

top_bells.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	searchUser: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
	order: {
		type: APITypes.string,
		default: 'rank',
		includes: orderOptions,
	},
	reverse: {
		type: APITypes.boolean,
		default: 'false',
	},
	type: {
		type: APITypes.string,
		default: 'seasonal',
		includes: typeOptions,
	},
};

type topBellsProps = {
	page: number
	searchUser: string
	order: typeof orderOptions[number]
	reverse: boolean
	type: typeof typeOptions[number]
};

export default top_bells;
