import { UserError } from '@errors';
import { constants } from '@utils';
import * as accounts from '@accounts';
import * as APITypes from '@apiTypes';
import { APIThisType, NoticeType } from '@types';

async function reset_password(this: APIThisType, { id }: resetPasswordProps): Promise<NoticeType>
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
			throw new UserError('live-reset-password');
		}
	}

	const link = await accounts.resetPassword(id);

	return {
		_notice: `Password Reset Link: ${link} (send this to the user; expires in 24 hours)`,
	};
}

reset_password.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
};

type resetPasswordProps = {
	id: number
};

export default reset_password;
