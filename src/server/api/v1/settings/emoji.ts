import * as db from '@db';
import { UserError } from '@errors';
import { APIThisType, EmojiSettingType } from '@types';

export default async function emoji(this: APIThisType, { userIds }: emojiProps): Promise<EmojiSettingType[]>
{
	// Check params
	if (!Array.isArray(userIds))
	{
		if (userIds)
		{
			userIds = userIds.split(',');
		}
		else
		{
			if (!this.userId)
			{
				return [];
			}

			userIds = [this.userId];
		}
	}

	userIds = await Promise.all(userIds.map(async (userId) =>
	{
		const [check] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE id = $1::int
		`, userId);

		if (!check)
		{
			throw new UserError('no-such-user');
		}

		return Number(check.id);
	}));

	if (userIds.length === 0)
	{
		throw new UserError('bad-format');
	}

	// Perform queries
	const results = await db.query(`
		SELECT type, category, user_id
		FROM emoji_setting
		WHERE user_id = ANY($1)
	`, userIds);

	return results.map((result: any) =>
	{
		return {
			userId: result.user_id,
			type: result.type,
			category: result.category,
		};
	});
}

type emojiProps = {
	userIds: any[] | string
};
