import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';
import { UserError } from '@errors';
import * as db from '@db';
import { dateUtils } from '@utils';

async function consent_denied({id})
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

	const age = dateUtils.getAge(birthdate);

	if (age >= 16)
	{
		throw new UserError('bad-format');
	}

	await accounts.deleteUser(user.user_id);

	await db.query(`
		INSERT INTO consent_log (user_id, action_id)
		VALUES ($1::int, 3)
	`, user.user_id);

	return {
		_success: "Your child's account has been deactivated."
	};
}

consent_denied.apiTypes = {
	id: {
		type: APITypes.string,
		required: true,
	},
}

export default consent_denied;