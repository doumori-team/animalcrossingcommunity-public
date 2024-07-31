import * as db from '@db';
import { constants } from '@utils';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, ScoutSettingsType, UserType } from '@types';

/*
 * Settings a scout has.
 */
async function settings(this: APIThisType, {id}: settingsProps) : Promise<ScoutSettingsType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const user:UserType = await this.query('v1/user', {id: id});

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

	return <ScoutSettingsType>{
		welcomeTemplate: settings?.welcome_template,
		closingTemplate: settings?.closing_template,
		welcomeTemplateFormat: settings ? settings.welcome_template_format : 'markdown',
		closingTemplateFormat: settings ? settings.closing_template_format : 'markdown',
	};
}

settings.apiTypes = {
	id: {
		type: APITypes.userId,
		default: true,
	},
}

type settingsProps = {
	id: number
}

export default settings;