import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import { APIThisType, ViewEmailType, SuccessType } from '@types';

export default async function view_email(this: APIThisType): Promise<ViewEmailType | SuccessType>
{
	// You must be on a test site
	if (constants.LIVE_SITE)
	{
		throw new UserError('permission');
	}

	const [latestEmail] = await db.query(`
		SELECT from_email, subject, body, recorded
		FROM support_email
		ORDER BY recorded DESC
		LIMIT 1
	`);

	if (!latestEmail)
	{
		return {
			_notice: 'No email was found.',
		};
	}

	return {
		recorded: dateUtils.formatDateTime(latestEmail.recorded),
		from: latestEmail.from_email,
		subject: latestEmail.subject,
		body: latestEmail.body,
	};
}
