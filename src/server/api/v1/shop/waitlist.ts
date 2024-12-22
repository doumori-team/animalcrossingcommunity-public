import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, ThreadApplicationType } from '@types';

async function waitlist(this: APIThisType, { id }: waitlistProps): Promise<void>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-shops' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	await this.query('v1/user_lite', { id: this.userId });

	const application: ThreadApplicationType = await this.query('v1/shop/thread', { id: id, category: constants.shops.categories.applications });

	if (!application.contact)
	{
		throw new UserError('permission');
	}

	await db.query(`
		UPDATE shop_application
		SET waitlisted = true
		WHERE id = $1
	`, id);
}

waitlist.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type waitlistProps = {
	id: number
};

export default waitlist;
