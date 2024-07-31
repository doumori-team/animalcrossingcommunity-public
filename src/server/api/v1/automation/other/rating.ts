import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import { faker } from '@faker-js/faker/locale/en';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

/*
 * Add WiFi Rating
 */
async function rating(this: APIThisType, {username}: ratingProps) : Promise<SuccessType>
{
	// You must be logged in and on a test site
	if (constants.LIVE_SITE)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters

	const [whitelistUser] = await db.query(`
		SELECT id
		FROM user_account_cache
		WHERE LOWER(username) = LOWER($1)
	`, username);

	if (!whitelistUser)
	{
		throw new UserError('no-such-user');
	}

	if (whitelistUser.id === this.userId)
	{
		throw new UserError('bad-format');
	}

	// Perform queries

	const [check] = await db.query(`
		SELECT rating.id
		FROM rating
		WHERE (user_id = $1::int AND rating_user_id = $2::int) OR (user_id = $2::int AND rating_user_id = $1::int)
	`, this.userId, whitelistUser.id);

	if (check)
	{
		throw new UserError('bad-format');
	}

	await db.query(`
		DELETE FROM friend_code_whitelist
		WHERE (user_id = $1::int AND whitelist_user_id = $2::int) OR (user_id = $2::int AND whitelist_user_id = $1::int)
	`, this.userId, whitelistUser.id);

	await db.query(`
		INSERT INTO friend_code_whitelist (user_id, whitelist_user_id)
		VALUES ($1::int, $2::int), ($2::int, $1::int)
	`, this.userId, whitelistUser.id);

	const ratingConfig = constants.rating.configs;

	const ratingIds = [ratingConfig.positive.id, ratingConfig.neutral.id, ratingConfig.negative.id];

	await db.query(`
		INSERT INTO rating (user_id, rating_user_id, rating, comment)
		VALUES ($1::int, $2::int, $3, $4::text)
	`, this.userId, whitelistUser.id, faker.helpers.arrayElement(ratingIds), faker.lorem.sentence());

	await db.query(`
		INSERT INTO rating (user_id, rating_user_id, rating, comment)
		VALUES ($1::int, $2::int, $3, $4::text)
	`, whitelistUser.id, this.userId, faker.helpers.arrayElement(ratingIds), faker.lorem.sentence());

	return {
		_success: `The ratings have been given!`
	};
}

rating.apiTypes = {
	username: {
		type: APITypes.string,
		required: true,
		length: constants.max.searchUsername,
	},
}

type ratingProps = {
	username: string
}

export default rating;