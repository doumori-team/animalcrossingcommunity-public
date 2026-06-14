import * as db from '@db';
import { APIThisType, ForumSettingType } from '@types';

async function forum(this: APIThisType): Promise<ForumSettingType>
{
	const [result] = await db.query(`
		SELECT
			signature,
			signature_format AS format,
			user_title,
			flag_option,
			markup_style,
			show_images,
			concise_mode,
			post_name,
			hide_post_emojis,
			disable_post_reaction_notifications
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
		postName: result.post_name,
		hidePostEmojis: result.hide_post_emojis,
		disablePostReactionNotifications: result.disable_post_reaction_notifications,
	};
}

forum.permissions = [
	'userId',
];

export default forum;
