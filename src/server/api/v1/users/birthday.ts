import * as db from '@db';
import * as accounts from '@accounts';
import { dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { APIThisType, BirthdayType } from '@types';

/*
 * Get user's birthday / age, if allowed.
 * return type: birthday (string or null) and age (string or null)
 */
async function birthday(this: APIThisType, {id}: birthdayProps) : Promise<BirthdayType>
{
	const permission:boolean = await this.query('v1/permission', {permission: 'view-profiles'});

	if (!permission)
	{
		throw new UserError('permission');
	}

	const [profileInfo] = await db.query(`
		SELECT
			show_birthday,
			show_age
		FROM users
		WHERE id = $1::int
	`, id);

	let birthDate = null;

	if (profileInfo.show_birthday || profileInfo.show_age)
	{
		birthDate = await accounts.getBirthDate(id);
	}

	return <BirthdayType>{
		birthday: profileInfo.show_birthday && birthDate != null ? (profileInfo.show_age ? dateUtils.formatDate(birthDate) : dateUtils.formatDateWithoutYear(birthDate)) : null,
		age: profileInfo.show_age && birthDate != null ? dateUtils.getAge(birthDate) : null,
	};
}

birthday.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
}

type birthdayProps = {
	id: number
}

export default birthday;