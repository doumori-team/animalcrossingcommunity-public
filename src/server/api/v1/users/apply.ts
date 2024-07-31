import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

/*
 * Apply for or nominate someone for staff position.
 */
async function apply(this: APIThisType, {groupId, text, format, username}: applyProps) : Promise<SuccessType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'apply-nominate-staff'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check params (non-node-create only)
	const [staffGroup] = await db.query(`
		SELECT identifier
		FROM user_group
		WHERE id = $1::int
	`, groupId);

	if (!staffGroup)
	{
		throw new UserError('bad-format');
	}

	const staffIdentifiers = constants.staffIdentifiers;

	if ([staffIdentifiers.mod, staffIdentifiers.scout].includes(staffGroup.identifier) &&
		utils.realStringLength(username) === 0
	)
	{
		throw new UserError('bad-format');
	}

	if (utils.realStringLength(username) > 0)
	{
		const [check] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE LOWER(username) = LOWER($1)
		`, username);

		if (!check)
		{
			throw new UserError('no-such-user');
		}

		if ([staffIdentifiers.mod, staffIdentifiers.scout].includes(staffGroup.identifier) &&
			check.id === this.userId)
		{
			throw new UserError('bad-nomination');
		}
	}

	// Perform query
	let title;

	switch (staffGroup.identifier)
	{
		case staffIdentifiers.mod:
			title = `Moderator Nomination - ${username}`;
			break;

		case staffIdentifiers.researcher:
			title = 'Researcher Application';
			break;

		case staffIdentifiers.dev:
			title = 'Developer Application';
			break;

		case staffIdentifiers.scout:
			title = `Scout Nomination - ${username}`;
			break;
	}

	await this.query('v1/node/create', {parentId: constants.boardIds.userSubmissions, title: title, text: text, format: format});

	return {
		_success: `Your nomination / application has been submitted.`
	};
}

apply.apiTypes = {
	groupId: {
		type: APITypes.number,
		required: true,
	},
	// text & format confirmed in node/create
	username: {
		type: APITypes.string,
		default: '',
	},
}

type applyProps = {
	groupId: number
	username: string
	text: any
	format: any
}

export default apply;