import * as db from '@db';
import { constants } from '@utils';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

/*
 * Settings a scout has.
 */
async function settings({id})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const user = await this.query('v1/user', {id: id});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	if (user.group.identifier !== constants.staffIdentifiers.scout)
	{
		throw new UserError('permission');
	}

	const [settings] = await db.query(`
		SELECT
			welcome_template,
			closing_template,
			welcome_template_format,
			closing_template_format
		FROM scout_settings
		WHERE scout_id = $1::int
	`, user.id);

	return {
		welcomeTemplate: settings?.welcome_template,
		closingTemplate: settings?.closing_template,
		welcomeTemplateFormat: settings?.welcome_template_format,
		closingTemplateFormat: settings?.closing_template_format,
	};
}

settings.apiTypes = {
	id: {
		type: APITypes.userId,
		default: true,
	},
}

export default settings;