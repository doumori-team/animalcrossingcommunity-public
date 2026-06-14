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

	if (userIds.length === 0)
	{
		throw new UserError('bad-format');
	}

	const numericUserIds: number[] = [...new Set(userIds.map((id: string | number) => Number(id)))];

	// Validate all user IDs in one query
	const validUsers: { id: number }[] = await db.query(`
		SELECT id
		FROM user_account_cache
		WHERE id = ANY($1::int[])
	`, numericUserIds);

	if (validUsers.length !== numericUserIds.length)
	{
		throw new UserError('no-such-user');
	}

	// Perform queries
	const results: { type: string, category: string, user_id: number }[] = await db.query(`
		SELECT type, category, user_id
		FROM emoji_setting
		WHERE user_id = ANY($1)
	`, numericUserIds);

	return results.map(result =>
	{
		return {
			userId: result.user_id,
			type: result.type,
			category: result.category,
		};
	});
}

type emojiProps = {
	userIds: string[] | number[] | string
};
