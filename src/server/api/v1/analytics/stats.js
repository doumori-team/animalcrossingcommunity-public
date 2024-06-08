import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils, constants } from '@utils';
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
	let afterLaunch = true;
	let lineGraphStats = {
		statData: [],
		lines: [],
	};
	let barGraphStats = [];

	if (dateUtils.isBefore(date, constants.launchDate))
	{
		afterLaunch = false;
	}

	const cacheKey = 'v1/analytics/stats';

	const [
		[totalPosts], [totalNewThreads], [totalNewPatterns], [totalNewTrades],
		[totalNewSignups], totalUniqueMembers, totalFeatures, [totalTreasureOffers],
		totalPageRequests, totalAdoptions, totalUserTickets, totalSupportTickets,
		totalSupportEmails, [totalNewTunes], [totalDonations],
		lastTotalPosts, lastTotalThreads, lastTotalPatterns, lastTotalTrades,
		lastTotalSignups, lastTotalMembers, lastTotalFeatures, lastTotalOffers,
		lastTotalRequests, lastTotalAdoptions, lastTotalUTs, lastTotalSTs,
		lastTotalEmails, lastTotalTunes, lastTotalDonations,
		yearTotalPosts, yearTotalThreads, yearTotalPatterns, yearTotalTrades,
		yearTotalSignups, yearTotalMembers, yearTotalFeatures, yearTotalOffers,
		yearTotalRequests, yearTotalAdoptions, yearTotalUTs, yearTotalSTs,
		yearTotalEmails, yearTotalTunes, yearTotalDonations
	] = await Promise.all([
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count
			FROM node
			WHERE creation_time >= $1 AND creation_time <= $2 AND type = 'post'
		`, startDateTS, endDateTS), // totalPosts
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count
			FROM node
			WHERE creation_time >= $1 AND creation_time <= $2 AND type = 'thread'
		`, startDateTS, endDateTS), // totalNewThreads
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count
			FROM pattern
			WHERE creation >= $1 AND creation <= $2
		`, startDateTS, endDateTS), // totalNewPatterns
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count
			FROM listing
			WHERE created >= $1 AND created <= $2
		`, startDateTS, endDateTS), // totalNewTrades
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count
			FROM user_account_cache
			WHERE signup_date >= $1 AND signup_date <= $2
		`, date, date), // totalNewSignups
		afterLaunch ? db.cacheQuery(cacheKey, `
			SELECT count(DISTINCT user_id) AS count
			FROM user_session
			WHERE start_date >= $1 AND start_date <= $2
		`, startDateTS, endDateTS) : null, // totalUniqueMembers
		afterLaunch ? db.cacheQuery(cacheKey, `
			SELECT count(*) AS count
			FROM feature
			WHERE created >= $1 AND created <= $2
		`, startDateTS, endDateTS) : null, // totalFeatures
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count
			FROM treasure_offer
			WHERE offer >= $1 AND offer <= $2
		`, startDateTS, endDateTS), // totalTreasureOffers
		afterLaunch ? db.cacheQuery(cacheKey, `
			SELECT number
			FROM site_statistic_data
			WHERE date >= $1 AND date <= $2 AND site_statistic_id = 1
		`, date, date) : null, // totalPageRequests
		scoutPerm ? db.cacheQuery(cacheKey, `
			SELECT count(*) AS count
			FROM adoption
			WHERE adopted >= $1 AND adopted <= $2
		`, startDateTS, endDateTS) : null, // totalAdoptions
		userTicketPerm ? db.cacheQuery(cacheKey, `
			SELECT count(*) AS count
			FROM user_ticket
			WHERE created >= $1 AND created <= $2
		`, startDateTS, endDateTS) : null, // totalUserTickets
		supportTicketPerm ? db.cacheQuery(cacheKey, `
			SELECT count(*) AS count
			FROM support_ticket
			WHERE created >= $1 AND created <= $2
		`, startDateTS, endDateTS) : null, // totalSupportTickets
		userTicketPerm ? db.cacheQuery(cacheKey, `
			SELECT count(*) AS count
			FROM support_email
			WHERE recorded >= $1 AND recorded <= $2 AND from_email IS NOT NULL AND from_email != 'support@animalcrossingcommunity.com'
		`, startDateTS, endDateTS) : null, // totalSupportEmails
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count
			FROM town_tune
			WHERE created >= $1 AND created <= $2
		`, startDateTS, endDateTS), // totalNewTunes
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count
			FROM user_donation
			WHERE donated >= $1 AND donated <= $2
		`, startDateTS, endDateTS), // totalDonations
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count, date(creation_time) AS day
			FROM node
			WHERE creation_time >= current_date - interval '14' day AND date(creation_time) != date(now() AT TIME ZONE 'EST') AND type = 'post'
			GROUP BY date(creation_time)
			ORDER BY date(creation_time) ASC
		`), // lastTotalPosts
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count, date(creation_time) AS day
			FROM node
			WHERE creation_time >= current_date - interval '14' day AND date(creation_time) != date(now() AT TIME ZONE 'EST') AND type = 'thread'
			GROUP BY date(creation_time)
			ORDER BY date(creation_time) ASC
		`), // lastTotalThreads
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count, date(creation) AS day
			FROM pattern
			WHERE creation >= current_date - interval '14' day AND date(creation) != date(now() AT TIME ZONE 'EST')
			GROUP BY date(creation)
			ORDER BY date(creation) ASC
		`), // lastTotalPatterns
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count, date(created) AS day
			FROM listing
			WHERE created >= current_date - interval '14' day AND date(created) != date(now() AT TIME ZONE 'EST')
			GROUP BY date(created)
			ORDER BY date(created) ASC
		`), // lastTotalTrades
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count, signup_date AS day
			FROM user_account_cache
			WHERE signup_date >= current_date - interval '14' day AND signup_date != date(now() AT TIME ZONE 'EST')
			GROUP BY signup_date
			ORDER BY signup_date ASC
		`), // lastTotalSignups
		db.cacheQuery(cacheKey, `
			SELECT count(distinct user_id) AS count, date(start_date) AS day
			FROM user_session
			WHERE start_date >= current_date - interval '14' day AND date(start_date) != date(now() AT TIME ZONE 'EST')
			GROUP BY date(start_date)
			ORDER BY date(start_date) ASC
		`), // lastTotalMembers
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count, date(created) AS day
			FROM feature
			WHERE created >= current_date - interval '14' day AND date(created) != date(now() AT TIME ZONE 'EST')
			GROUP BY date(created)
			ORDER BY date(created) ASC
		`), // lastTotalFeatures
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count, date(offer) AS day
			FROM treasure_offer
			WHERE offer >= current_date - interval '14' day AND date(offer) != date(now() AT TIME ZONE 'EST')
			GROUP BY date(offer)
			ORDER BY date(offer) ASC
		`), // lastTotalOffers
		db.cacheQuery(cacheKey, `
			SELECT number AS count, date AS day
			FROM site_statistic_data
			WHERE date >= current_date - interval '14' day AND date != date(now() AT TIME ZONE 'EST') AND site_statistic_id = 1
			ORDER BY date ASC
		`), // lastTotalRequests
		scoutPerm ? db.cacheQuery(cacheKey, `
			SELECT count(*) AS count, date(adopted) AS day
			FROM adoption
			WHERE adopted >= current_date - interval '14' day AND date(adopted) != date(now() AT TIME ZONE 'EST')
			GROUP BY date(adopted)
			ORDER BY date(adopted) ASC
		`) : null, // lastTotalAdoptions
		userTicketPerm ? db.cacheQuery(cacheKey, `
			SELECT count(*) AS count, date(created) AS day
			FROM user_ticket
			WHERE created >= current_date - interval '14' day AND date(created) != date(now() AT TIME ZONE 'EST')
			GROUP BY date(created)
			ORDER BY date(created) ASC
		`) : null, // lastTotalUTs
		supportTicketPerm ? db.cacheQuery(cacheKey, `
			SELECT count(*) AS count, date(created) AS day
			FROM support_ticket
			WHERE created >= current_date - interval '14' day AND date(created) != date(now() AT TIME ZONE 'EST')
			GROUP BY date(created)
			ORDER BY date(created) ASC
		`) : null, // lastTotalSTs
		userTicketPerm ? db.cacheQuery(cacheKey, `
			SELECT count(*) AS count, date(recorded) AS day
			FROM support_email
			WHERE recorded >= current_date - interval '14' day AND date(recorded) != date(now() AT TIME ZONE 'EST') AND from_email IS NOT NULL AND from_email != 'support@animalcrossingcommunity.com'
			GROUP BY date(recorded)
			ORDER BY date(recorded) ASC
		`) : null, // lastTotalEmails
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count, date(created) AS day
			FROM town_tune
			WHERE created >= current_date - interval '14' day AND date(created) != date(now() AT TIME ZONE 'EST')
			GROUP BY date(created)
			ORDER BY date(created) ASC
		`), // lastTotalTunes
		db.cacheQuery(cacheKey, `
			SELECT count(*) AS count, date(donated) AS day
			FROM user_donation
			WHERE donated >= current_date - interval '14' day AND date(donated) != date(now() AT TIME ZONE 'EST')
			GROUP BY date(donated)
			ORDER BY date(donated) ASC
		`), // lastTotalDonations
		db.query(`
			SELECT count, year
			FROM site_statistics_posts
			ORDER BY year ASC
		`), // yearTotalPosts
		db.query(`
			SELECT count, year
			FROM site_statistics_threads
			ORDER BY year ASC
		`), // yearTotalThreads
		db.query(`
			SELECT count, year
			FROM site_statistics_patterns
			ORDER BY year ASC
		`), // yearTotalPatterns
		db.query(`
			SELECT count, year
			FROM site_statistics_listings
			ORDER BY year ASC
		`), // yearTotalTrades
		db.query(`
			SELECT count, year
			FROM site_statistics_new_users
			ORDER BY year ASC
		`), // yearTotalSignups
		db.query(`
			SELECT count, year
			FROM site_statistics_user_sessions
			ORDER BY year ASC
		`), // yearTotalMembers
		db.query(`
			SELECT count, year
			FROM site_statistics_features
			ORDER BY year ASC
		`), // yearTotalFeatures
		db.query(`
			SELECT count, year
			FROM site_statistics_treasure_offers
			ORDER BY year ASC
		`), // yearTotalOffers
		db.query(`
			SELECT sum(number) AS count, date_part('year', date) AS year
			FROM site_statistic_data
			WHERE site_statistic_id = 1 AND date_part('year', date) != date_part('year', now() AT TIME ZONE 'EST')
			GROUP BY date_part('year', date)
			ORDER BY date_part('year', date) ASC
		`), // yearTotalRequests
		scoutPerm ? db.query(`
			SELECT count, year
			FROM site_statistics_adoptions
			ORDER BY year ASC
		`) : null, // yearTotalAdoptions
		userTicketPerm ? db.query(`
			SELECT count, year
			FROM site_statistics_user_tickets
			ORDER BY year ASC
		`) : null, // yearTotalUTs
		supportTicketPerm ? db.query(`
			SELECT count, year
			FROM site_statistics_support_tickets
			ORDER BY year ASC
		`) : null, // yearTotalSTs
		userTicketPerm ? db.query(`
			SELECT count, year
			FROM site_statistics_support_emails
			ORDER BY year ASC
		`) : null, // yearTotalEmails
		db.query(`
			SELECT count, year
			FROM site_statistics_town_tunes
			ORDER BY year ASC
		`), // yearTotalTunes
		db.query(`
			SELECT count, year
			FROM site_statistics_donations
			ORDER BY year ASC
		`), // yearTotalDonations
	]);

	lastTotalRequests.map(r => {
		const posts = lastTotalPosts.find(x => x.day === r.day);
		const threads = lastTotalThreads.find(x => x.day === r.day);
		const patterns = lastTotalPatterns.find(x => x.day === r.day);
		const tunes = lastTotalTunes.find(x => x.day === r.day);
		const trades = lastTotalTrades.find(x => x.day === r.day);
		const signups = lastTotalSignups.find(x => x.day === r.day);
		const treasures = lastTotalOffers.find(x => x.day === r.day);
		const users = lastTotalMembers.find(x => x.day === r.day);
		const features = lastTotalFeatures.find(x => x.day === r.day);
		const donations = lastTotalDonations.find(x => x.day === r.day);

		let statData = {
			'name': r.day,
			'Posts': posts ? Number(posts.count) : 0,
			'Threads': threads ? Number(threads.count) : 0,
			'Patterns': patterns ? Number(patterns.count) : 0,
			'Tunes': tunes ? Number(tunes.count) : 0,
			'Trades': trades ? Number(trades.count) : 0,
			'Signups': signups ? Number(signups.count) : 0,
			'Treasures': treasures ? Number(treasures.count) : 0,
			'Users': users ? Number(users.count) : 0,
			'Features / Bugs': features ? Number(features.count) : 0,
			//'Page Requests': Number(r.count),
			'Donations': donations ? Number(donations.count) : 0,
		};

		if (scoutPerm)
		{
			const adoptions = lastTotalAdoptions.find(x => x.day === r.day);

			statData['Adoptions'] = adoptions ? Number(adoptions.count) : 0;
		}

		if (userTicketPerm)
		{
			const uts = lastTotalUTs.find(x => x.day === r.day);
			const emails = lastTotalEmails.find(x => x.day === r.day);

			statData['UTs'] = uts ? Number(uts.count) : 0;
			statData['Emails'] = emails ? Number(emails.count) : 0;
		}

		if (supportTicketPerm)
		{
			const sts = lastTotalSTs.find(x => x.day === r.day);

			statData['STs'] = sts ? Number(sts.count) : 0;
		}

		lineGraphStats.statData.push(statData);
	});

	yearTotalSignups.map(s => {
		const posts = yearTotalPosts.find(x => x.year === s.year);
		const threads = yearTotalThreads.find(x => x.year === s.year);
		const patterns = yearTotalPatterns.find(x => x.year === s.year);
		const tunes = yearTotalTunes.find(x => x.year === s.year);
		const trades = yearTotalTrades.find(x => x.year === s.year);
		const treasures = yearTotalOffers.find(x => x.year === s.year);
		const users = yearTotalMembers.find(x => x.year === s.year);
		const features = yearTotalFeatures.find(x => x.year === s.year);
		const requests = yearTotalRequests.find(x => x.year === s.year);
		const donations = yearTotalDonations.find(x => x.year === s.year);

		barGraphStats = setYearResults(barGraphStats, 'Posts', posts, s.year);
		barGraphStats = setYearResults(barGraphStats, 'Threads', threads, s.year);
		barGraphStats = setYearResults(barGraphStats, 'Patterns', patterns, s.year);
		barGraphStats = setYearResults(barGraphStats, 'Tunes', tunes, s.year);
		barGraphStats = setYearResults(barGraphStats, 'Trades', trades, s.year);
		barGraphStats = setYearResults(barGraphStats, 'Signups', s, s.year);
		barGraphStats = setYearResults(barGraphStats, 'Treasures', treasures, s.year);
		barGraphStats = setYearResults(barGraphStats, 'Users', users, s.year);
		barGraphStats = setYearResults(barGraphStats, 'Features / Bugs', features, s.year);
		barGraphStats = setYearResults(barGraphStats, 'Page Requests', requests, s.year);
		barGraphStats = setYearResults(barGraphStats, 'Donations', donations, s.year);

		if (scoutPerm)
		{
			const adoptions = yearTotalAdoptions.find(x => x.year === s.year);

			barGraphStats = setYearResults(barGraphStats, 'Adoptions', adoptions, s.year);
		}

		if (userTicketPerm)
		{
			const uts = yearTotalUTs.find(x => x.year === s.year);
			const emails = yearTotalEmails.find(x => x.year === s.year);

			barGraphStats = setYearResults(barGraphStats, 'UTs', uts, s.year);
			barGraphStats = setYearResults(barGraphStats, 'Emails', emails, s.year);
		}

		if (supportTicketPerm)
		{
			const sts = yearTotalSTs.find(x => x.year === s.year);

			barGraphStats = setYearResults(barGraphStats, 'STs', sts, s.year);
		}
	});

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
			label: 'Total Treasure Offers',
			number: Number(totalTreasureOffers.count).toLocaleString(),
		},
		{
			label: 'Total Donations',
			number: Number(totalDonations.count).toLocaleString(),
		}
	];

	lineGraphStats.lines.push('Posts');
	lineGraphStats.lines.push('Threads');
	lineGraphStats.lines.push('Patterns');
	lineGraphStats.lines.push('Tunes');
	lineGraphStats.lines.push('Trades');
	lineGraphStats.lines.push('Signups');
	lineGraphStats.lines.push('Treasures');
	lineGraphStats.lines.push('Users');
	lineGraphStats.lines.push('Features / Bugs');
	//lineGraphStats.lines.push('Page Requests');
	lineGraphStats.lines.push('Donations');

	if (afterLaunch)
	{
		results.push({
			label: 'Total Unique Users',
			number: totalUniqueMembers && totalUniqueMembers[0] ? Number(totalUniqueMembers[0].count).toLocaleString() : 0,
		});

		results.push({
			label: 'Total Features / Bugs',
			number: totalFeatures && totalFeatures[0] ? Number(totalFeatures[0].count).toLocaleString() : 0,
		});

		results.push({
			label: 'Total Page Requests',
			number: totalPageRequests && totalPageRequests[0] ? Number(totalPageRequests[0].number).toLocaleString() : 0,
		});
	}

	if (scoutPerm)
	{
		results.push({
			label: 'Total Adoptions',
			number: Number(totalAdoptions[0].count).toLocaleString(),
		});

		lineGraphStats.lines.push('Adoptions');
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

		lineGraphStats.lines.push('UTs');
		lineGraphStats.lines.push('Emails');
	}

	if (supportTicketPerm)
	{
		results.push({
			label: 'Total Support Tickets',
			number: Number(totalSupportTickets[0].count).toLocaleString(),
		});

		lineGraphStats.lines.push('STs');
	}

	return {
		results: results,
		date: date,
		lineGraphStats: lineGraphStats,
		barGraphStats: barGraphStats,
	};
}

function setYearResults(barGraphStats, name, data, year)
{
	const stat = barGraphStats.find(x => x.name === name);

	if (stat)
	{
		stat.data.push({
			year: year,
			[name]: data ? Number(data.count) : 0,
		});
	}
	else
	{
		barGraphStats.push({
			name: name,
			data: [
				{
					year: year,
					[name]: data ? Number(data.count) : 0,
				}
			]
		});
	}

	return barGraphStats;
}

stats.apiTypes = {
	date: {
		type: APITypes.date,
		default: dateUtils.formatYesterdayYearMonthDay(),
	},
}

export default stats;