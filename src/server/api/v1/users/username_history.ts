import * as accounts from '@accounts';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { APIThisType, AccountUserType } from '@types';

async function username_history(this: APIThisType, { id }: usernameHistoryProps): Promise<AccountUserType['username_history']>
{
	const [viewProfilesPerm, processSupportTickets] = await Promise.all([
		this.query('v1/permission', { permission: 'view-profiles' }),
		this.query('v1/permission', { permission: 'process-support-tickets' }),
	]);

	if (!viewProfilesPerm && !processSupportTickets && id !== this.userId)
	{
		throw new UserError('permission');
	}

	const userData = await accounts.getUserData(id);

	return userData.username_history;
}

username_history.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
};

type usernameHistoryProps = {
	id: number
};

export default username_history;
