import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';

async function waitlist({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-shops'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	const application = await this.query('v1/shop/thread', {id: id, category: constants.shops.categories.applications});

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
}

export default waitlist;