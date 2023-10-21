import * as db from '@db';
import { UserError } from '@errors';

export default async function forum()
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

	return {
		signature: result.signature,
		format: result.format,
		userTitle: result.user_title,
		flagOption: result.flag_option,
		markupStyle: result.markup_style,
		showImages: result.show_images,
		conciseMode: result.concise_mode
	};
}