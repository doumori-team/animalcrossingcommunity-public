import webpush from 'web-push';

import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';
import { APIThisType, UserType, ListingType, NodeType } from '@types';
import { sendNotificationToUser, getAllConnectedUserIds } from 'server/notificationService.ts';

webpush.setVapidDetails(
	'mailto:admin@animalcrossingcommunity.com',
	process.env.VAPID_PUBLIC_KEY as string,
	process.env.VAPID_PRIVATE_KEY as string,
);

async function create(this: APIThisType, { id, type }: createProps): Promise<void>
{
	const referenceId = id;

	const [notificationType] = await db.query(`
		SELECT id
		FROM notification_type
		WHERE identifier = $1
	`, type);

	if (!notificationType)
	{
		throw new UserError('bad-format');
	}

	const user: UserType = await this.query('v1/user', { id: this.userId });

	const types = constants.notification.types;
	let userIds: number[] = [];
	let useReferenceId = referenceId;
	let description = '';
	let multiDescription = '';
	let childReferenceId: number | null = null;

	// Note: final access is checked in v1/notification

	if (
		[
			types.PT,
			types.FT,
			types.FT_edit,
			types.FB,
			types.usernameTag,
			types.announcement,
			types.postQuote,
			types.postReaction,
		].includes(type)
	)
	{
		let nodeId = referenceId, childNode: {
			parent_node_id: NonNullable<NodeType['parentId']>
			user_id: NonNullable<NodeType['user']>['id']
			title?: NodeType['title'] | null
		} | null = null;

		if (type === types.PT)
		{
			[childNode] = await db.query(`
				SELECT
					node.parent_node_id,
					node.user_id
				FROM node
				WHERE node.id = $1::int
			`, referenceId);

			if (!childNode)
			{
				throw new UserError('no-such-node');
			}

			nodeId = childNode.parent_node_id;
			useReferenceId = nodeId;
		}
		else if ([types.FT, types.FT_edit, types.FB].includes(type))
		{
			[childNode] = await db.query(`
				SELECT
					node.parent_node_id,
					node.user_id,
					(
						SELECT title
						FROM node_revision
						WHERE node_revision.node_id = node.id
						ORDER BY time DESC
						LIMIT 1
					) AS title
				FROM node
				WHERE node.id = $1::int
			`, referenceId);

			if (!childNode)
			{
				throw new UserError('no-such-node');
			}

			nodeId = childNode.parent_node_id;
			useReferenceId = nodeId;

			if (type === types.FB)
			{
				childReferenceId = referenceId;
			}
			else if (type === types.FT_edit)
			{
				childReferenceId = referenceId;
			}
		}

		const [node]: [{
			content: NonNullable<NodeType['content']>['text']
			parent_node_id: NodeType['parentId']
			title: NodeType['title']
			node_revision_id: number
			user_id: number | null
		}] = await db.query(`
			SELECT
				last_revision.content,
				node.parent_node_id,
				last_revision.title,
				last_revision.id AS node_revision_id,
				node.user_id
			FROM node
			LEFT JOIN LATERAL (
				SELECT title, content, id
				FROM node_revision
				WHERE node_revision.node_id = node.id
				ORDER BY time DESC
				LIMIT 1
			) last_revision ON true
			WHERE node.id = $1::int
		`, nodeId);

		if (!node)
		{
			throw new UserError('no-such-node');
		}

		if (type === types.PT)
		{
			description = `${user.username} has posted on PT '${node.title}'`;
			multiDescription = `There are %count% new posts on PT '${node.title}'`;

			userIds = (await db.query(`
				SELECT user_id
				FROM user_node_permission
				WHERE node_id = $1::int AND node_permission_id = $2::int AND granted = true
			`, nodeId, constants.nodePermissions.read))
				.filter((u: { user_id: number }) => u.user_id !== childNode!.user_id)
				.map((u: { user_id: number }) => u.user_id);
		}
		else if ([types.FT, types.FT_edit, types.FB].includes(type))
		{
			if (type === types.FT || type === types.FT_edit)
			{
				if (type === types.FT_edit)
				{
					description = `${user.username} has edited a post on thread '${node.title}'`;
					multiDescription = `There are %count% edited posts on thread '${node.title}'`;
				}
				else
				{
					description = `${user.username} has posted on thread '${node.title}'`;
					multiDescription = `There are %count% new posts on thread '${node.title}'`;
				}
			}
			else if (type === types.FB)
			{
				description = `${user.username} has created '${childNode!.title}' on board '${node.title}'`;
				multiDescription = `There are %count% new threads on board '${node.title}'`;
			}

			let favoritedUsers = await db.query(`
				SELECT user_id
				FROM notified_node
				WHERE node_id = $1::int
			`, nodeId);

			// also get parent board of board
			// ex. flagged AC Trading, made a thread on GC Trading
			// get users who flagged GC Trading AND AC Trading
			if (type === types.FB)
			{
				const [parentNode] = await db.query(`
					SELECT
						parent.id,
						parent.type
					FROM node
					JOIN node AS parent ON (parent.id = node.parent_node_id)
					WHERE node.id = $1::int
				`, nodeId);

				if (parentNode.type === 'board' && parentNode.id !== constants.boardIds.accForums)
				{
					favoritedUsers = favoritedUsers.concat(await db.query(`
						SELECT user_id
						FROM notified_node
						WHERE node_id = $1::int
					`, parentNode.id));
				}
			}

			if (favoritedUsers.length > 0)
			{
				userIds = favoritedUsers
					.filter((u: { user_id: number }) => u.user_id !== childNode!.user_id)
					.map((u: { user_id: number }) => u.user_id);
			}
		}
		else if (type === types.usernameTag)
		{
			const rawMatches = [...node.content.matchAll(constants.regexes.userTag3)];

			if (rawMatches.length === 0)
			{
				return;
			}

			const usernames = rawMatches.map(m => m[1]);

			userIds = (await Promise.all(usernames.map(async (username: string) =>
			{
				const [checkId] = await db.query(`
					SELECT id
					FROM user_account_cache
					WHERE LOWER(username) = LOWER($1)
				`, username);

				if (checkId && checkId.id !== this.userId)
				{
					return Number(checkId.id);
				}
			}))).filter(id => id) as number[];

			if (userIds.length === 0)
			{
				return;
			}

			const [parent] = await db.query(`
				SELECT title
				FROM node_revision
				WHERE node_revision.node_id = $1::int
				ORDER BY time DESC
				LIMIT 1
			`, node.parent_node_id);

			description = `${user.username} has tagged you in thread '${parent.title}'`;
		}
		else if (type === types.postQuote)
		{
			const nodeUsers = await db.query(`
				SELECT node.user_id
				FROM node
				JOIN node_revision_quote ON (node.id = node_revision_quote.node_id)
				WHERE node_revision_quote.node_revision_id = $1 AND node.user_id != $2
			`, node.node_revision_id, this.userId);

			if (nodeUsers.length === 0)
			{
				return;
			}

			userIds = nodeUsers.map(nu => nu.user_id);

			const [parent] = await db.query(`
				SELECT title
				FROM node_revision
				WHERE node_revision.node_id = $1::int
				ORDER BY time DESC
				LIMIT 1
			`, node.parent_node_id);

			description = `${user.username} has quoted you in thread '${parent.title}'`;
		}
		else if (type === types.announcement)
		{
			description = `A new announcement has been posted: '${node.title}'`;
		}
		else if (type === types.postReaction)
		{
			description = `${user.username} has reacted to post`;
			multiDescription = `There are %count% new reactions on post`;

			if (node.user_id && this.userId !== node.user_id)
			{
				const [setting] = await db.query(`
					SELECT disable_post_reaction_notifications
					FROM users
					WHERE id = $1
				`, node.user_id);

				if (setting.disable_post_reaction_notifications === true)
				{
					return;
				}

				userIds = [node.user_id];
			}
		}
	}
	else if (
		[
			types.listingCancelled,
			types.listingComment,
			types.listingOffer,
			types.listingOfferAccepted,
			types.listingOfferRejected,
			types.listingOfferCancelled,
			types.listingContact,
			types.listingCompleted,
			types.listingFailed,
			types.listingFeedback,
		].includes(type)
	)
	{
		let listingId = referenceId, listingComment: {
			listing_id: ListingType['id']
			user_id: ListingType['creator']['id']
		} | null;

		if (
			[
				types.listingOfferAccepted,
				types.listingOfferRejected,
			].includes(type)
		)
		{
			const [offer]: [{
				listing_id: ListingType['id']
				user_id: ListingType['creator']['id']
			}] = await db.query(`
				SELECT
					listing_offer.listing_id,
					listing_offer.user_id
				FROM listing_offer
				WHERE listing_offer.id = $1::int
			`, id);

			if (!offer)
			{
				throw new UserError('no-such-offer');
			}

			listingId = offer.listing_id;
			useReferenceId = listingId;

			userIds.push(offer.user_id);

			if (type === types.listingOfferAccepted)
			{
				description = `${user.username} has accepted your offer`;
			}
			else if (type === types.listingOfferRejected)
			{
				description = `${user.username} has rejected your offer`;
			}
		}
		else if (
			[
				types.listingComment,
			].includes(type)
		)
		{
			[listingComment] = await db.query(`
				SELECT
					listing_comment.listing_id,
					listing_comment.user_id
				FROM listing_comment
				WHERE listing_comment.id = $1::int
			`, id);

			if (!listingComment)
			{
				throw new UserError('bad-format');
			}

			listingId = listingComment.listing_id;
			useReferenceId = listingId;
		}

		if (
			![
				types.listingOfferAccepted,
				types.listingOfferRejected,
			].includes(type)
		)
		{
			const listing: ListingType = await this.query('v1/trading_post/listing', { id: listingId });
			const offerStatuses = constants.tradingPost.offerStatuses;

			if (
				[
					types.listingCancelled,
				].includes(type)
			)
			{
				if (listing.offers.accepted)
				{
					userIds.push(listing.offers.accepted.user.id);
				}

				listing.offers.list.map(offer =>
				{
					if ([offerStatuses.pending, offerStatuses.onHold].includes(offer.status))
					{
						userIds.push(offer.user.id);
					}
				});

				if (type === types.listingCancelled)
				{
					description = `${user.username} has cancelled the listing`;
				}
			}
			else if (
				[
					types.listingComment,
				].includes(type)
			)
			{
				if (listingComment!.user_id !== listing.creator.id)
				{
					userIds.push(listing.creator.id);
				}

				if (listing.offers.accepted && listingComment!.user_id !== listing.offers.accepted.user.id)
				{
					userIds.push(listing.offers.accepted.user.id);
				}

				listing.offers.list.map(offer =>
				{
					if (
						listingComment!.user_id !== offer.user.id &&
						[offerStatuses.pending, offerStatuses.onHold].includes(offer.status)
					)
					{
						userIds.push(offer.user.id);
					}
				});

				description = `${user.username} has commented on a trade`;
				multiDescription = `There are %count% new comments on a trade`;
			}
			else if (
				[
					types.listingOffer,
					types.listingOfferCancelled,
				].includes(type)
			)
			{
				userIds.push(listing.creator.id);

				if (type === types.listingOffer)
				{
					description = `${user.username} has submitted an offer on your listing`;
				}
				else if (type === types.listingOfferCancelled)
				{
					description = `${user.username} has cancelled their offer`;
				}
			}
			else if (
				[
					types.listingContact,
					types.listingCompleted,
					types.listingFailed,
					types.listingFeedback,
				].includes(type)
			)
			{
				if (this.userId !== listing.creator.id)
				{
					userIds.push(listing.creator.id);
				}
				else if (listing.offers.accepted !== null)
				{
					userIds.push(listing.offers.accepted.user.id);
				}

				if (type === types.listingContact)
				{
					description = `${user.username} has submitted contact information on a trade`;
				}
				else if (type === types.listingCompleted)
				{
					description = `${user.username} has marked the trade as completed`;
				}
				else if (type === types.listingFailed)
				{
					description = `${user.username} has marked the trade as failed`;
				}
				else if (type === types.listingFeedback)
				{
					description = `${user.username} has given feedback on a trade`;
				}
			}
		}
	}
	else if (
		[
			types.scoutAdoption,
			types.scoutThread,
			types.scoutFeedback,
			types.scoutBT,
		].includes(type)
	)
	{
		let nodeId = referenceId, childNode: {
			parent_node_id: NonNullable<NodeType['parentId']>
			user_id: NonNullable<NodeType['user']>['id']
		} | null;

		if (
			[
				types.scoutThread,
				types.scoutBT,
			].includes(type)
		)
		{
			[childNode] = await db.query(`
				SELECT
					node.parent_node_id,
					node.user_id
				FROM node
				WHERE node.id = $1::int
			`, referenceId);

			if (!childNode)
			{
				throw new UserError('no-such-node');
			}

			nodeId = childNode.parent_node_id;
			useReferenceId = nodeId;

			if (type === types.scoutBT)
			{
				description = `${user.username} has posted on the Adoptee BT`;
				multiDescription = `There are %count% new posts on the Adoptee BT`;

				// only users have user access
				// mods given access in node/permission
				// scouts given access in node/permission AND via group access
				userIds = (await db.query(`
					SELECT user_id
					FROM user_node_permission
					WHERE node_id = $1::int AND node_permission_id = $2::int AND granted = true
				`, nodeId, constants.nodePermissions.read))
					.filter((u: { user_id: number }) => u.user_id !== childNode!.user_id)
					.map((u: { user_id: number }) => u.user_id);

				userIds = userIds.concat(
					(await db.query(`
						SELECT users.id
						FROM user_group
						JOIN users ON (user_group.id = users.user_group_id)
						WHERE user_group.identifier = $1
					`, constants.staffIdentifiers.scout))
						.filter((u: { id: number }) => u.id !== childNode!.user_id)
						.map((u: { id: number }) => u.id),
				);
			}
		}

		if (type !== types.scoutBT)
		{
			const [node] = await db.query(`
				SELECT
					adoption.scout_id,
					adoption.adoptee_id,
					user_account_cache.username AS adoptee
				FROM node
				JOIN adoption ON (adoption.node_id = node.id)
				JOIN user_account_cache ON (user_account_cache.id = adoption.adoptee_id)
				WHERE node.id = $1::int
			`, nodeId);

			if (!node)
			{
				throw new UserError('no-such-node');
			}

			if (
				[
					types.scoutAdoption,
					types.scoutFeedback,
				].includes(type)
			)
			{
				userIds.push(node.scout_id);

				if (type === types.scoutAdoption)
				{
					description = `You've adopted ${node.adoptee}`;
				}
				else if (type === types.scoutFeedback)
				{
					description = `${user.username} has submitted scout feedback`;
				}
			}
			else if (type === types.scoutThread)
			{
				description = `${user.username} has posted on the Adoptee Thread`;

				userIds.push(childNode!.user_id === node.scout_id ? node.adoptee_id : node.scout_id);
			}
		}
	}
	else if (
		[
			types.supportEmail,
			types.donationReminder,
			types.scoutClosed,
			types.listingExpired,
			types.avatarCleared,
		].includes(type)
	)
	{
		// see server/middleware/mail-parse for support emails
		// see scheduler daily for donationReminder, scoutClosed, listingExpired, avatarCleared

		throw new UserError('bad-format');
	}
	else if (
		[
			types.modminUT,
			types.modminUTMany,
			types.modminUTPost,
			types.modminUTDiscussion,
		].includes(type)
	)
	{
		let userTicketId = referenceId, child, notifyAllModmins = false;

		if (type === types.modminUTMany)
		{
			const [userCount] = await db.query(`
				SELECT count(*) AS count
				FROM user_violation
				WHERE user_ticket_id = $1::int
			`, userTicketId);

			if (userCount.count > 5)
			{
				notifyAllModmins = true;
			}
			else
			{
				return;
			}

			description = `5+ people have submitted the same UT`;
		}
		else if (type === types.modminUTPost)
		{
			[child] = await db.query(`
				SELECT
					user_ticket_message.user_ticket_id,
					user_group.identifier,
					user_ticket_message.staff_only
				FROM user_ticket_message
				JOIN users ON (users.id = user_ticket_message.user_id)
				JOIN user_group ON (users.user_group_id = user_group.id)
				WHERE user_ticket_message.id = $1::int
			`, referenceId);

			if (!child)
			{
				throw new UserError('bad-format');
			}

			userTicketId = child.user_ticket_id;
			useReferenceId = userTicketId;

			description = `${user.username} has posted on a UT`;
			multiDescription = `There are %count% new posts on a UT`;
		}

		if (type !== types.modminUTMany)
		{
			const [userTicket] = await db.query(`
				SELECT
					user_ticket.assignee_id,
					user_group.identifier,
					user_ticket_status.name AS status,
					user_ticket.violator_id
				FROM user_ticket
				JOIN user_ticket_status ON (user_ticket_status.id = user_ticket.status_id)
				LEFT JOIN users ON (users.id = user_ticket.assignee_id)
				LEFT JOIN user_group ON (users.user_group_id = user_group.id)
				WHERE user_ticket.id = $1::int
			`, userTicketId);

			if (!userTicket)
			{
				throw new UserError('no-such-user-ticket');
			}

			if (type === types.modminUT)
			{
				userIds = (await db.query(`
					SELECT users.id
					FROM user_group
					JOIN users ON (user_group.id = users.user_group_id)
					WHERE user_group.identifier = $1
				`, constants.staffIdentifiers.mod))
					// sometimes UTs do get created with modmin assigned to them
					// example: modmin is the one who reported the UT
					.filter((u: { id: number }) => u.id !== userTicket.assignee_id)
					.map((u: { id: number }) => u.id);

				description = `${user.username} has submitted a UT`;
			}
			else if (type === types.modminUTPost)
			{
				// if user who posted is not modmin
				if (!
				[
					constants.staffIdentifiers.admin,
					constants.staffIdentifiers.mod,
					constants.staffIdentifiers.owner,
				].includes(child.identifier)
				)
				{
					if (
						[
							constants.staffIdentifiers.mod,
							constants.staffIdentifiers.admin,
							constants.staffIdentifiers.owner,
						].includes(userTicket.identifier)
					)
					{
						userIds.push(userTicket.assignee_id);
					}
					else
					{
						notifyAllModmins = true;
					}
				}
				// if modmin sent back to user
				else if (!child.staff_only && [
					constants.userTicket.statuses.closed,
					constants.userTicket.statuses.inUserDiscussion,
				].includes(userTicket.status))
				{
					userIds.push(userTicket.violator_id);

					description = `You have received a new notification from the staff`;
				}
				// otherwise let all modmins know of new post
				// (it's ok if modmin who posted is notified, notification will instant disappear)
				else
				{
					notifyAllModmins = true;
				}
			}
			else if (type === types.modminUTDiscussion)
			{
				userIds = (await db.query(`
					SELECT users.id
					FROM user_group
					JOIN users ON (user_group.id = users.user_group_id)
					WHERE user_group.identifier = ANY($1)
				`, [constants.staffIdentifiers.mod, constants.staffIdentifiers.admin]))
					.filter((u: { id: number }) => u.id !== userTicket.assignee_id)
					.map((u: { id: number }) => u.id);

				description = `${user.username} has moved a UT to discussion`;
			}
		}

		if (notifyAllModmins)
		{
			userIds = (await db.query(`
				SELECT users.id
				FROM user_group
				JOIN users ON (user_group.id = users.user_group_id)
				WHERE user_group.identifier = ANY($1)
			`, [constants.staffIdentifiers.mod, constants.staffIdentifiers.admin]))
				.map((u: { id: number }) => u.id);
		}
	}
	else if (type === types.ticketProcessed)
	{
		const [userTicket] = await db.query(`
			SELECT
				user_ticket.violator_id
			FROM user_ticket
			WHERE user_ticket.id = $1::int
		`, referenceId);

		if (!userTicket)
		{
			throw new UserError('no-such-user-ticket');
		}

		userIds.push(userTicket.violator_id);

		description = `You have received a new notification from the staff`;
	}
	else if (
		[
			types.supportTicket,
			types.supportTicketProcessed,
		].includes(type)
	)
	{
		let supportTicketId = referenceId, child;

		if (type === types.supportTicket)
		{
			[child] = await db.query(`
				SELECT
					support_ticket_message.support_ticket_id,
					user_group.identifier,
					support_ticket_message.staff_only
				FROM support_ticket_message
				JOIN users ON (users.id = support_ticket_message.user_id)
				JOIN user_group ON (users.user_group_id = user_group.id)
				WHERE support_ticket_message.id = $1::int
			`, referenceId);

			if (!child)
			{
				throw new UserError('bad-format');
			}

			if (child.staff_only)
			{
				return;
			}

			supportTicketId = child.support_ticket_id;
			useReferenceId = supportTicketId;
		}

		const [supportTicket] = await db.query(`
			SELECT support_ticket.user_id
			FROM support_ticket
			WHERE support_ticket.id = $1::int
		`, supportTicketId);

		if (!supportTicket)
		{
			throw new UserError('no-such-support-ticket');
		}

		if (!
		[
			constants.staffIdentifiers.admin,
			constants.staffIdentifiers.mod,
			constants.staffIdentifiers.owner,
		].includes(child ? child.identifier : user.group.identifier)
		)
		{
			description = `${user.username} has posted on a ST`;
			multiDescription = `There are %count% new posts on a ST`;

			userIds = (await db.query(`
				SELECT users.id
				FROM user_group
				JOIN users ON (user_group.id = users.user_group_id)
				WHERE user_group.identifier = ANY($1)
			`, [constants.staffIdentifiers.mod, constants.staffIdentifiers.admin]))
				.map((u: { id: number }) => u.id);
		}
		else
		{
			userIds.push(supportTicket.user_id);

			description = `You have received a new notification from the staff`;
		}
	}
	else if (
		[
			types.feature,
			types.featurePost,
			types.followFeature,
		].includes(type)
	)
	{
		let featureId = referenceId, child;

		if (type === types.featurePost)
		{
			[child] = await db.query(`
				SELECT
					feature_message.feature_id,
					feature_message.user_id,
					feature_message.staff_only
				FROM feature_message
				JOIN users ON (users.id = feature_message.user_id)
				WHERE feature_message.id = $1::int
			`, referenceId);

			if (!child)
			{
				throw new UserError('bad-format');
			}

			featureId = child.feature_id;
			useReferenceId = featureId;
		}

		const [feature] = await db.query(`
			SELECT
				feature.title,
				feature.created_user_id
			FROM feature
			WHERE feature.id = $1::int
		`, featureId);

		if (!feature)
		{
			throw new UserError('no-such-feature');
		}

		if (type === types.feature)
		{
			description = `${user.username} has created feature '${feature.title}'`;

			userIds = (await db.query(`
				SELECT users.id
				FROM user_group
				JOIN users ON (user_group.id = users.user_group_id)
				WHERE user_group.identifier = ANY($1)
			`, [
				constants.staffIdentifiers.admin,
				constants.staffIdentifiers.researcherTL,
				constants.staffIdentifiers.researcher,
				constants.staffIdentifiers.devTL,
				constants.staffIdentifiers.dev,
			]))
				.filter((u: { id: number }) => u.id !== feature.created_user_id)
				.map((u: { id: number }) => u.id);
		}
		else
		{
			if (type === types.featurePost)
			{
				description = `${user.username} has posted on feature '${feature.title}'`;
				multiDescription = `There are %count% new posts on feature '${feature.title}'`;
			}
			else
			{
				description = `${user.username} has updated feature '${feature.title}'`;
			}

			if (child?.staff_only)
			{
				userIds = (await db.query(`
					SELECT users.id
					FROM user_group
					JOIN users ON (user_group.id = users.user_group_id)
					JOIN followed_feature ON (users.id = followed_feature.user_id)
					WHERE user_group.identifier = ANY($1) AND followed_feature.feature_id = $2::int
				`, [
					constants.staffIdentifiers.admin,
					constants.staffIdentifiers.researcherTL,
					constants.staffIdentifiers.researcher,
					constants.staffIdentifiers.devTL,
					constants.staffIdentifiers.dev,
					constants.staffIdentifiers.scout,
					constants.staffIdentifiers.mod,
				], featureId))
					.filter((u: { id: number }) => u.id !== feature.created_user_id)
					.map((u: { id: number }) => u.id);
			}
			else
			{
				userIds = (await db.query(`
					SELECT user_id
					FROM followed_feature
					WHERE feature_id = $1::int
				`, featureId))
					.filter((u: { user_id: number }) => u.user_id !== this.userId)
					.map((u: { user_id: number }) => u.user_id);
			}
		}
	}
	else if (
		[
			types.giftBellShop,
		].includes(type)
	)
	{
		const [userRedeemed] = await db.query(`
			SELECT
				user_bell_shop_redeemed.user_id,
				user_bell_shop_redeemed.redeemed_by
			FROM user_bell_shop_redeemed
			WHERE user_bell_shop_redeemed.id = $1::int
		`, referenceId);

		if (!userRedeemed)
		{
			throw new UserError('bad-format');
		}

		if (!userRedeemed.redeemed_by || userRedeemed.user_id === userRedeemed.redeemed_by)
		{
			return;
		}

		userIds.push(userRedeemed.user_id);

		description = `${user.username} has gifted you an item from the Bell Shop`;
	}
	else if (
		[
			types.giftDonation,
		].includes(type)
	)
	{
		const [userDonation] = await db.query(`
			SELECT
				user_donation.user_id,
				user_donation.donated_by_user_id
			FROM user_donation
			WHERE user_donation.id = $1::int
		`, referenceId);

		if (!userDonation)
		{
			throw new UserError('bad-format');
		}

		if (!userDonation.donated_by_user_id || userDonation.user_id === userDonation.donated_by_user_id)
		{
			return;
		}

		userIds.push(userDonation.user_id);

		description = `${user.username} has donated on your behalf`;
	}
	else if (type === types.shopThread)
	{
		// node = thread = v1/shop/contact or v1/shop/node/create
		// childNode = post = v1/node/create
		const [[node], [childNode]] = await Promise.all([
			db.query(`
				SELECT title
				FROM node_revision
				JOIN shop_node ON (shop_node.node_id = node_revision.node_id)
				WHERE node_revision.node_id = $1::int
				ORDER BY time DESC
				LIMIT 1
			`, referenceId),
			db.query(`
				SELECT
					node.parent_node_id,
					last_revision.title
				FROM node
				JOIN shop_node ON (shop_node.node_id = node.parent_node_id)
				LEFT JOIN LATERAL (
					SELECT title
					FROM node_revision
					WHERE node_revision.node_id = node.parent_node_id
					ORDER BY time DESC
					LIMIT 1
				) last_revision ON true
				WHERE node.id = $1::int
			`, referenceId),
		]);

		if (!(node || childNode))
		{
			throw new UserError('no-such-node');
		}

		if (childNode)
		{
			useReferenceId = childNode.parent_node_id;

			description = `${user.username} has posted on Shop Thread '${childNode.title}'`;
			multiDescription = `There are %count% new posts on Shop Thread '${childNode.title}'`;
		}
		else
		{
			description = `${user.username} has sent you a new Shop Thread: '${node.title}'`;
		}

		userIds = (await db.query(`
			SELECT user_id
			FROM user_node_permission
			WHERE node_id = $1::int AND node_permission_id = $2::int AND granted = true
		`, useReferenceId, constants.nodePermissions.read))
			.filter((u: { user_id: number }) => u.user_id !== this.userId)
			.map((u: { user_id: number }) => u.user_id);
	}
	else if (type === types.shopEmployee)
	{
		const [shopUser] = await db.query(`
			SELECT shop_user.shop_id, shop_user.active, shop.name, shop_user.user_id
			FROM shop_user
			JOIN shop ON (shop.id = shop_user.shop_id)
			WHERE shop_user.id = $1
		`, referenceId);

		if (!shopUser)
		{
			throw new UserError('no-such-shop');
		}

		useReferenceId = shopUser.shop_id;

		if (shopUser.active)
		{
			description = `${user.username} has added you to their Shop '${shopUser.name}'`;
		}
		else
		{
			description = `${user.username} has removed you from their Shop '${shopUser.name}'`;
		}

		userIds = [shopUser.user_id];
	}
	else if (type === types.shopOrder)
	{
		const [shopOrder] = await db.query(`
			SELECT shop.name
			FROM shop_order
			JOIN shop ON (shop.id = shop_order.shop_id)
			WHERE shop_order.id = $1
		`, referenceId);

		if (!shopOrder)
		{
			throw new UserError('no-such-order');
		}

		description = `${user.username} has put in a new order for '${shopOrder.name}'`;

		userIds = (await db.query(`
			SELECT shop_user.user_id
			FROM shop_order
			LEFT JOIN shop_default_service ON (shop_default_service.id = shop_order.shop_default_service_id)
			LEFT JOIN shop_service ON (shop_service.id = shop_order.shop_service_id)
			LEFT JOIN shop_role_service ON (shop_role_service.shop_service_id = shop_service.id)
			LEFT JOIN shop_role_default_service ON (shop_role_default_service.shop_default_service_id = shop_default_service.id)
			JOIN shop_user_role ON (shop_user_role.shop_role_id = shop_role_service.shop_role_id OR shop_user_role.shop_role_id = shop_role_default_service.shop_role_id)
			JOIN shop_user ON (shop_user.id = shop_user_role.shop_user_id)
			WHERE shop_user.active = true AND shop_order.id = $1
		`, referenceId)).map((u: { user_id: number }) => u.user_id);
	}
	else if (type === types.shopApplication)
	{
		const [shopApplication] = await db.query(`
			SELECT shop.name
			FROM shop_application
			JOIN shop ON (shop.id = shop_application.shop_id)
			WHERE shop_application.id = $1
		`, referenceId);

		if (!shopApplication)
		{
			throw new UserError('no-such-application');
		}

		description = `${user.username} has applied to '${shopApplication.name}'`;

		const [owners, contacts] = await Promise.all([
			db.query(`
				SELECT shop_user.user_id
				FROM shop_application
				JOIN shop_user ON (shop_user.shop_id = shop_application.shop_id)
				JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
				JOIN shop_role ON (shop_role.id = shop_user_role.shop_role_id)
				WHERE shop_user.active = true AND shop_role.parent_id IS NULL AND shop_application.id = $1
			`, referenceId),
			db.query(`
				SELECT shop_user.user_id
				FROM shop_application
				JOIN shop_user ON (shop_user.shop_id = shop_application.shop_id)
				JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
				JOIN shop_role ON (shop_role.id = shop_user_role.shop_role_id)
				JOIN shop_role shop_application_role ON (shop_application_role.id = shop_application.shop_role_id)
				JOIN (
					WITH RECURSIVE Descendants AS
					(
						SELECT shop_role.parent_id, shop_role.id
						FROM shop_role
						WHERE shop_role.parent_id IS NULL
						UNION ALL
						SELECT shop_role.parent_id, shop_role.id
						FROM shop_role
						JOIN Descendants D ON (D.id = shop_role.parent_id)
					)
					SELECT * from Descendants
				) AS parent_shop_roles ON (parent_shop_roles.parent_id = shop_role.id AND parent_shop_roles.id = shop_application_role.id)
				WHERE shop_user.active = true AND shop_application.id = $1
			`, referenceId),
		]);

		owners.concat(contacts).map((u: { user_id: number }) =>
		{
			if (!userIds.includes(u.user_id))
			{
				userIds.push(u.user_id);
			}
		});
	}
	else if (type === types.badge)
	{
		const [userBadge] = await db.query(`
			SELECT user_badge.user_id, badge.name
			FROM user_badge
			JOIN badge ON (badge.id = user_badge.badge_id)
			WHERE user_badge.badge_id = $1 AND user_badge.user_id = $2
		`, referenceId, this.userId);

		if (!userBadge)
		{
			throw new UserError('no-such-badge');
		}

		description = `Congrats! You have earned the badge: '${userBadge.name}'`;

		userIds = [userBadge.user_id];
	}
	else
	{
		throw new UserError('bad-format');
	}

	if (utils.realStringLength(description) === 0)
	{
		throw new UserError('bad-format');
	}

	// Perform queries
	if (type === types.announcement)
	{
		await db.query(`
			INSERT INTO global_notification (reference_id, reference_type_id, description)
			VALUES ($1::int, $2::int, $3)
			RETURNING id
		`, useReferenceId, notificationType.id, description);

		for (let userId of await getAllConnectedUserIds())
		{
			try
			{
				const latestNotification = await this.fullQuery(userId, 'v1/notification/latest');

				sendNotificationToUser(userId, constants.webSocketTypes.notification, latestNotification);
			}
			catch (err)
			{
				console.error('Error sending global announcement via WebSocket.', userId, err);
			}
		}

		const emailUsers = await db.query(`
			SELECT id
			FROM users
			WHERE email_notifications = true
		`);

		if (emailUsers.length > 0)
		{
			let globalNotification: {
				identifier: string
				reference_id: number
				description: string
				url?: string
			} = {
				identifier: type,
				reference_id: useReferenceId,
				description: description,
			};

			globalNotification.url = utils.getGlobalNotificationReferenceLink(globalNotification);

			await Promise.all(emailUsers.map(async (emailUser: { id: number }) =>
			{
				try
				{
					await accounts.emailUser({
						user: emailUser.id,
						subject: 'Notification: ' + globalNotification.description,
						text: getEmailText(globalNotification, emailUser.id),
					});
				}
				catch (error: unknown)
				{
					console.error('Error sending (global) email notification:', error);
				}
			}));
		}

		return;
	}

	if (userIds.length === 0)
	{
		return;
	}

	// distinct users
	userIds = [...new Set(userIds)];

	const chunkSize = 50000;

	for (let i = 0; i < userIds.length; i += chunkSize)
	{
		const chunkedUserIds = userIds.slice(i, i + chunkSize);

		if (utils.realStringLength(multiDescription) > 0)
		{
			const existingNotificationUserIds = (await db.query(`
				SELECT user_id
				FROM notification
				WHERE user_id = ANY($1) AND reference_id = $2 AND reference_type_id = $3
			`, chunkedUserIds, useReferenceId, notificationType.id)).map((n: { user_id: number }) => n.user_id);

			// if notification already exists for that object and type, re-notify them with latest
			if (existingNotificationUserIds.length > 0)
			{
				await db.query(`
					INSERT INTO notification (user_id, reference_id, reference_type_id, description, count)
					VALUES (unnest($1::int[]), $2::int, $3::int, $4, 1)
					ON CONFLICT ON CONSTRAINT notification_user_id_reference_id_reference_type_id_key DO UPDATE SET
						notified = null,
						description = EXCLUDED.description,
						child_reference_id = EXCLUDED.child_reference_id,
						count = COALESCE(notification.count, 0) + 1
				`, existingNotificationUserIds, useReferenceId, notificationType.id, multiDescription);
			}

			const nonExistingNotificationUserIds = chunkedUserIds.filter(id => !existingNotificationUserIds.includes(id));

			if (nonExistingNotificationUserIds.length > 0)
			{
				await db.query(`
					INSERT INTO notification (user_id, reference_id, reference_type_id, description, child_reference_id, count)
					VALUES (unnest($1::int[]), $2::int, $3::int, $4, $5, 1)
					ON CONFLICT ON CONSTRAINT notification_user_id_reference_id_reference_type_id_key DO UPDATE SET
						notified = null,
						description = EXCLUDED.description,
						child_reference_id = EXCLUDED.child_reference_id,
						count = COALESCE(notification.count, 0) + 1
				`, nonExistingNotificationUserIds, useReferenceId, notificationType.id, description, childReferenceId);
			}
		}
		else
		{
			await db.query(`
				INSERT INTO notification (user_id, reference_id, reference_type_id, description, count)
				VALUES (unnest($1::int[]), $2::int, $3::int, $4, 1)
				ON CONFLICT ON CONSTRAINT notification_user_id_reference_id_reference_type_id_key DO UPDATE SET
					notified = null,
					description = EXCLUDED.description,
					child_reference_id = EXCLUDED.child_reference_id,
					count = COALESCE(notification.count, 0) + 1
			`, chunkedUserIds, useReferenceId, notificationType.id, description);
		}
	}

	const connectedUserIds = await getAllConnectedUserIds();

	for (let userId of connectedUserIds.filter(x => userIds.includes(x)))
	{
		try
		{
			const latestNotification = await this.fullQuery(userId, 'v1/notification/latest');

			sendNotificationToUser(userId, constants.webSocketTypes.notification, latestNotification);
		}
		catch (err)
		{
			console.error('Error sending notification via WebSocket.', userId, err);
		}
	}

	const accountSettings = await db.query(`
		SELECT
			users.id,
			users.email_notifications,
			string_agg(user_subscription.subscription, ';') AS subscriptions
		FROM users
		LEFT JOIN user_subscription ON user_subscription.user_id = users.id
		WHERE users.id = ANY($1) AND (users.email_notifications = true
		OR (
				(user_subscription.desktop = true
					AND EXISTS (
						SELECT 1
						FROM user_subscription ua
						WHERE ua.user_id = users.id
						AND ua.desktop = true
						AND ua.last_active_time >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '10 minutes'
					)
				)
				OR (user_subscription.desktop = false
					AND NOT EXISTS (
						SELECT 1
						FROM user_subscription ua
						WHERE ua.user_id = users.id
						AND ua.desktop = true
						AND ua.last_active_time >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '10 minutes'
					)
				)
		))
		GROUP BY users.id, users.email_notifications
	`, userIds);

	await Promise.all(accountSettings.map(async (user: { id: number, email_notifications: boolean, subscriptions: string }) =>
	{
		const userId = user.id;

		let userNotification: {
			identifier: string
			reference_id: number
			description: string
			child_reference_id: number | null
			count: number
			url?: string
		} = {
			identifier: type,
			reference_id: useReferenceId,
			description: description,
			child_reference_id: childReferenceId,
			// since this is email, they'll get a notification everytime anyways
			count: 1,
		};

		// see v1/notification.js
		let permission = true;

		if ([
			constants.notification.types.PT,
			constants.notification.types.FT,
			constants.notification.types.FT_edit,
			constants.notification.types.FB,
			constants.notification.types.usernameTag,
			constants.notification.types.postQuote,
		].includes(type)
		)
		{
			permission = await this.fullQuery(userId, 'v1/node/permission', { permission: 'read', nodeId: userNotification.reference_id });
		}
		else if (type === constants.notification.types.postReaction)
		{
			permission = await this.query('v1/node/permission', { permission: 'react', nodeId: userNotification.reference_id });
		}

		if (!permission)
		{
			return;
		}

		let userCheck = false;

		if (userNotification.identifier === constants.notification.types.modminUTPost)
		{
			const groupIds = await db.getUserGroups(userId);

			const permissionGranted = await db.query(`
				SELECT *
				FROM (
					SELECT *
					FROM (
						SELECT
							'user' AS type,
							user_permission.user_id AS type_id,
							user_permission.granted,
							permission.identifier
						FROM permission
						JOIN user_permission ON (user_permission.permission_id = permission.id)
						WHERE permission.identifier = $1 AND user_permission.user_id = $2

						UNION ALL

						SELECT
							'group' AS type,
							user_group_permissions.type_id,
							user_group_permissions.granted,
							user_group_permissions.identifier
						FROM user_group_permissions
						WHERE user_group_permissions.identifier = $1 AND user_group_permissions.user_group_id = ANY($3)
					) AS permissions
					ORDER BY type DESC, type_id DESC
					LIMIT 1
				) AS permissions
				WHERE granted = true
			`, 'process-user-tickets', userId, groupIds);

			userCheck = permissionGranted.length > 0;
		}

		let extra: {
			parentId?: number
			page?: number
			post: number | null
		} = {
			post: null,
		};

		if (
			[
				constants.notification.types.PT,
				constants.notification.types.FT,
				constants.notification.types.FT_edit,
				constants.notification.types.usernameTag,
				constants.notification.types.shopThread,
				constants.notification.types.postQuote,
				constants.notification.types.postReaction,
			].includes(userNotification.identifier)
		)
		{
			if (childReferenceId && constants.notification.types.FT_edit === userNotification.identifier)
			{
				// Edited post — link directly to that post
				const [parent] = await db.query(`
					SELECT node.parent_node_id AS id
					FROM node
					WHERE node.id = $1
				`, childReferenceId);

				const children = await db.query(`
					SELECT node.id
					FROM node
					WHERE node.parent_node_id = $1
					ORDER BY creation_time ASC
				`, parent.id);

				let page = 1, index = 0;

				for (let child of children)
				{
					if (index % constants.threadPageSize === 0 && index !== 0)
					{
						page++;
					}

					if (child.id === childReferenceId)
					{
						break;
					}

					index++;
				}

				extra = {
					parentId: parent.id,
					page: page,
					post: childReferenceId,
				};
			}
			else
			{
				let children: {
					id: number
					creation_time: Date
				}[] = [];
				let nodeUser: { last_checked: Date } | null = null, parentId = userNotification.reference_id, post: number | null = userNotification.reference_id;

				if ([
					constants.notification.types.usernameTag,
					constants.notification.types.postQuote,
					constants.notification.types.postReaction,
				].includes(userNotification.identifier)
				)
				{
					const [parent] = await db.query(`
						SELECT node.parent_node_id AS id
						FROM node
						WHERE node.id = $1
					`, userNotification.reference_id);

					children = await db.query(`
						SELECT node.id
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
					`, userNotification.reference_id, userId);

					if (nodeUser)
					{
						children = await db.query(`
							SELECT node.id, node.creation_time
							FROM node
							WHERE node.parent_node_id = $1
							ORDER BY creation_time ASC
						`, userNotification.reference_id);
					}

					post = null;
				}

				let page = 1, index = 0;

				for (let child of children)
				{
					if (index % constants.threadPageSize === 0 && index !== 0)
					{
						page++;
					}

					if ([
						constants.notification.types.usernameTag,
						constants.notification.types.postQuote,
						constants.notification.types.postReaction,
					].includes(userNotification.identifier)
					)
					{
						if (child.id === userNotification.reference_id)
						{
							break;
						}
					}
					else
					{
						if (nodeUser && dateUtils.isAfter(child.creation_time, nodeUser.last_checked))
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
		}

		userNotification.url = utils.getNotificationReferenceLink(userNotification, userCheck, userId, extra);

		const subs = user.subscriptions ? user.subscriptions.split(';') : [];

		if (subs.length > 0)
		{
			subs.map(sub =>
			{
				const subscription = JSON.parse(sub);

				webpush.sendNotification(subscription,
					JSON.stringify({
						title: 'Notification',
						body: userNotification.description,
						url: userNotification.url,
					}),
				).catch(async err =>
				{
					if (err.statusCode === 410 || err.statusCode === 404)
					{
						console.info('Invalid subscription for user', user.id);
					}
					else
					{
						console.error('Error sending push notification for user', user.id, err);
					}
				});
			});
		}

		if (user.email_notifications)
		{
			try
			{
				await accounts.emailUser({
					user: userId,
					subject: 'Notification: ' + userNotification.description,
					text: getEmailText(userNotification, userId),
				});
			}
			catch (error: unknown)
			{
				console.error('Error sending email notification:', error);
			}
		}
	}));
}

function getEmailText(notification: { identifier: string, reference_id: number, description: string, child_reference_id: number | null, count: number, url?: string } | { identifier: string, reference_id: number, description: string, url?: string }, userId: number): string
{
	const vbnewline = '<br/>';

	const origSendTo = constants.LIVE_SITE ? '' : `Originally sending to: ${userId}${vbnewline}${vbnewline}`;

	let email = `${notification.description}${vbnewline}${vbnewline}`;
	email += `${constants.SITE_URL}${notification.url}${vbnewline}${vbnewline}`;

	email += `${vbnewline}${vbnewline}ACC Staff${vbnewline}${vbnewline}`;

	email += `Note: You have set 'Email Notifications' on. If you no longer wish to receive notification emails, log in to ${constants.SITE_URL} and update your account settings.`;

	return '<span style="font-family: Verdana; font-size: 11px;">' + origSendTo + email + '</span>';
}

create.permissions = [
	'userId',
];

create.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	type: {
		type: APITypes.string,
		required: true,
	},
};

type createProps = {
	id: number
	type: string
};

export default create;
