#!/usr/bin/env node

// This is intended to be run daily.
// It needs to be added to the scheduler from within the Heroku dashboard.

const pg = require('pg');

const pool = new pg.Pool(
{
	connectionString: process.env.DATABASE_URL,
	ssl: {rejectUnauthorized: false} // Heroku self-signs its database SSL certificates
});

const constants = {
	tradingPost: {
		// Get statuses for listings.
		listingStatuses: {
			open: 'Open',
			offerAccepted: 'Offer Accepted',
			inProgress: 'In Progress',
			completed: 'Completed',
			closed: 'Closed',
			cancelled: 'Cancelled',
			failed: 'Failed',
			expired: 'Expired',
		},
		// Get statuses for offers.
		offerStatuses: {
			pending: 'Pending',
			onHold: 'On Hold',
			accepted: 'Accepted',
			rejected: 'Rejected',
			cancelled: 'Cancelled',
		},
		// When a trade expires.
		tradeExpiry: 7,
	},
	scoutHub: {
		// How many days a user is considered to be a new member
		newMemberEligibility: 14,
	},
	boardIds: {
		schrodingersChat: 200000336,
	},
};

async function daily()
{
	console.info('Starting daily');

	// expire any 'Open' listings
	console.info('Expiring any open listings');

	await pool.query(`
		INSERT INTO notification (user_id, reference_id, reference_type_id, description)
		SELECT
			listing_offer.user_id,
			listing.id,
			(SELECT id FROM notification_type WHERE identifier = 'listing_expired'),
			'The listing has expired'
		FROM listing
		JOIN listing_offer ON (listing_offer.listing_id = listing.id)
		JOIN users ON (listing.creator_id = users.id)
		WHERE listing_offer.status IN ('${constants.tradingPost.offerStatuses.pending}', '${constants.tradingPost.offerStatuses.onHold}', '${constants.tradingPost.offerStatuses.accepted}') AND listing.status IN ('${constants.tradingPost.listingStatuses.open}', '${constants.tradingPost.listingStatuses.offerAccepted}') AND users.last_active_time < (current_date - interval '1 day' * ${constants.tradingPost.tradeExpiry})
		ON CONFLICT ON CONSTRAINT notification_user_id_reference_id_reference_type_id_key DO UPDATE SET
			notified = null,
			description = EXCLUDED.description
	`);

	await pool.query(`
		UPDATE listing
		SET status = '${constants.tradingPost.listingStatuses.expired}', last_updated = NOW()
		FROM users
		WHERE users.id = listing.creator_id AND listing.status IN ('${constants.tradingPost.listingStatuses.open}', '${constants.tradingPost.listingStatuses.offerAccepted}') AND users.last_active_time < (current_date - interval '1 day' * ${constants.tradingPost.tradeExpiry})
	`);

	await pool.query(`
		UPDATE listing_offer
		SET status = '${constants.tradingPost.offerStatuses.rejected}'
		FROM listing
		WHERE listing.id = listing_offer.listing_id AND listing.status = '${constants.tradingPost.listingStatuses.expired}' AND listing_offer.status != '${constants.tradingPost.offerStatuses.rejected}'
	`);

	// adoptee thread closing reminders
	console.info('Creating adoptee thread closing reminders');

	await pool.query(`
		INSERT INTO notification (user_id, reference_id, reference_type_id, description)
		SELECT
			adoption.scout_id,
			adoption.node_id,
			(SELECT id FROM notification_type WHERE identifier = 'scout_closed'),
			'Remember to close your Adoptee Thread!'
		FROM adoption
		JOIN node ON (node.id = adoption.node_id)
		WHERE adopted < (current_date - interval '1 day' * ${constants.scoutHub.newMemberEligibility}) AND node.locked is null
		ON CONFLICT ON CONSTRAINT notification_user_id_reference_id_reference_type_id_key DO UPDATE SET
			notified = null,
			description = EXCLUDED.description
	`);

	// Clear out avatars that are no longer available
	console.info('Clearing out avatars that are no longer available');

	// see v1/avatars.js
	await pool.query(`
		UPDATE users
		SET avatar_coloration_id = NULL, avatar_character_id = NULL, avatar_background_id = NULL, avatar_accent_id = NULL
		FROM avatars_events
		WHERE current_date NOT BETWEEN start_date AND end_date AND (users.avatar_coloration_id = ANY(coloration_ids) OR users.avatar_character_id = ANY(character_ids) OR users.avatar_accent_id = ANY(accent_ids) OR users.avatar_background_id = ANY(background_ids))
	`);

	// delete users who haven't given consent
	console.info('Deleting users who have not given consent');

	await pool.query(`
		DELETE FROM users USING user_account_cache WHERE user_account_cache.id = users.id AND users.consent_given = false AND user_account_cache.signup_date < now() - interval '30' day
	`);

	// any users who don't meet donation minimum for signature color
	console.info('Reseting signature format based on donation');

	await pool.query(`
		UPDATE users
		SET signature_format = 'plaintext'
		WHERE signature_format != 'plaintext' AND id NOT IN (
			SELECT user_id
			FROM user_donation
			WHERE donated >= now() - interval '1' year
			GROUP BY user_id
			HAVING COALESCE(sum(donation), 0) >= 5
		)
	`);

	// clean up tables to keep database small
	console.info('Clearing out older tables: poll_answer');

	await pool.query(`
		DELETE FROM poll_answer
		WHERE poll_id IN (
			SELECT id
			FROM poll
			WHERE start_date + duration < now() - interval '30' day
			ORDER BY start_date DESC
			LIMIT 100
		)
	`);

	console.info('Clearing out older tables: notifications for perma-banned users');

	await pool.query(`
		DELETE FROM notification
		WHERE user_id IN (
			SELECT id
			FROM users
			WHERE current_ban_length_id = 7
		)
	`);

	// could also do: avatar_event_dates, node_user, notification, scout_settings

	// deactivate any giveaways with no owner(s) online in 30 days
	console.info('Deactivate any giveaways with no owner9s) online in 30 days');

	await pool.query(`
		UPDATE shop
		SET active = false
		WHERE id IN (
			SELECT shop.id
			FROM shop
			WHERE active = true AND NOT EXISTS (
				SELECT shop_user.shop_id
				FROM shop_user
				JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
				JOIN shop_role ON (shop_role.id = shop_user_role.shop_role_id)
				JOIN users ON (shop_user.user_id = users.id)
				WHERE shop_role.parent_id IS NULL AND shop_role.shop_id = shop.id AND users.last_active_time > now() - interval '30 days'
			)
		)
	`);

	var todaysDate = new Date();
	todaysDate.setHours(0,0,0,0);

	var updateStatsDate = new Date(`1/1/${todaysDate.getFullYear()}`);
	updateStatsDate.setHours(0,0,0,0);

	if (updateStatsDate.getTime() == todaysDate.getTime())
	{
		console.info('Updating last year stats');

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_posts
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_threads
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_treasure_offers
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_patterns
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_listings
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_new_users
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_user_sessions
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_features
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_adoptions
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_user_tickets
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_support_tickets
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_support_emails
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_town_tunes
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_donations
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_bell_shop
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW site_statistics_shop_orders
		`);

		console.info('Update top_bell_latest');

		await pool.query(`
			UPDATE site_setting
			SET updated = (SELECT updated - interval '1 day' FROM site_setting WHERE id = 4)
			WHERE id = 5
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW CONCURRENTLY top_bell_latest
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW CONCURRENTLY top_bell_last_jackpot
		`);

		await pool.query(`
			REFRESH MATERIALIZED VIEW CONCURRENTLY top_bell_search
		`);

		console.info('Locking any public unlocked normal thread that hasn not been replied to in 5 years');

		// includes all public boards + GG Boards
		await pool.query(`
			UPDATE node
			SET locked = now()
			WHERE type = 'thread' AND locked is null AND parent_node_id IN (200000001,200000002,200000003,200000033,200000055,200000062,200000065,200000069,200000070,200000090,200000093,200000097,200000098,200000140,200000145,200000149,200000152,200000255,200000257,200000267,200000306,200000318,200000319,200000320,200000337,200000356,200000363,200000364,200000365,200000137,200000139,200000138,200000002,200000336,200000258) AND thread_type = 'normal' AND latest_reply_time < now() - interval '5' year
		`);
	}

	console.info('Notify Admins: Support Emails');

	await pool.query(`
		INSERT INTO notification (user_id, reference_id, reference_type_id, description)
		SELECT users.id AS user_id, support_email.id AS support_email_id, 32, 'Pending Support Email'
		FROM support_email, users
		WHERE users.user_group_id = 3 AND support_email.recorded < current_date - interval '7' day AND read = false
		ON CONFLICT ON CONSTRAINT notification_user_id_reference_id_reference_type_id_key DO UPDATE SET
			notified = null,
			description = EXCLUDED.description
	`);

	console.info('Notify Admins: User Tickets');

	await pool.query(`
		INSERT INTO notification (user_id, reference_id, reference_type_id, description)
		SELECT users.id AS user_id, user_ticket.id AS user_ticket_id, 21, 'Pending User Ticket'
		FROM user_ticket, users
		WHERE users.user_group_id = 3 AND user_ticket.created < current_date - interval '7' day AND closed IS NULL
		ON CONFLICT ON CONSTRAINT notification_user_id_reference_id_reference_type_id_key DO UPDATE SET
			notified = null,
			description = EXCLUDED.description
	`);

	var schrodingersChatOnDate = new Date(`4/1/${todaysDate.getFullYear()}`);
	schrodingersChatOnDate.setHours(0,0,0,0);
	var schrodingersChatOffDate = new Date(`4/2/${todaysDate.getFullYear()}`);
	schrodingersChatOffDate.setHours(0,0,0,0);

	if (schrodingersChatOnDate.getTime() == todaysDate.getTime())
	{
		console.info('Turn on Schrödingers Chat');

		await pool.query(`
			UPDATE user_group_node_permission
			SET granted = true
			WHERE node_id = ${constants.boardIds.schrodingersChat} AND ((user_group_id = 0 AND node_permission_id = 1) OR (user_group_id = 1 AND node_permission_id = 2))
		`);
	}
	else if (schrodingersChatOffDate.getTime() == todaysDate.getTime())
	{
		console.info('Turn off Schrödingers Chat');

		await pool.query(`
			UPDATE user_group_node_permission
			SET granted = false
			WHERE node_id = ${constants.boardIds.schrodingersChat} AND ((user_group_id = 0 AND node_permission_id = 1) OR (user_group_id = 1 AND node_permission_id = 2))
		`);
	}

	console.info('Donation Reminders');

	await pool.query(`
		INSERT INTO notification (user_id, reference_id, reference_type_id, description)
		SELECT user_donation.user_id, user_donation.user_id, 39, 'You last donated a year ago. Donate again soon!'
		FROM user_donation
		GROUP BY user_donation.user_id
		HAVING current_date - interval '1 year' - interval '1 day' = max(date(user_donation.donated))
		ON CONFLICT ON CONSTRAINT notification_user_id_reference_id_reference_type_id_key DO UPDATE SET
			notified = null,
			description = EXCLUDED.description
	`);
}

daily().then(function()
{
	console.info('Daily scripts complete');
});