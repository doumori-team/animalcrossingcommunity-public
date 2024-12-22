import * as db from '@db';
import { UserError } from '@errors';
import { APIThisType, ForumSettingType } from '@types';

export default async function forum(this: APIThisType): Promise<ForumSettingType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [result] = await db.query(`
		SELECT
			signature,
			signature_format AS format,
			user_title,
			flag_option,
			markup_style,
			show_images,
			concise_mode
		FROM users
		WHERE id = $1::int
	`, this.userId);

	return <ForumSettingType>{
		signature: result.signature,
		format: result.format ? result.format : 'markdown',
		userTitle: result.user_title,
		flagOption: result.flag_option,
		markupStyle: result.markup_style,
		showImages: result.show_images,
		conciseMode: result.concise_mode,
	};
}
