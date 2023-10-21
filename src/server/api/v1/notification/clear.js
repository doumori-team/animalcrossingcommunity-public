import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function clear({notificationIds})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	notificationIds = await Promise.all(notificationIds.map(async (id) =>
	{
		const [notification] = await db.query(`
			SELECT id, user_id
			FROM notification
			WHERE id = $1::int
		`, id);

		if (!notification)
		{
			throw new UserError('no-such-notification');
		}

		if (notification.user_id !== this.userId)
		{
			throw new UserError('no-such-notification');
		}

		return Number(notification.id);
	}));

	if (notificationIds.length === 0)
	{
		return;
	}

	await db.query(`
		DELETE FROM notification
		WHERE user_id = $1::int AND id = ANY($2::int[])
	`, this.userId, notificationIds);
}

clear.apiTypes = {
	notificationIds: {
		type: APITypes.array,
	},
}

export default clear;