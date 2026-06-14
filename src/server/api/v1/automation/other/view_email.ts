import * as db from '@db';
import { dateUtils } from '@utils';
import { APIThisType, ViewEmailType, SuccessType } from '@types';

async function view_email(this: APIThisType): Promise<ViewEmailType | SuccessType>
{
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

view_email.permissions = [
	'TEST_SITE',
];

export default view_email;
