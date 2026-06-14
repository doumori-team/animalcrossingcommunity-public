import { UserError } from '@errors';
import { constants } from '@utils';
import * as accounts from '@accounts';
import { APIThisType, SuccessType } from '@types';

async function reset_password(this: APIThisType): Promise<SuccessType>
{
	// only allow test accounts on test site
	if (!constants.LIVE_SITE)
	{
		if (!constants.testAccounts.includes(this.userId as number))
		{
			throw new UserError('live-reset-password');
		}
	}

	const link = await accounts.resetPassword(this.userId as number);

	return {
		_redirect: link,
	};
}

reset_password.permissions = [
	'userId',
];

export default reset_password;
