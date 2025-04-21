import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import * as accounts from '@accounts';
import * as APITypes from '@apiTypes';
import * as db from '@db';
import { APIThisType, SuccessType } from '@types';

async function view_information(this: APIThisType, { id }: viewInformationProps): Promise<SuccessType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'process-user-tickets' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// only allow test accounts on test site
	if (!constants.LIVE_SITE)
	{
		if (!constants.testAccounts.includes(id))
		{
			throw new UserError('live-view-birthday');
		}
	}

	const [birthDate, userData] = await Promise.all([
		accounts.getBirthDate(id),
		accounts.getUserData(id),
		db.query(`
			INSERT INTO audit_log (user_id, description) VALUES
			($1, 'Getting birthday, email for User #${id}')
		`, this.userId),
	]);

	return {
		_notice: `Birthday: ${dateUtils.formatDate(birthDate)} ; Email: ${userData.email}`,
	};
}

view_information.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
};

type viewInformationProps = {
	id: number
};

export default view_information;
