import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';
import { UserError } from '@errors';
import * as db from '@db';
import { dateUtils } from '@utils';

async function age({id})
{
	if (this.userId)
	{
		throw new UserError('permission');
	}

	const [user] = await db.query(`
		SELECT user_id
		FROM consent_log
		WHERE guid = $1
	`, id);

	if (!user)
	{
		throw new UserError('bad-format');
	}

	const birthdate = await accounts.getBirthDate(user.user_id);

	return dateUtils.getAge(birthdate);
}

age.apiTypes = {
	id: {
		type: APITypes.uuid,
		required: true,
	},
}

export default age;