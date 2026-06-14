import * as db from '@db';
import * as accounts from '@accounts';
import { APIThisType, AccountSettingType } from '@types';

async function account(this: APIThisType): Promise<AccountSettingType>
{
	const userData = await accounts.getUserData(this.userId);

	const [[user], shopDNC] = await Promise.all([
		db.query(`
			SELECT
				show_birthday,
				show_age,
				show_email,
				email_notifications,
				show_staff,
				southern_hemisphere,
				stay_forever,
				consolidate_calendars,
				dock_menu
			FROM users
			WHERE users.id = $1::int
		`, this.userId),
		db.query(`
			SELECT
				user_id
			FROM shop_dnc
			WHERE user_id = $1::int
		`, this.userId),
	]);

	return <AccountSettingType>{
		email: userData.email,
		showBirthday: user.show_birthday,
		showAge: user.show_age,
		showEmail: user.show_email,
		emailNotifications: user.email_notifications,
		showStaff: user.show_staff,
		shopDNC: shopDNC.length > 0,
		southernHemisphere: user.southern_hemisphere,
		stayForever: user.stay_forever,
		consolidateCalendars: user.consolidate_calendars,
		dockMenu: user.dock_menu,
	};
}

account.permissions = [
	'userId',
];

export default account;
