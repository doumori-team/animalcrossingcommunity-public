import * as accounts from '@accounts';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';

async function username_history({id})
{
	const [viewProfilesPerm, processSupportTickets] = await Promise.all([
		this.query('v1/permission', {permission: 'view-profiles'}),
		this.query('v1/permission', {permission: 'process-support-tickets'}),
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
	},
}

export default username_history;