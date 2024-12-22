import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType, UserLiteType } from '@types';

/*
 * Reports content as a rule violation to the modmins.
 */
async function report(this: APIThisType, { referenceId, type }: reportProps): Promise<SuccessType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'report-content' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Parameter Validation
	const user: UserLiteType = await this.query('v1/user_lite', { id: this.userId });

	const [typeId] = await db.query(`
		SELECT id
		FROM user_ticket_type
		WHERE identifier = $1
	`, type);

	if (!typeId)
	{
		throw new UserError('bad-format');
	}

	let referenceText = null;
	let referenceUrl = null;
	let violatorId = null;
	let referenceFormat = null;
	let parentId = null;

	const types = constants.userTicket.types;

	if (type === types.thread || type === types.post)
	{
		const [checkId] = await db.query(`
			SELECT
				node.user_id,
				node_revision.title,
				node_revision.content,
				node_revision.content_format
			FROM node
			JOIN node_revision ON (node_revision.node_id = node.id)
			WHERE node_revision.id = $1::int
		`, referenceId);

		if (!checkId)
		{
			throw new UserError('no-such-node');
		}

		violatorId = checkId.user_id;

		if (type === types.thread)
		{
			referenceText = checkId.title;
		}
		else if (type === types.post)
		{
			referenceText = checkId.content;
			referenceFormat = checkId.content_format;
		}
	}
	else if (type === types.pattern)
	{
		const [checkId] = await db.query(`
			SELECT name, data_url, creator_id
			FROM pattern
			WHERE pattern.id = $1::int
		`, referenceId);

		if (!checkId)
		{
			throw new UserError('no-such-pattern');
		}

		violatorId = checkId.creator_id;
		referenceText = checkId.name;
		referenceUrl = checkId.data_url;
	}
	else if (type === types.postImage)
	{
		const [checkId] = await db.query(`
			SELECT file.file_id, file.name, node_revision.reviser_id, node.parent_node_id
			FROM file
			JOIN node_revision_file ON (node_revision_file.file_id = file.id)
			JOIN node_revision ON (node_revision.id = node_revision_file.node_revision_id)
			JOIN node ON (node_revision.node_id = node.id)
			WHERE file.id = $1::int
		`, referenceId);

		if (!checkId)
		{
			throw new UserError('no-such-file');
		}

		violatorId = checkId.reviser_id;
		referenceText = checkId.name;
		referenceUrl = `${constants.USER_FILE_DIR}${violatorId}/${checkId.file_id}`;
		parentId = checkId.parent_node_id;
	}
	else if (type === types.profileImage)
	{
		const [checkId] = await db.query(`
			SELECT file.file_id, file.name, user_file.user_id
			FROM file
			JOIN user_file ON (user_file.file_id = file.id)
			WHERE file.id = $1::int
		`, referenceId);

		if (!checkId)
		{
			throw new UserError('no-such-file');
		}

		violatorId = checkId.user_id;
		referenceText = checkId.name;
		referenceUrl = `${constants.USER_FILE_DIR}${violatorId}/${checkId.file_id}`;
	}
	else if (type === types.townFlag)
	{
		const [checkId] = await db.query(`
			SELECT flag_name, user_id, flag_data_url
			FROM town
			WHERE town.id = $1::int
		`, referenceId);

		if (!checkId)
		{
			throw new UserError('no-such-tune');
		}

		violatorId = checkId.user_id;
		referenceText = checkId.flag_name;
		referenceUrl = checkId.flag_data_url;
	}
	else if (type === types.tune)
	{
		const [checkId] = await db.query(`
			SELECT name, creator_id
			FROM town_tune
			WHERE town_tune.id = $1::int
		`, referenceId);

		if (!checkId)
		{
			throw new UserError('no-such-tune');
		}

		violatorId = checkId.creator_id;
		referenceText = checkId.name;
	}
	else if (type === types.townTune)
	{
		const [checkId] = await db.query(`
			SELECT town_tune_name, user_id
			FROM town
			WHERE town.id = $1::int
		`, referenceId);

		if (!checkId)
		{
			throw new UserError('no-such-tune');
		}

		violatorId = checkId.user_id;
		referenceText = checkId.town_tune_name;
	}
	else if (type === types.map || type === types.town)
	{
		const [checkId] = await db.query(`
			SELECT id, name, user_id
			FROM town
			WHERE town.id = $1::int
		`, referenceId);

		if (!checkId)
		{
			throw new UserError('no-such-town');
		}

		violatorId = checkId.user_id;

		if (type === types.town)
		{
			referenceText = checkId.name;
		}
		else if (type === types.map)
		{
			const [map] = await db.query(`
				SELECT data_url
				FROM map_design
				WHERE map_design.town_id = $1::int
			`, checkId.id);

			referenceUrl = map.data_url;
		}
	}
	else if (type === types.character)
	{
		const [checkId] = await db.query(`
			SELECT character.name, town.user_id
			FROM character
			JOIN town ON (town.id = character.town_id)
			WHERE character.id = $1::int
		`, referenceId);

		violatorId = checkId.user_id;

		if (!checkId)
		{
			throw new UserError('no-such-character');
		}

		referenceText = checkId.name;
	}
	else if (type === types.rating)
	{
		const [checkId] = await db.query(`
			SELECT comment, user_id
			FROM rating
			WHERE rating.id = $1::int
		`, referenceId);

		if (!checkId)
		{
			throw new UserError('no-such-rating');
		}

		violatorId = checkId.user_id;
		referenceText = checkId.comment;
	}
	else if (type === types.listing)
	{
		const [listing] = await db.query(`
			SELECT creator_id
			FROM listing
			WHERE listing.id = $1::int
		`, referenceId);

		if (!listing)
		{
			throw new UserError('no-such-listing');
		}

		const [listingOffer] = await db.query(`
			SELECT comment
			FROM listing_offer
			WHERE listing_id = $1::int AND user_id = $2::int
		`, referenceId, listing.creator_id);

		if (!listingOffer)
		{
			throw new UserError('no-such-listing-offer');
		}

		violatorId = listing.creator_id;
		referenceText = listingOffer.comment;
	}
	else if (type === types.listingComment)
	{
		const [checkId] = await db.query(`
			SELECT comment, user_id
			FROM listing_comment
			WHERE listing_comment.id = $1::int
		`, referenceId);

		if (!checkId)
		{
			throw new UserError('no-such-listing-comment');
		}

		violatorId = checkId.user_id;
		referenceText = checkId.comment;
	}
	else if (type === types.offer)
	{
		const [checkId] = await db.query(`
			SELECT comment, user_id, listing_id
			FROM listing_offer
			WHERE listing_offer.id = $1::int
		`, referenceId);

		if (!checkId)
		{
			throw new UserError('no-such-offer');
		}

		violatorId = checkId.user_id;
		referenceText = checkId.comment;
		parentId = checkId.listing_id;
	}
	else if (type.startsWith('shop_'))
	{
		if ([types.shopName, types.shopShortDescription, types.shopDescription, types.shopImage].includes(type))
		{
			const [checkId] = await db.query(`
				SELECT
					shop.name,
					shop.short_description,
					shop.description,
					shop.description_format,
					file.file_id,
					shop_audit.user_id,
					file.name AS filename
				FROM shop
				LEFT JOIN file ON (shop.header_file_id = file.id)
				LEFT JOIN shop_audit ON (shop_audit.shop_id = shop.id AND shop_audit.value = $2)
				WHERE shop.id = $1
			`, referenceId, type);

			if (!checkId)
			{
				throw new UserError('no-such-shop');
			}

			violatorId = checkId.user_id ? checkId.user_id : constants.accUserId;

			if (type === types.shopName)
			{
				referenceText = checkId.name;
			}
			else if (type === types.shopShortDescription)
			{
				referenceText = checkId.short_description;
			}
			else if (type === types.shopDescription)
			{
				referenceText = checkId.description;
				referenceFormat = checkId.description_format;
			}
			else if (type === types.shopImage)
			{
				referenceText = checkId.filename;
				referenceUrl = `${constants.SHOP_FILE_DIR}${referenceId}/${checkId.file_id}`;
			}
		}
		else if ([types.shopServiceName, types.shopServiceDescription].includes(type))
		{
			const [checkId] = await db.query(`
				SELECT name, description, shop_audit.user_id
				FROM shop_service
				LEFT JOIN shop_audit ON (shop_audit.shop_id = shop_service.shop_id AND shop_audit.value = $2)
				WHERE shop_service.id = $1
			`, referenceId, type);

			if (!checkId)
			{
				throw new UserError('no-such-service');
			}

			violatorId = checkId.user_id ? checkId.user_id : constants.accUserId;

			if (type === types.shopServiceName)
			{
				referenceText = checkId.name;
			}
			else if (type === types.shopServiceDescription)
			{
				referenceText = checkId.description;
			}
		}
		else if ([types.shopRoleName, types.shopRoleDescription].includes(type))
		{
			const [checkId] = await db.query(`
				SELECT name, description, shop_audit.user_id
				FROM shop_role
				LEFT JOIN shop_audit ON (shop_audit.shop_id = shop_role.shop_id AND shop_audit.value = $2)
				WHERE shop_role.id = $1
			`, referenceId, type);

			if (!checkId)
			{
				throw new UserError('no-such-role');
			}

			violatorId = checkId.user_id ? checkId.user_id : constants.accUserId;

			if (type === types.shopRoleName)
			{
				referenceText = checkId.name;
			}
			else if (type === types.shopRoleDescription)
			{
				referenceText = checkId.description;
			}
		}
		else if ([types.shopOrder].includes(type))
		{
			const [checkId] = await db.query(`
				SELECT comment, customer_id
				FROM shop_order
				WHERE shop_order.id = $1
			`, referenceId);

			if (!checkId)
			{
				throw new UserError('no-such-order');
			}

			violatorId = checkId.customer_id;
			referenceText = checkId.comment;
		}
		else if ([types.shopApplication].includes(type))
		{
			const [checkId] = await db.query(`
				SELECT application, application_format, user_id
				FROM shop_application
				WHERE shop_application.id = $1
			`, referenceId);

			if (!checkId)
			{
				throw new UserError('no-such-application');
			}

			violatorId = checkId.user_id;
			referenceText = checkId.application;
			referenceFormat = checkId.application_format;
		}
	}
	else if (type.startsWith('profile_'))
	{
		const [checkId] = await db.query(`
			SELECT
				users.id,
				users.bio_location,
				users.signature,
				user_account_cache.username,
				users.name,
				users.bio,
				users.bio_format,
				users.signature_format,
				users.user_title
			FROM users
			JOIN user_account_cache ON (users.id = user_account_cache.id)
			WHERE users.id = $1::int
		`, referenceId);

		if (!checkId)
		{
			throw new UserError('no-such-user');
		}

		violatorId = checkId.id;

		if (type === types.profileLocation)
		{
			referenceText = checkId.bio_location;
		}
		else if (type === types.profileSignature)
		{
			referenceText = checkId.signature;
			referenceFormat = checkId.signature_format;
		}
		else if (type === types.profileName)
		{
			referenceText = checkId.name;
		}
		else if (type === types.profileBio)
		{
			referenceText = checkId.bio;
			referenceFormat = checkId.bio_format;
		}
		else if (type === types.profileUsername)
		{
			referenceText = checkId.username;
		}
		else if (type === types.profileUserTitle)
		{
			referenceText = checkId.user_title;
		}
	}
	else
	{
		throw new UserError('bad-format');
	}

	// Perform queries
	const successImage = `${constants.AWS_URL}/images/icons/icon_check.png`;

	const notificationTypes = constants.notification.types;

	// Check if open user ticket already exists
	let [currentUserTicket] = await db.query(`
		SELECT user_ticket.id
		FROM user_ticket
		WHERE user_ticket.closed IS NULL AND user_ticket.type_id = $2::int AND user_ticket.reference_id = $1::int
		LIMIT 1
	`, referenceId, typeId.id);

	let newUserTicket = false, assigneeId = null;

	if (!currentUserTicket)
	{
		const [processUserTickets, processModTickets, violator] = await Promise.all([
			this.query('v1/permission', { permission: 'process-user-tickets', user: user.id }),
			this.query('v1/permission', { permission: 'process-mod-tickets', user: user.id }),
			this.query('v1/user', { id: violatorId }),
		]);

		const staffIdentifiers = constants.staffIdentifiers;

		if (
			processUserTickets && (![
				staffIdentifiers.mod,
				staffIdentifiers.admin,
				staffIdentifiers.owner,
			].includes(violator.group.identifier) || [
				staffIdentifiers.mod,
				staffIdentifiers.admin,
				staffIdentifiers.owner,
			].includes(violator.group.identifier) && processModTickets)
		)
		{
			assigneeId = user.id;
		}

		[currentUserTicket] = await db.query(`
			INSERT INTO user_ticket (type_id, reference_id, reference_text, reference_url, assignee_id, status_id, violator_id, reference_format, parent_id)
			VALUES ($2::int, $1::int, $3, $4, $5::int, $6::int, $7::int, $8, $9)
			RETURNING id
		`, referenceId, typeId.id, referenceText, referenceUrl, assigneeId, constants.userTicket.openStatusId, violatorId, referenceFormat, parentId);

		newUserTicket = true;
	}

	// Create user violation if not already done
	const [currentUserViolation] = await db.query(`
		SELECT id
		FROM user_violation
		WHERE user_ticket_id = $1::int AND submitter_id = $2::int
	`, currentUserTicket.id, this.userId);

	if (currentUserViolation)
	{
		return {
			_successImage: successImage,
			_success: 'The content has been reported.',
		};
	}

	await db.query(`
		INSERT INTO user_violation (user_ticket_id, submitter_id)
		VALUES ($1::int, $2::int)
	`, currentUserTicket.id, this.userId);

	if (assigneeId === null)
	{
		if (newUserTicket)
		{
			await this.query('v1/notification/create', {
				id: currentUserTicket.id,
				type: notificationTypes.modminUT,
			});
		}
		else
		{
			await this.query('v1/notification/create', {
				id: currentUserTicket.id,
				type: notificationTypes.modminUTMany,
			});
		}
	}

	return {
		_successImage: successImage,
		_success: 'The content has been reported.',
	};
}

report.apiTypes = {
	referenceId: {
		type: APITypes.number,
		required: true,
	},
	type: {
		type: APITypes.string,
		default: '',
	},
};

type reportProps = {
	referenceId: number
	type: string
};

export default report;
