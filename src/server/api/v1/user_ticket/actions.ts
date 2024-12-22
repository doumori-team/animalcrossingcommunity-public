import * as db from '@db';
import { UserError } from '@errors';
import { APIThisType, UserTicketActionType } from '@types';

export default async function actions(this: APIThisType): Promise<UserTicketActionType[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'process-user-tickets' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const actions = await db.query(`
		SELECT
			id,
			identifier,
			name
		FROM user_ticket_action
		ORDER BY id ASC
	`);

	return await Promise.all(actions.map(async (action: any) =>
	{
		return {
			id: action.id,
			identifier: action.identifier,
			name: action.name,
			types: (await db.query(`
				SELECT user_ticket_type.identifier
				FROM user_ticket_type
				JOIN user_ticket_action_type ON (user_ticket_action_type.type_id = user_ticket_type.id)
				WHERE user_ticket_action_type.action_id = $1::int
				ORDER BY user_ticket_type.id ASC
			`, action.id)).map((type: any) => type.identifier),
		};
	}));
}
