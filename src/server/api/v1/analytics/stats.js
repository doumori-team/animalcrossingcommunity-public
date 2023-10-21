import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils } from '@utils';
import * as APITypes from '@apiTypes';

async function stats({date})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [scoutPerm, userTicketPerm, supportTicketPerm] = await Promise.all([
		this.query('v1/permission', {permission: 'scout-pages'}),
		this.query('v1/permission', {permission: 'process-user-tickets'}),
		this.query('v1/permission', {permission: 'process-support-tickets'}),
	]);

	const startDateTS = date + ' 00:00:00';
	const endDateTS = date + ' 23:59:59';

	const [[totalPosts], [totalNewThreads], [totalNewPatterns], [totalNewTrades],
		[totalNewSignups], totalUniqueMembers, [totalFeatures], [totalTreasureOffers],
		[totalPageRequests], totalAdoptions, totalUserTickets, totalSupportTickets,
		totalSupportEmails, [totalNewTunes]] = await Promise.all([
		db.query(`
			SELECT count(*) AS count
			FROM node
			WHERE creation_time >= $1 AND creation_time <= $2 AND type = 'post'
		`, startDateTS, endDateTS),
		db.query(`
			SELECT count(*) AS count
			FROM node
			WHERE creation_time >= $1 AND creation_time <= $2 AND type = 'thread'
		`, startDateTS, endDateTS),
		db.query(`
			SELECT count(*) AS count
			FROM pattern
			WHERE creation >= $1 AND creation <= $2
		`, startDateTS, endDateTS),
		db.query(`
			SELECT count(*) AS count
			FROM listing
			WHERE created >= $1 AND created <= $2
		`, startDateTS, endDateTS),
		db.query(`
			SELECT count(*) AS count
			FROM user_account_cache
			WHERE signup_date >= $1 AND signup_date <= $2
		`, date, date),
		db.query(`
			SELECT user_id
			FROM user_session
			WHERE start_date >= $1 AND start_date <= $2
			GROUP BY user_id
		`, startDateTS, endDateTS),
		db.query(`
			SELECT count(*) AS count
			FROM feature
			WHERE created >= $1 AND created <= $2
		`, startDateTS, endDateTS),
		db.query(`
			SELECT count(*) AS count
			FROM treasure_offer
			WHERE offer >= $1 AND offer <= $2
		`, startDateTS, endDateTS),
		db.query(`
			SELECT number
			FROM site_statistic_data
			WHERE date >= $1 AND date <= $2 AND site_statistic_id = 1
		`, date, date),
		scoutPerm ? db.query(`
			SELECT count(*) AS count
			FROM adoption
			WHERE adopted >= $1 AND adopted <= $2
		`, startDateTS, endDateTS) : null,
		userTicketPerm ? db.query(`
			SELECT count(*) AS count
			FROM user_ticket
			WHERE created >= $1 AND created <= $2
		`, startDateTS, endDateTS) : null,
		userTicketPerm ? db.query(`
			SELECT count(*) AS count
			FROM support_ticket
			WHERE created >= $1 AND created <= $2
		`, startDateTS, endDateTS) : null,
		supportTicketPerm ? db.query(`
			SELECT count(*) AS count
			FROM support_email
			WHERE recorded >= $1 AND recorded <= $2
		`, startDateTS, endDateTS) : null,
		db.query(`
			SELECT count(*) AS count
			FROM town_tune
			WHERE created >= $1 AND created <= $2
		`, startDateTS, endDateTS),
	]);

	let results = [
		{
			label: 'Total Posts',
			number: Number(totalPosts.count).toLocaleString(),
		},
		{
			label: 'Total New Threads',
			number: Number(totalNewThreads.count).toLocaleString(),
		},
		{
			label: 'Total New Patterns',
			number: Number(totalNewPatterns.count).toLocaleString(),
		},
		{
			label: 'Total New Tunes',
			number: Number(totalNewTunes.count).toLocaleString(),
		},
		{
			label: 'Total New Trades',
			number: Number(totalNewTrades.count).toLocaleString(),
		},
		{
			label: 'Total New Signups',
			number: Number(totalNewSignups.count).toLocaleString(),
		},
		{
			label: 'Total Unique Members',
			number: Number(totalUniqueMembers.length).toLocaleString(),
		},
		{
			label: 'Total Features / Bugs',
			number: Number(totalFeatures.count).toLocaleString(),
		},
		{
			label: 'Total Treasure Offers',
			number: Number(totalTreasureOffers.count).toLocaleString(),
		},
		{
			label: 'Total Page Requests',
			number: totalPageRequests ? Number(totalPageRequests.number).toLocaleString() : 0,
		}
	];

	if (scoutPerm)
	{
		results.push({
			label: 'Total Adoptions',
			number: Number(totalAdoptions[0].count).toLocaleString(),
		});
	}

	if (userTicketPerm)
	{
		results.push({
			label: 'Total User Tickets',
			number: Number(totalUserTickets[0].count).toLocaleString(),
		});

		results.push({
			label: 'Total Support Emails',
			number: Number(totalSupportEmails[0].count).toLocaleString(),
		});
	}

	if (supportTicketPerm)
	{
		results.push({
			label: 'Total Support Tickets',
			number: Number(totalSupportTickets[0].count).toLocaleString(),
		});
	}

	return {
		results: results,
		date: date,
	};
}

stats.apiTypes = {
	date: {
		type: APITypes.date,
		default: dateUtils.formatYesterdayYearMonthDay(),
	},
}

export default stats;