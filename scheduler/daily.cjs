#!/usr/bin/env node

// This is intended to be run daily.
// It needs to be added to the scheduler from within the Heroku dashboard.

const pg = require('pg');

const pool = new pg.Pool(
{
	connectionString: process.env.DATABASE_URL,
	ssl: {rejectUnauthorized: false} // Heroku self-signs its database SSL certificates
});

async function daily()
{
	console.log('Starting daily');

	// expire any 'Open' listings
	await pool.query(`
		UPDATE listing
		SET status = 'Expired', last_updated = NOW()
		FROM users
		WHERE users.id = listing.creator_id AND listing.status IN ('Open', 'Offer Accepted') AND users.last_active_time < (current_date - interval '1 day' * 7)
	`);

	await pool.query(`
		UPDATE listing_offer
		SET status = 'Rejected'
		FROM listing
		WHERE listing.id = listing_offer.listing_id AND listing.status = 'Expired'
	`);

	// adoptee thread closing reminders
	await pool.query(`
		INSERT INTO notification (user_id, reference_id, reference_type_id, description)
		SELECT
			adoption.scout_id,
			adoption.node_id,
			(SELECT id FROM notification_type WHERE identifier = 'scout_closed'),
			'Remember to close your Adoptee Thread!'
		FROM adoption
		JOIN node ON (node.id = adoption.node_id)
		WHERE adopted < (current_date - interval '1 day' * 14) AND node.locked is null
		ON CONFLICT ON CONSTRAINT notification_user_id_reference_id_reference_type_id_key DO UPDATE SET notified = null
	`);

	// Clear out avatars that are no longer available
	await pool.query(`
		UPDATE users
		SET avatar_coloration_id = NULL, avatar_character_id = NULL, avatar_background_id = NULL, avatar_accent_id = NULL
		WHERE id IN (
			-- Get all events that aren't running right now and get all the users that have avatar elements for those events
			SELECT
				users.id
			FROM (
				-- For each event date, get all the accents, characters, backgrounds and colorations
				SELECT
					array_agg(avatar_accent_eventmap.accent_id) AS accent_ids,
					array_agg(avatar_character_eventmap.character_id) AS character_ids,
					array_agg(avatar_background_eventmap.background_id) AS background_ids,
					array_agg(avatar_coloration_eventmap.coloration_id) AS coloration_ids,
					TO_DATE(coalesce(avatar_event_dates.start_year, date_part('year', now())) || TO_CHAR(avatar_event_dates.start_month, 'FM00') || (case when avatar_event_dates.start_month = 2 AND avatar_event_dates.start_day = 29 then (case when extract(year from now())::integer % 4 = 0 then avatar_event_dates.start_day else 28 end) else avatar_event_dates.start_day end), 'YYYYMMDD') AS start_date,
					TO_DATE(coalesce(avatar_event_dates.end_year, date_part('year', now())) || TO_CHAR(avatar_event_dates.end_month, 'FM00') || (case when avatar_event_dates.end_month = 2 AND avatar_event_dates.end_day = 29 then (case when extract(year from now())::integer % 4 = 0 then avatar_event_dates.end_day else 28 end) else avatar_event_dates.end_day end), 'YYYYMMDD') AS end_date
				FROM avatar_event_dates
				JOIN avatar_event ON (avatar_event.id = avatar_event_dates.event_id)
				LEFT JOIN avatar_accent_eventmap ON (avatar_accent_eventmap.event_id = avatar_event.id)
				LEFT JOIN avatar_character_eventmap ON (avatar_character_eventmap.event_id = avatar_event.id)
				LEFT JOIN avatar_background_eventmap ON (avatar_background_eventmap.event_id = avatar_event.id)
				LEFT JOIN avatar_coloration_eventmap ON (avatar_coloration_eventmap.event_id = avatar_event.id)
				WHERE avatar_accent_eventmap.event_id IS NOT NULL OR avatar_character_eventmap.event_id IS NOT NULL OR avatar_background_eventmap.event_id IS NOT NULL OR avatar_coloration_eventmap.event_id IS NOT NULL
				GROUP BY avatar_event_dates.id
			) AS avatar_events, users
			WHERE current_date NOT BETWEEN start_date AND end_date AND (users.avatar_coloration_id = ANY(coloration_ids) OR users.avatar_character_id = ANY(character_ids) OR users.avatar_accent_id = ANY(accent_ids) OR users.avatar_background_id = ANY(background_ids))
		)
	`);

	// delete users who haven't given consent
	await pool.query(`
		DELETE FROM users USING user_account_cache WHERE user_account_cache.id = users.id AND users.consent_given = false AND user_account_cache.signup_date < now() - interval '30' day
	`);

	// any users who don't meet donation minimum for signature color
	await pool.query(`
		UPDATE users
		SET signature_format = 'plaintext'
		WHERE id NOT IN (
			SELECT user_id
			FROM user_donation
			WHERE donated >= now() - interval '1' year
			GROUP BY user_id
			HAVING coalesce(sum(donation), 0) >= 5
		)
	`);

	// clean up tables to keep database small
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

	// could also do: avatar_event_dates, node_user, notification, scout_settings
}

daily().then(function()
{
	console.log("Daily scripts complete");
});
