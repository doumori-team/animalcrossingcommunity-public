import * as db from '@db';
import { dateUtils } from '@utils';
import { APIThisType, NotificationType, LatestNotificationType } from '@types';

/*
 * Get count of current notifications, latest notification
 */
export default async function latest(this: APIThisType): Promise<LatestNotificationType>
{
	if (!this.userId)
	{
		return {
			notification: null,
			totalCount: 0,
		};
	}

	try
	{
		await this.query('v1/user_lite', { id: this.userId });
	}
	catch
	{
		return {
			notification: null,
			totalCount: 0,
		};
	}

	// Perform queries
	let notification: NotificationType | null = null, totalCount = 0, permNotification = {};

	// v1/notification does perm check, so if it comes back null, try again
	do
	{
		permNotification = {};

		const [[userCount], [userNotification], [globalCount], [globalNotification]] = await Promise.all([
			db.query(`
				SELECT count(*) AS count
				FROM notification
				WHERE notification.user_id = $1::int
			`, this.userId),
			db.query(`
				SELECT notification.id, notification.created
				FROM notification
				WHERE notification.user_id = $1::int AND notification.notified IS NULL
				ORDER BY notification.id ASC
				LIMIT 1
			`, this.userId),
			db.query(`
				SELECT count(*) AS count
				FROM global_notification
				LEFT JOIN user_global_notification ON (global_notification.id = user_global_notification.global_notification_id AND user_global_notification.user_id = $1::int)
				JOIN user_account_cache ON (user_account_cache.id = $1::int)
				WHERE (user_global_notification IS NULL OR user_global_notification.read IS NULL) AND user_account_cache.signup_date < global_notification.created
			`, this.userId),
			db.query(`
				SELECT global_notification.id, global_notification.created
				FROM global_notification
				LEFT JOIN user_global_notification ON (global_notification.id = user_global_notification.global_notification_id AND user_global_notification.user_id = $1::int)
				JOIN user_account_cache ON (user_account_cache.id = $1::int)
				WHERE (user_global_notification IS NULL OR user_global_notification.notified IS NULL) AND user_account_cache.signup_date < global_notification.created
				ORDER BY global_notification.id ASC
				LIMIT 1
			`, this.userId),
		]);

		totalCount = Number(userCount.count) + Number(globalCount.count);

		// if global notification created after user notification
		if (globalNotification && (
			userNotification && dateUtils.isAfterTimezone(globalNotification.created, dateUtils.dateToTimezone(userNotification.created)) ||
			!userNotification)
		)
		{
			notification = permNotification = await this.query('v1/global_notification', { id: globalNotification.id });
		}
		else if (userNotification)
		{
			notification = permNotification = await this.query('v1/notification', { id: userNotification.id });
		}
	} while (totalCount > 0 && permNotification === null);

	return <LatestNotificationType>{
		notification: notification,
		totalCount: totalCount,
	};
}
