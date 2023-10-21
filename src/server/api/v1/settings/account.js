import * as db from '@db';
import { UserError } from '@errors';
import * as accounts from '@accounts';

export default async function account()
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const userData = await accounts.getUserData(this.userId);

	const [user] = await db.query(`
		SELECT
			show_birthday,
			show_age,
			show_email,
			email_notifications
		FROM users
		WHERE users.id = $1::int
	`, this.userId);

	return {
		email: userData.email,
		showBirthday: user.show_birthday,
		showAge: user.show_age,
		showEmail: user.show_email,
		emailNotifications: user.email_notifications,
	};
}