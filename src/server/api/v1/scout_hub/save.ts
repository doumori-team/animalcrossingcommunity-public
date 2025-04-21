import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, UserType, MarkupStyleType, SuccessType } from '@types';

/*
 * Save scout settings.
 */
async function save(this: APIThisType, { welcomeTemplate, closingTemplate, welcomeTemplateFormat, closingTemplateFormat }: saveProps): Promise<SuccessType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const user: UserType = await this.query('v1/user', { id: this.userId });

	if (user.group.identifier !== constants.staffIdentifiers.scout)
	{
		throw new UserError('permission');
	}

	await db.query(`
		INSERT INTO scout_settings (scout_id, welcome_template, closing_template, welcome_template_format, closing_template_format)
		VALUES ($1::int, $2, $3, $4, $5)
		ON CONFLICT (scout_id) DO 
			UPDATE SET welcome_template = $2, closing_template = $3, welcome_template_format = $4, closing_template_format = $5
	`, user.id, welcomeTemplate, closingTemplate, welcomeTemplateFormat, closingTemplateFormat);

	return {
		_success: `Your Scout Settings have been updated.`,
	};
}

save.apiTypes = {
	welcomeTemplate: {
		type: APITypes.string,
		default: '',
		profanity: true,
	},
	closingTemplate: {
		type: APITypes.string,
		default: '',
		profanity: true,
	},
	welcomeTemplateFormat: {
		type: APITypes.string,
		default: '',
		includes: ['plaintext', 'markdown', 'bbcode'],
	},
	closingTemplateFormat: {
		type: APITypes.string,
		default: '',
		includes: ['plaintext', 'markdown', 'bbcode'],
	},
};

type saveProps = {
	welcomeTemplate: string
	closingTemplate: string
	welcomeTemplateFormat: MarkupStyleType
	closingTemplateFormat: MarkupStyleType
};

export default save;
