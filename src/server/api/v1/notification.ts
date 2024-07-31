import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils, constants, utils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, NotificationType } from '@types';

async function notification(this: APIThisType, {id}: notificationProps) : Promise<NotificationType|null>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [notification] = await db.query(`
		SELECT
			notification.id,
			notification.user_id,
			notification.reference_id,
			notification.child_reference_id,
			notification.created,
			notification.notified,
			notification_type.identifier,
			notification.description
		FROM notification
		JOIN notification_type ON (notification_type.id = notification.reference_type_id)
		WHERE notification.id = $1::int
	`, id);

	if (!notification)
	{
		throw new UserError('no-such-notification');
	}

	if (notification.user_id !== this.userId)
	{
		throw new UserError('permission');
	}

	const type:string = notification.identifier;

	// it's possible the user no longer has access to where the notification leads to
	let permission = true;

	if ([
			constants.notification.types.PT,
			constants.notification.types.FT,
			constants.notification.types.FB,
			constants.notification.types.usernameTag,
			constants.notification.types.scoutAdoption,
			constants.notification.types.scoutThread,
			constants.notification.types.scoutClosed,
			constants.notification.types.scoutFeedback,
			constants.notification.types.scoutBT
		].includes(type)
	)
	{
		permission = await this.query('v1/node/permission', {permission: 'read', nodeId: notification.reference_id});
	}
	else if (
		[
			constants.notification.types.modminUT,
			constants.notification.types.modminUTMany,
			constants.notification.types.modminUTDiscussion,
			constants.notification.types.supportEmail
		].includes(type)
	)
	{
		permission = await this.query('v1/permission', {permission: 'process-user-tickets'});
	}
	else if (type === constants.notification.types.modminUTPost)
	{
		const [userTicket] = await db.query(`
			SELECT
				user_ticket.violator_id
			FROM user_ticket
			WHERE user_ticket.id = $1::int
		`, notification.reference_id);

		permission = userTicket.violator_id === this.userId;

		if (!permission)
		{
			permission = await this.query('v1/permission', {permission: 'process-user-tickets'});
		}
	}
	else if (type === constants.notification.types.supportTicket)
	{
		const [supportTicket] = await db.query(`
			SELECT
				support_ticket.user_id
			FROM support_ticket
			WHERE support_ticket.id = $1::int
		`, notification.reference_id);

		permission = supportTicket.user_id === this.userId;

		if (!permission)
		{
			permission = await this.query('v1/permission', {permission: 'process-user-tickets'});
		}
	}

	if (!permission)
	{
		await db.query(`
			DELETE FROM notification
			WHERE id = $1::int
		`, id);

		return null;
	}

	let notified:string = notification.notified;

	if (notified === null)
	{
		const [updatedNotification] = await db.query(`
			UPDATE notification
			SET notified = COALESCE(notified, now())
			WHERE notification.id = $1::int
			RETURNING notified
		`, id);

		// race condition; if a user has another tab, they view (delete) the
		// notification just as another tab grabs this, it would be gone.
		if (!updatedNotification)
		{
			return null;
		}

		notified = updatedNotification.notified;
	}

	// see v1/notification/create.js
	let userCheck = false;

	if (notification.identifier === constants.notification.types.modminUTPost)
	{
		userCheck = await this.query('v1/permission', {permission: 'process-user-tickets'});
	}

	let extra:any = {
		post: null,
	};

	if (
		[
			constants.notification.types.PT,
			constants.notification.types.FT,
			constants.notification.types.usernameTag,
			constants.notification.types.shopThread
		].includes(notification.identifier)
	)
	{
		let children = [], nodeUser = null, parentId:number = notification.reference_id, post:number|null = notification.reference_id;

		if (constants.notification.types.usernameTag === notification.identifier)
		{
			const [parent] = await db.query(`
				SELECT node.parent_node_id AS id
				FROM node
				WHERE node.id = $1
			`, notification.reference_id);

			children = await db.query(`
				SELECT node.id, node.creation_time
				FROM node
				WHERE node.parent_node_id = $1
				ORDER BY creation_time ASC
			`, parent.id);

			parentId = parent.id;
		}
		else
		{
			[nodeUser] = await db.query(`
				SELECT last_checked
				FROM node_user
				WHERE node_id = $1 AND user_id = $2
			`, notification.reference_id, this.userId);

			if (nodeUser)
			{
				children = await db.query(`
					SELECT node.id, node.creation_time
					FROM node
					WHERE node.parent_node_id = $1
					ORDER BY creation_time ASC
				`, notification.reference_id);
			}

			post = null;
		}

		let page = 1, index = 0;

		for (let child of children)
		{
			if (index % constants.threadPageSize === 0 && index != 0)
			{
				page++;
			}

			if (constants.notification.types.usernameTag === notification.identifier)
			{
				if (child.id === notification.reference_id)
				{
					break;
				}
			}
			else
			{
				if (dateUtils.isAfter(child.creation_time, nodeUser.last_checked))
				{
					post = child.id;
					break;
				}
			}

			index++;
		}

		extra = {
			parentId: parentId,
			page: page,
			post: post,
		};
	}

	return <NotificationType>{
		id: notification.id,
		description: notification.description,
		url: utils.getNotificationReferenceLink(notification, userCheck, this.userId, extra),
		formattedCreated: dateUtils.formatDateTime(notification.created),
		formattedNotified: dateUtils.formatDateTime(notified),
		anchor: extra.post,
	};
}

notification.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

type notificationProps = {
	id: number
}

export default notification;