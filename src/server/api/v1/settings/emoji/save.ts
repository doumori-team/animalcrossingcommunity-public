import * as db from '@db';
import { UserError } from '@errors';
import emojiDefs from 'common/markup/emoji.json';
import { APIThisType, EmojiSettingType, SuccessType } from '@types';

export default async function save(this: APIThisType, emojiSettings: EmojiSettingType[]): Promise<SuccessType>
{
	// Check Params
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	let settings = [];

	for (let key of Object.keys(emojiSettings))
	{
		// Confirm valid type
		const type = String(key || '').trim();

		if (!Object.keys(emojiDefs[0]).includes(type))
		{
			throw new UserError('bad-format');
		}

		// Confirm valid category
		const category = String(emojiSettings[key as any] || '').trim();

		if (!(emojiDefs[2] as any).includes(category))
		{
			throw new UserError('bad-format');
		}

		// All good
		settings.push({
			type: type,
			category: category,
		});
	}

	// Perform queries

	await db.transaction(async (query: any) =>
	{
		await query(`
			DELETE FROM emoji_setting
			WHERE user_id = $1::int
		`, this.userId);

		if (settings.length === 0)
		{
			return { _success: 'Your emoji settings have been updated.' };
		}

		settings.map(async (setting) =>
		{
			await query(`
				INSERT INTO emoji_setting (user_id, type, category) VALUES
				($1::int, $2, $3)
			`, this.userId, setting.type, setting.category);
		});
	});

	return {
		_success: 'Your emoji settings have been updated.',
	};
}
