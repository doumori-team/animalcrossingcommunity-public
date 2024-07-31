import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, {id, type}: destroyProps) : Promise<void>
{
	if (!this.userId)
	{
		return;
	}

	// Parameter Validation
	const referenceId = Number(id);

	if (isNaN(referenceId))
	{
		throw new UserError('bad-format');
	}

	let listingTypes = [], notificationType;

	if (type === 'listing')
	{
		listingTypes = (await db.query(`
			SELECT id
			FROM notification_type
			WHERE identifier like 'listing_%'
		`)).map((lt:any) => lt.id);
	}
	else
	{
		[notificationType] = await db.query(`
			SELECT id
			FROM notification_type
			WHERE identifier = $1
		`, type);

		if (!notificationType)
		{
			throw new UserError('bad-format');
		}
	}

	const types = constants.notification.types;

	if (
		[
			types.PT,
			types.FT,
			types.FB,
			types.usernameTag,
			types.scoutAdoption,
			types.scoutThread,
			types.scoutClosed,
			types.scoutFeedback,
			types.scoutBT,
			types.announcement
		].includes(type)
	)
	{
		const [node] = await db.query(`
			SELECT node.id
			FROM node
			WHERE node.id = $1::int
		`, referenceId);

		if (!node)
		{
			throw new UserError('no-such-node');
		}
	}
	else if (
		[
			'listing',
			types.listingFeedback
		].includes(type)
	)
	{
		const [listing] = await db.query(`
			SELECT listing.id
			FROM listing
			WHERE listing.id = $1::int
		`, referenceId);

		if (!listing)
		{
			throw new UserError('no-such-listing');
		}
	}
	else if (
		[
			types.modminUT,
			types.modminUTMany,
			types.modminUTPost,
			types.modminUTDiscussion,
			types.ticketProcessed
		].includes(type)
	)
	{
		const [userTicket] = await db.query(`
			SELECT user_ticket.id
			FROM user_ticket
			WHERE user_ticket.id = $1::int
		`, referenceId);

		if (!userTicket)
		{
			throw new UserError('no-such-user-ticket');
		}
	}
	else if (
		[
			types.supportTicket,
			types.supportTicketProcessed
		].includes(type)
	)
	{
		const [supportTicket] = await db.query(`
			SELECT support_ticket.id
			FROM support_ticket
			WHERE support_ticket.id = $1::int
		`, referenceId);

		if (!supportTicket)
		{
			throw new UserError('no-such-support-ticket');
		}
	}
	else if (
		[
			types.feature,
			types.featurePost,
			types.followFeature
		].includes(type)
	)
	{
		const [feature] = await db.query(`
			SELECT
				feature.id
			FROM feature
			WHERE feature.id = $1::int
		`, referenceId);

		if (!feature)
		{
			throw new UserError('no-such-feature');
		}
	}
	else if (
		[
			types.supportEmail
		].includes(type)
	)
	{
		const [supportEmail] = await db.query(`
			SELECT support_email.id
			FROM support_email
			WHERE support_email.id = $1::int
		`, referenceId);

		if (!supportEmail)
		{
			throw new UserError('no-such-support-email');
		}
	}
	else if (
		[
			types.giftBellShop,
			types.giftDonation,
			types.donationReminder
		].includes(type)
	)
	{
		const [user] = await db.query(`
			SELECT users.id
			FROM users
			WHERE users.id = $1::int
		`, referenceId);

		if (!user || this.userId !== referenceId)
		{
			throw new UserError('no-such-user');
		}
	}
	else if (type === types.shopThread)
	{
		const [node] = await db.query(`
			SELECT node.id
			FROM node
			JOIN shop_node ON (shop_node.node_id = node.id)
			WHERE node.id = $1
		`, referenceId);

		if (!node)
		{
			throw new UserError('no-such-node');
		}
	}
	else if (type === types.shopEmployee)
	{
		const [shop] = await db.query(`
			SELECT id
			FROM shop
			WHERE id = $1
		`, referenceId);

		if (!shop)
		{
			throw new UserError('no-such-shop');
		}
	}
	else if (type === types.shopOrder)
	{
		const [shopOrder] = await db.query(`
			SELECT id
			FROM shop_order
			WHERE id = $1
		`, referenceId);

		if (!shopOrder)
		{
			throw new UserError('no-such-order');
		}
	}
	else if (type === types.shopApplication)
	{
		const [shopApplication] = await db.query(`
			SELECT id
			FROM shop_application
			WHERE id = $1
		`, referenceId);

		if (!shopApplication)
		{
			throw new UserError('no-such-application');
		}
	}
	else
	{
		throw new UserError('bad-format');
	}

	// Perform queries
	if (listingTypes.length > 0)
	{
		await db.query(`
			DELETE FROM notification
			WHERE reference_id = $1::int AND reference_type_id = ANY($2::int[]) AND user_id = $3::int
		`, referenceId, listingTypes, this.userId);
	}
	else if (type === types.announcement)
	{
		const [globalNotification] = await db.query(`
			SELECT id
			FROM global_notification
			WHERE reference_id = $1::int AND reference_type_id = $2::int
		`, referenceId, notificationType.id);

		if (globalNotification)
		{
			await db.query(`
				INSERT INTO user_global_notification (user_id, global_notification_id, read)
				VALUES ($1::int, $2::int, now())
				ON CONFLICT ON CONSTRAINT user_global_notification_user_id_global_notification_id_key DO UPDATE SET read = now()
			`, this.userId, globalNotification.id);
		}
	}
	else if (type === types.usernameTag)
	{
		await db.query(`
			DELETE FROM notification
			WHERE id IN (
				SELECT notification.id
				FROM notification
				JOIN node ON (node.id = notification.reference_id)
				WHERE node.parent_node_id = $1::int AND notification.reference_type_id = $2::int AND notification.user_id = $3::int
			)
		`, referenceId, notificationType.id, this.userId);
	}
	else
	{
		if (
			[
				types.modminUT,
				types.modminUTMany,
				types.supportEmail
			].includes(type)
		)
		{
			await db.query(`
				DELETE FROM notification
				WHERE reference_id = $1::int AND reference_type_id = $2::int
			`, referenceId, notificationType.id);
		}
		else if (
			[
				types.giftBellShop,
				types.giftDonation
			].includes(type)
		)
		{
			await db.query(`
				DELETE FROM notification
				WHERE reference_type_id = $1::int AND user_id = $2::int
			`, notificationType.id, this.userId);
		}
		else
		{
			await db.query(`
				DELETE FROM notification
				WHERE reference_id = $1::int AND reference_type_id = $2::int AND user_id = $3::int
			`, referenceId, notificationType.id, this.userId);
		}
	}
}

destroy.apiTypes = {
	// id not checked on purpose
	type: {
		type: APITypes.string,
		default: '',
		required: true,
	},
}

type destroyProps = {
	id: any
	type: string
}

export default destroy;