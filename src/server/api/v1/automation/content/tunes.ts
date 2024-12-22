import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import { faker } from '@faker-js/faker/locale/en';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, SuccessType } from '@types';

/*
 * Add X Town Tunes
 */
async function tunes(this: APIThisType, { amount }: tunesProps): Promise<SuccessType>
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

	// Perform queries
	const staffUserIds = await db.query(`
		SELECT users.id
		FROM users
		JOIN user_group ON (user_group.id = users.user_group_id)
		JOIN user_group AS staff_group ON (user_group.parent_id = staff_group.id)
		WHERE staff_group.identifier = 'staff'
	`);

	let notes: number[] | string[] = [9, 14, 1, 9, 8, 13, 1, 11, 12, 0, 15, 0, 5, 1, 0, 0];

	notes = notes.map((id) =>
	{
		return Number(id).toString(16).padStart(4, '0');
	});

	for (let i = 0; i < amount; i++)
	{
		const tuneUserId = (faker.helpers.arrayElement(staffUserIds) as any).id;
		const tuneName = faker.lorem.words();

		await db.query(`
			INSERT INTO town_tune (name, creator_id, notes)
			VALUES ($1, $2::int, $3)
		`, tuneName, tuneUserId, notes.join(''));
	}

	ACCCache.deleteMatch(constants.cacheKeys.userLite);

	return {
		_success: `Your tunes(s) have been created!`,
	};
}

tunes.apiTypes = {
	amount: {
		type: APITypes.number,
		required: true,
		max: 100,
		min: 1,
	},
};

type tunesProps = {
	amount: number
};

export default tunes;
