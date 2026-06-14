import * as db from '@db';
import * as APITypes from '@apiTypes';
import { APIThisType, UserNotificationsType, NotificationType } from '@types';

async function notifications(this: APIThisType, { page, sortBy }: notificationsProps): Promise<UserNotificationsType>
{
	// Perform queries
	const pageSize = 25;
	const offset = page * pageSize - pageSize;

	let query = `
		SELECT notification.id, count(*) over() AS count
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

	query += `
		LIMIT $2::int OFFSET $3::int
	`;

	// users may not have access to the notification item anymore after receiving it
	// we can't do the permission checks in sql because it could be for different things (see v1/notification)
	// so we get notifications in chunks to figure out which to show
	// this shouldn't really happen much, this is just to prevent weird occurrances
	// most times will only have do/while loop executed once
	let notificationOffset = page * pageSize - pageSize;
	let userNotifications: NotificationType[] = [];
	let notifications: { id: number, count: number }[] = [];
	let breakpoint = 10, index = 0;

	do
	{
		notifications = await db.query(query, this.userId, pageSize, notificationOffset);

		const results: (NotificationType | null)[] = await Promise.all(notifications.map(async notification =>
		{
			return await this.query('v1/notification', { id: notification.id });
		}));

		userNotifications = userNotifications.concat(results.filter(notification => notification !== null).slice(0, pageSize - userNotifications.length));

		notificationOffset += pageSize;
		index++;

		// and this is to prevent if someone has like millions of notifications and lots they can't access
		// to prevent it from just looping forever; highly unlikely but trying to prevent server from crashing
		if (index >= breakpoint)
		{
			console.error('ERROR: User has hit max amount of loops for getting notifications.');
			break;
		}
	} while (notifications.length === pageSize && userNotifications.length < pageSize);

	const globalNotifications: { id: number, count: number }[] = await db.query(`
		SELECT
			global_notification.id,
			count(*) over() AS count
		FROM global_notification
		LEFT JOIN user_global_notification ON (global_notification.id = user_global_notification.global_notification_id AND user_global_notification.user_id = $1::int)
		JOIN user_account_cache ON (user_account_cache.id = $1::int)
		WHERE (user_global_notification IS NULL OR user_global_notification.read IS NULL) AND user_account_cache.signup_date < global_notification.created
		ORDER BY global_notification.created ASC
		LIMIT $2::int OFFSET $3::int
	`, this.userId, pageSize, offset);

	const globalResults = await Promise.all(globalNotifications.map(async notification =>
	{
		return await this.query('v1/global_notification', { id: notification.id });
	}));

	return <UserNotificationsType>{
		userNotifications: userNotifications,
		globalNotifications: globalResults,
		page: page,
		pageSize: pageSize,
		userTotalCount: notifications.length > 0 ? Number(notifications[0].count) : 0,
		globalTotalCount: globalNotifications.length > 0 ? Number(globalNotifications[0].count) : 0,
	};
}

notifications.permissions = [
	'userId',
];

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
};

type notificationsProps = {
	page: number
	sortBy: 'category' | 'notified'
};

export default notifications;
