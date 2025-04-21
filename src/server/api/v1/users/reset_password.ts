import { UserError } from '@errors';
import { constants } from '@utils';
import * as accounts from '@accounts';
import { APIThisType, SuccessType } from '@types';

export default async function reset_password(this: APIThisType): Promise<SuccessType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// only allow test accounts on test site
	if (!constants.LIVE_SITE)
	{
		if (!constants.testAccounts.includes(this.userId))
		{
			throw new UserError('live-reset-password');
		}
	}

	const link = await accounts.resetPassword(this.userId);

	return {
		_redirect: link,
	};
}
