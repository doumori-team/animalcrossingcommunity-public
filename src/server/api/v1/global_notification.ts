import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils, utils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, NotificationType } from '@types';

async function global_notification(this: APIThisType, { id }: globalNotificationProps): Promise<NotificationType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [notification] = await db.query(`
		SELECT
			global_notification.id,
			global_notification.reference_id,
			global_notification.created,
			user_global_notification.notified,
			notification_type.identifier,
			global_notification.description
		FROM global_notification
		JOIN notification_type ON (notification_type.id = global_notification.reference_type_id)
		LEFT JOIN user_global_notification ON (user_global_notification.global_notification_id = global_notification.id AND user_global_notification.user_id = $2::int)
		WHERE global_notification.id = $1::int
	`, id, this.userId);

	if (notification)
	{
		let notified: string = notification.notified;

		if (notified === null)
		{
			const [userNotification] = await db.query(`
				INSERT INTO user_global_notification (user_id, global_notification_id)
				VALUES ($1::int, $2::int)
				ON CONFLICT ON CONSTRAINT user_global_notification_user_id_global_notification_id_key DO UPDATE SET notified = now()
				RETURNING notified
			`, this.userId, notification.id);

			notified = userNotification.notified;
		}

		return <NotificationType>{
			id: notification.id,
			description: notification.description,
			url: utils.getGlobalNotificationReferenceLink(notification),
			formattedCreated: dateUtils.formatDateTime(notification.created),
			formattedNotified: dateUtils.formatDateTime(notified),
		};
	}

	throw new UserError('no-such-notification');
}

global_notification.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type globalNotificationProps = {
	id: number
};

export default global_notification;
