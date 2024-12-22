import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';
import { APIThisType, UserTicketActionType, BanLengthType } from '@types';

async function complete(this: APIThisType, { id, ruleId, violationId, actionId, updatedContent, boardId, banLengthId }: completeProps): Promise<void>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'process-user-tickets' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	const [userTicket] = await db.query(`
		SELECT
			user_ticket.id,
			user_ticket.assignee_id,
			user_ticket_status.name AS status,
			user_ticket_type.identifier As type_identifier,
			user_ticket.reference_id,
			user_ticket.violator_id
		FROM user_ticket
		JOIN user_ticket_status ON (user_ticket.status_id = user_ticket_status.id)
		JOIN user_ticket_type ON (user_ticket.type_id = user_ticket_type.id)
		WHERE user_ticket.id = $1::int
	`, id);

	const actions: UserTicketActionType[] = await this.query('v1/user_ticket/actions');

	const checkAction = actions.find(a => a.id === actionId);

	if (!checkAction)
	{
		throw new UserError('bad-format');
	}

	// wrong action for this type
	if (!checkAction.types.includes(userTicket.type_identifier))
	{
		throw new UserError('bad-format');
	}

	let banEndDate = null;

	const currentBan: BanLengthType | null = await this.query('v1/users/ban_length', { id: userTicket.violator_id });

	if (banLengthId > 0)
	{
		let [checkId] = await db.query(`
			SELECT days
			FROM ban_length
			WHERE id = $1::int
		`, banLengthId);

		if (!checkId)
		{
			throw new UserError('bad-format');
		}

		// only record ban length if it changed
		if (currentBan)
		{
			if (currentBan.id === banLengthId)
			{
				banLengthId = 0;
			}
			// can't make a ban shorter
			else if (currentBan.days > checkId.days)
			{
				throw new UserError('shorter-ban');
			}
		}

		banEndDate = checkId.days === null ? null : dateUtils.formatYearMonthDay(dateUtils.addToCurrentDateTimezone(checkId.days, 'days'));
	}
	else if (currentBan)
	{
		throw new UserError('shorter-ban');
	}

	const utActions = constants.userTicket.actions;

	if (boardId === 0 && checkAction.identifier === utActions.moveThread)
	{
		throw new UserError('bad-format');
	}

	const statuses = constants.userTicket.statuses;

	// only can complete it if assigned to you and in right status
	if (userTicket.assignee_id !== this.userId || ![statuses.open, statuses.inProgress, statuses.inDiscussion].includes(userTicket.status))
	{
		throw new UserError('permission');
	}

	// do specific actions

	const types = constants.userTicket.types;
	const notificationTypes = constants.notification.types;

	let node = null;

	if ([types.post, types.thread].includes(userTicket.type_identifier))
	{
		[node] = await db.query(`
			SELECT node_id, content_format
			FROM node_revision
			WHERE node_revision.id = $1::int
		`, userTicket.reference_id);
	}

	if (checkAction.identifier === utActions.delete)
	{
		try
		{
			switch (userTicket.type_identifier)
			{
				case types.pattern:
					// usually pattern/destroy wouldn't delete the town data using this pattern
					// we do want to do that here
					await db.query(`
						UPDATE town
						SET flag_id = NULL, flag_creator_id = NULL, flag_data_url = NULL, flag_name = NULL
						WHERE flag_id = $1::int
					`, userTicket.reference_id);

					await db.query(`
						DELETE FROM pattern
						WHERE id = $1::int
					`, userTicket.reference_id);

					break;
				case types.townFlag:
					await db.query(`
						UPDATE town
						SET flag_id = NULL, flag_creator_id = NULL, flag_data_url = NULL, flag_name = NULL
						WHERE id = $1::int
					`, userTicket.reference_id);

					break;
				case types.tune:
					await this.query('v1/tune/destroy', { id: userTicket.reference_id });

					// usually tune/destroy wouldn't delete the town data using these tunes
					// we do want to do that here
					await db.query(`
						UPDATE town
						SET town_tune_id = NULL, town_tune_creator_id = NULL, town_tune_notes = NULL, town_tune_name = NULL
						WHERE town_tune_id = $1::int
					`, userTicket.reference_id);

					break;
				case types.townTune:
					await db.query(`
						UPDATE town
						SET town_tune_id = NULL, town_tune_creator_id = NULL, town_tune_notes = NULL, town_tune_name = NULL
						WHERE id = $1::int
					`, userTicket.reference_id);

					break;
				case types.map:
					await db.query(`
						DELETE FROM map_design
						WHERE id = $1::int
					`, userTicket.reference_id);

					break;
				case types.town:
					await this.query('v1/town/destroy', { id: userTicket.reference_id });
					break;
				case types.character:
					await this.query('v1/character/destroy', { id: userTicket.reference_id });
					break;
				case types.rating:
				{
					const [rating] = await db.query(`
						SELECT listing_id, adoption_node_id
						FROM rating
						WHERE id = $1::int
					`, userTicket.reference_id);

					await Promise.all([
						db.query(`
							DELETE FROM rating
							WHERE id = $1::int
						`, userTicket.reference_id),
						rating.listing_id ? this.query('v1/notification/destroy', {
							id: rating.listing_id,
							type: notificationTypes.listingFeedback,
						}) : null,
						rating.adoption_node_id ? this.query('v1/notification/destroy', {
							id: rating.adoption_node_id,
							type: notificationTypes.scoutFeedback,
						}) : null,
					]);

					break;
				}
				case types.listing:
					await Promise.all([
						await db.query(`
							DELETE FROM listing
							WHERE id = $1::int
						`, userTicket.reference_id),
						this.query('v1/notification/destroy', {
							id: userTicket.reference_id,
							type: 'listing',
						}),
					]);

					break;
				case types.offer:
				{
					const [offer] = await db.query(`
						SELECT listing_id
						FROM listing_offer
						WHERE id = $1::int
					`, userTicket.reference_id);

					await Promise.all([
						db.query(`
							DELETE FROM listing_offer
							WHERE id = $1::int
						`, userTicket.reference_id),
						this.query('v1/notification/destroy', {
							id: offer.listing_id,
							type: 'listing',
						}),
					]);

					break;
				}
				case types.profileLocation:
					await db.query(`
						UPDATE users
						SET bio_location = null
						WHERE id = $1::int
					`, userTicket.reference_id);

					break;
				case types.profileSignature:
					await db.query(`
						UPDATE users
						SET signature = null
						WHERE id = $1::int
					`, userTicket.reference_id);

					break;
				case types.profileName:
					await db.query(`
						UPDATE users
						SET name = null
						WHERE id = $1::int
					`, userTicket.reference_id);

					break;
				case types.shopImage:
					await db.query(`
						UPDATE shop
						SET header_file_id = NULL
						WHERE id = $1
					`, userTicket.reference_id);
				case types.profileImage:
				case types.postImage:
					await db.query(`
						DELETE FROM file
						WHERE id = $1::int
					`, userTicket.reference_id);

					break;
			}
		}
		catch (_: any)
		{
			// do nothing
		}
	}
	else if (checkAction.identifier === utActions.modify)
	{
		switch (userTicket.type_identifier)
		{
			case types.thread:
				await db.query(`
					INSERT INTO node_revision (node_id, reviser_id, title, user_ticket_id)
					VALUES ($1::int, $2::int, $3::text, $4::int)
				`, node.node_id, this.userId, updatedContent, userTicket.id);

				break;
			case types.post:
				await db.query(`
					INSERT INTO node_revision (node_id, reviser_id, content, content_format, user_ticket_id)
					VALUES ($1::int, $2::int, $3::text, $4::node_content_format, $5::int)
				`, node.node_id, this.userId, updatedContent, node.content_format, userTicket.id);

				break;
			case types.listing:
				await db.query(`
					UPDATE listing
					SET comment = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.listingComment:
				await db.query(`
					UPDATE listing_comment
					SET comment = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.offer:
				await db.query(`
					UPDATE listing_offer
					SET comment = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.profileLocation:
				await db.query(`
					UPDATE users
					SET bio_location = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.profileSignature:
				await db.query(`
					UPDATE users
					SET signature = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.profileBio:
				await db.query(`
					UPDATE users
					SET bio = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.profileUsername:
				// Confirm test-account only on test sites
				if (!constants.LIVE_SITE && !constants.testAccounts.includes(userTicket.reference_id))
				{
					throw new UserError('live-username-change');
				}

				// Confirm username is free (current user OR username change)
				try
				{
					await accounts.getUserData(null, updatedContent);

					throw new UserError('username-taken');
				}
				catch (error: any)
				{
					if (error.name === 'UserError' && error.identifiers.includes('no-such-user'))
					{
						// it's supposed to error because no user found with that username, we can continue
					}
					else
					{
						// Not this function's problem then, so pass it on.
						throw error;
					}
				}

				await accounts.pushData(
					{
						user_id: userTicket.reference_id,
						username: updatedContent,
						ignore_history: true,
					});

				break;
			case types.shopName:
				await db.query(`
					UPDATE shop
					SET name = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.shopShortDescription:
				await db.query(`
					UPDATE shop
					SET short_description = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.shopDescription:
				await db.query(`
					UPDATE shop
					SET description = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.shopRoleName:
				await db.query(`
					UPDATE shop_role
					SET name = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.shopRoleDescription:
				await db.query(`
					UPDATE shop_role
					SET description = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.shopServiceName:
				await db.query(`
					UPDATE shop_service
					SET name = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.shopServiceDescription:
				await db.query(`
					UPDATE shop_service
					SET description = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.shopOrder:
				await db.query(`
					UPDATE shop_order
					SET comment = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
			case types.shopApplication:
				await db.query(`
					UPDATE shop_application
					SET application = $2
					WHERE id = $1::int
				`, userTicket.reference_id, updatedContent);

				break;
		}
	}
	else if (checkAction.identifier === utActions.lockThread)
	{
		await db.query(`
			UPDATE node
			SET locked = now(), thread_type = 'normal'
			WHERE id = $1::int
		`, node.node_id);

		await db.updatePTsLookup(node.node_id);
	}
	else if (checkAction.identifier === utActions.moveThread)
	{
		await db.query(`
			UPDATE node
			SET parent_node_id = $2::int
			WHERE id = $1::int
		`, node.node_id, boardId);

		await db.updatePTsLookup(node.node_id);
	}

	// Update Ban Length
	if (banLengthId > 0)
	{
		await db.query(`
			INSERT INTO user_ban_length (ban_length_id, end_date, user_ticket_id) VALUES
			($1::int, $2, $3::int)
		`, banLengthId, banEndDate, id);

		await db.query(`
			UPDATE users
			SET current_ban_length_id = $1::int
			WHERE id = $2::int
		`, banLengthId, userTicket.violator_id);
	}

	// Complete UT
	const [status] = await db.query(`
		SELECT id
		FROM user_ticket_status
		WHERE name = $1
	`, statuses.closed);

	await Promise.all([
		db.query(`
			UPDATE user_ticket
			SET status_id = $2::int, rule_violation_id = $3, updated_text = $4, action_id = $5::int, last_updated = now(), closed = now(), rule_id = $6
			WHERE id = $1::int
		`, id, status.id, Number(violationId || 0) > 0 ? violationId : null, checkAction.identifier === 'modify' ? updatedContent : null, actionId, ruleId),
		this.query('v1/notification/create', {
			id: id,
			type: notificationTypes.ticketProcessed,
		}),
	]);

	// Email User about ban
	if (banLengthId > 0)
	{
		try
		{
			await accounts.emailUser({
				user: userTicket.violator_id,
				subject: 'Suspension of Your Account',
				text: await getEmailText.bind(this)(id, banLengthId),
			});
		}
		catch (error)
		{
			console.error(error);
		}
	}
}

async function getEmailText(this: APIThisType, userTicketId: number, banLengthId: number): Promise<string>
{
	const [userTicket, [rule], [banLength]] = await Promise.all([
		this.query('v1/user_ticket', { id: userTicketId }),
		db.query(`
			SELECT
				rule.description,
				rule_violation.severity_id,
				rule_violation.violation
			FROM rule
			LEFT JOIN rule_violation ON (rule_violation.rule_id = rule.id)
			JOIN user_ticket ON (user_ticket.rule_violation_id = rule_violation.id OR (user_ticket.rule_violation_id IS NULL AND user_ticket.rule_id = rule.id))
			WHERE user_ticket.id = $1::int
		`, userTicketId),
		db.query(`
			SELECT days, description
			FROM ban_length
			WHERE id = $1::int
		`, banLengthId),
	]);

	const vbnewline = '<br/>';

	let memberNotes = `Hello ${userTicket.violator.username},${vbnewline}${vbnewline}`;
	memberNotes += `This is to notify you that we have found activity on your account that is in violation of the <a href='${constants.SITE_URL}/guidelines'>ACC Site Guidelines</a>.${vbnewline}${vbnewline}`;

	if (userTicket.reference.text || userTicket.reference.url)
	{
		let content;

		if (userTicket.reference.text)
		{
			content = userTicket.reference.text;
		}
		else if (userTicket.reference.url)
		{
			content = `<img src='${userTicket.reference.url}' />`;
		}

		memberNotes += `This notice is a result of the following content:<blockquote><strong>${userTicket.type.description}</strong>${vbnewline}<table cellpadding="0" cellspacing="0"><tr><td style="font-size: 10px;">${content}</td></tr></table></blockquote>`;
	}

	memberNotes += `This content violated the following guideline:${vbnewline}${vbnewline}<strong>${userTicket.rule}</strong>${vbnewline}${rule.description}${vbnewline}${vbnewline}`;

	if (rule.severity_id)
	{
		memberNotes += `This violation was a <strong>Level ${rule.severity_id}</strong>`;
	}

	if (rule.violation)
	{
		memberNotes += ` violation:${vbnewline}<strong>${rule.violation}</strong>`;
	}

	memberNotes += `${vbnewline}${vbnewline}The following actions have been taken as a result of this violation:${vbnewline}${vbnewline}`;

	if (banLength.days === null)
	{
		memberNotes += `<font color="red"><strong>Your account has been permanently banned.</strong></font>`;
	}
	else
	{
		memberNotes += `<font color="red">Your account has been temporarily <strong>banned for ${banLength.description}</strong>.</font>`;
	}

	memberNotes += `${vbnewline}${vbnewline}ACC Staff`;

	return '<span style="font-family: Verdana; font-size: 11px;">' + memberNotes + '</span>';
}

complete.apiTypes = {
	id: {
		type: APITypes.userTicketId,
		required: true,
	},
	ruleId: {
		type: APITypes.ruleId,
		required: true,
	},
	violationId: {
		type: APITypes.ruleViolationId,
		nullable: true,
	},
	actionId: {
		type: APITypes.number,
		default: 0,
		required: true,
	},
	updatedContent: {
		type: APITypes.string,
		default: '',
		profanity: true,
	},
	boardId: {
		type: APITypes.nodeId,
		nullable: true,
	},
	banLengthId: {
		type: APITypes.number,
		default: 0,
	},
};

type completeProps = {
	id: number
	ruleId: number
	violationId: number | null
	actionId: number
	updatedContent: string
	boardId: number | null
	banLengthId: number
};

export default complete;
