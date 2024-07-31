import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, UserNotificationsType } from '@types';

async function notifications(this: APIThisType, {page, sortBy}: notificationsProps) : Promise<UserNotificationsType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	await this.query('v1/user_lite', {id: this.userId});

	// Perform queries
	const pageSize = 25;
	const offset = (page * pageSize) - pageSize;

	let query = `
		SELECT notification.id
		FROM notification
		JOIN notification_type ON (notification_type.id = notification.reference_type_id)
		WHERE notification.user_id = $1::int
	`;

	if (sortBy === 'category')
	{
		query += `
			ORDER BY notification_type.identifier ASC
		`;
	}
	else
	{
		query += `
			ORDER BY notification.created ASC
		`;
	}

	const [notifications, globalNotifications] = await Promise.all([
		db.query(query, this.userId),
		db.query(`
			SELECT
				global_notification.id,
				count(*) over() AS count
			FROM global_notification
			LEFT JOIN user_global_notification ON (global_notification.id = user_global_notification.global_notification_id AND user_global_notification.user_id = $1::int)
			JOIN user_account_cache ON (user_account_cache.id = $1::int)
			WHERE (user_global_notification IS NULL OR user_global_notification.read IS NULL) AND user_account_cache.signup_date < global_notification.created
			ORDER BY global_notification.created ASC
			LIMIT $2::int OFFSET $3::int
		`, this.userId, pageSize, offset),
	]);

	const [results, globalResults] = await Promise.all([
		Promise.all(notifications.map(async(notification:any) => {
			return await this.query('v1/notification', {id: notification.id});
		})),
		Promise.all(globalNotifications.map(async(notification:any) => {
			return await this.query('v1/global_notification', {id: notification.id});
		})),
	]);

	return <UserNotificationsType>{
		userNotifications: results.filter(notification => notification !== null).slice(offset, offset+pageSize),
		globalNotifications: globalResults,
		page: page,
		pageSize: pageSize,
		userTotalCount: Number(results.length),
		globalTotalCount: globalNotifications.length > 0 ? Number(globalNotifications[0].count) : 0,
	};
}

notifications.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	sortBy: {
		type: APITypes.string,
		includes: ['category', 'notified'],
		default: 'notified',
	},
}

type notificationsProps = {
	page: number
	sortBy: 'category' | 'notified'
}

export default notifications;