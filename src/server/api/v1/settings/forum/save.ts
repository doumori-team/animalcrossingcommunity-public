import * as db from '@db';
import { UserError } from '@errors';
import { constants, utils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType, UserDonationsType, MarkupStyleType } from '@types';

async function save(this: APIThisType, { signature = null, format, userTitle = null, flagOption,
	markupStyle, showImages, conciseMode }: saveProps): Promise<SuccessType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const userDonations: UserDonationsType = await this.query('v1/users/donations', { id: this.userId });

	if (
		userDonations.perks < 5 && format !== 'plaintext' ||
		userDonations.perks < 10 && utils.realStringLength(signature) > constants.max.signature1 ||
		userDonations.perks < 20 && utils.realStringLength(signature) > constants.max.signature2
	)
	{
		throw new UserError('bad-format');
	}

	if (signature != null && utils.realStringLength(signature) > 0 && (signature.match(/\n/g) || []).length >= 4)
	{
		throw new UserError('signature-max-lines');
	}

	if (userTitle != null)
	{
		const groups = await db.query(`
			SELECT name
			FROM user_group
		`);

		const userTitles = groups.map((g: any) => g.name).concat(['Honorary Citizen']).concat(['New Member']);

		if (userTitles.some((ut: any) => userTitle.toLowerCase() === ut.toLowerCase()))
		{
			throw new UserError('bad-format');
		}
	}

	await db.query(`
		UPDATE users
		SET
			signature = $2::text,
			signature_format = $3,
			user_title = $4,
			flag_option = $5,
			markup_style = $6,
			show_images = $7,
			concise_mode = $8
		WHERE id = $1::int
	`, this.userId, signature, format, userTitle, flagOption, markupStyle, showImages, conciseMode);

	return {
		_success: 'Your forum settings have been updated.',
	};
}

save.apiTypes = {
	signature: {
		type: APITypes.string,
		length: constants.max.signature3,
		profanity: true,
		nullable: true,
	},
	format: {
		type: APITypes.string,
		default: 'plaintext',
		includes: ['markdown', 'bbcode', 'plaintext'],
	},
	userTitle: {
		type: APITypes.string,
		length: constants.max.userTitle,
		profanity: true,
		nullable: true,
	},
	flagOption: {
		type: APITypes.string,
		default: 'never',
		includes: ['never', 'create', 'create_reply'],
	},
	markupStyle: {
		type: APITypes.string,
		default: 'never',
		includes: ['markdown', 'bbcode', 'plaintext'],
	},
	showImages: {
		type: APITypes.boolean,
		default: 'false',
	},
	conciseMode: {
		type: APITypes.number,
		default: 3,
		min: 1,
		max: 4,
	},
};

type saveProps = {
	signature: string | null
	format: MarkupStyleType
	userTitle: string | null
	flagOption: 'never' | 'create' | 'create_reply'
	markupStyle: MarkupStyleType
	showImages: boolean
	conciseMode: number
};

export default save;
