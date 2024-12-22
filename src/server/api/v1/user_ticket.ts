import * as db from '@db';
import { UserError } from '@errors';
import { utils, dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, UserTicketType } from '@types';

async function user_ticket(this: APIThisType, { id }: userTicketProps): Promise<UserTicketType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'process-user-tickets' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [userTicket] = await db.query(`
		SELECT
			user_ticket.id,
			user_ticket_status.name AS status,
			user_ticket.assignee_id,
			user_ticket.last_updated,
			user_ticket.rule_violation_id,
			user_ticket.rule_id,
			user_ticket.closed,
			user_ticket.type_id,
			user_ticket_type.description AS type_description,
			user_ticket_type.identifier AS type_identifier,
			user_ticket_deny_reason.name AS deny_reason,
			user_ticket.violator_id,
			user_ticket.updated_text,
			user_ticket_action.name AS action_name,
			user_ticket_action.identifier AS action_identifier,
			user_ticket.reference_id,
			user_ticket.reference_text,
			user_ticket.reference_url,
			user_ticket.reference_format,
			user_ticket.parent_id
		FROM user_ticket
		JOIN user_ticket_status ON (user_ticket_status.id = user_ticket.status_id)
		JOIN user_ticket_type ON (user_ticket_type.id = user_ticket.type_id)
		LEFT JOIN user_ticket_deny_reason ON (user_ticket.deny_reason_id = user_ticket_deny_reason.id)
		LEFT JOIN user_ticket_action ON (user_ticket.action_id = user_ticket_action.id)
		WHERE user_ticket.id = $1::int
	`, id);

	if (!userTicket)
	{
		throw new UserError('no-such-user-ticket');
	}

	const types = constants.userTicket.types;
	const notificationTypes = constants.notification.types;

	const [ruleViolation, rule, userViolations, [firstUserViolation], messages,
		node, [totalRuleCounts], ruleCounts, violator, previousDenied, assignee,
		utBan, currentBan, [supportTicketsCount], supportTickets, listingComment,
		serviceShop, roleShop] = await Promise.all([
		userTicket.rule_violation_id ? db.query(`
			SELECT rule_violation.severity_id, rule_violation.violation
			FROM rule_violation
			WHERE rule_violation.id = $1::int
		`, userTicket.rule_violation_id) : null,
		userTicket.rule_id ? db.query(`
			SELECT rule.number, rule.name, rule.description, rule.category_id
			FROM rule
			WHERE rule.id = $1::int
		`, userTicket.rule_id) : null,
		db.query(`
			SELECT
				user_violation.submitter_id AS id,
				user_violation.submitted,
				user_account_cache.username
			FROM user_violation
			JOIN user_account_cache ON (user_account_cache.id = user_violation.submitter_id)
			WHERE user_violation.user_ticket_id = $1::int
			ORDER BY user_violation.submitted ASC
		`, userTicket.id),
		db.query(`
			SELECT submitter_id, submitted
			FROM user_violation
			WHERE user_ticket_id = $1::int
			ORDER BY submitted ASC
			LIMIT 1
		`, userTicket.id),
		db.query(`
			SELECT id, user_id, message, created, staff_only, message_format
			FROM user_ticket_message
			WHERE user_ticket_id = $1::int
			ORDER BY created ASC
		`, userTicket.id),
		[types.post, types.thread].includes(userTicket.type_identifier) && userTicket.reference_id ? db.query(`
			SELECT node.parent_node_id, node_revision.node_id
			FROM node_revision
			JOIN node ON (node_revision.node_id = node.id)
			WHERE node_revision.id = $1::int
		`, userTicket.reference_id) : null,
		db.query(`
			SELECT count(*) AS count
			FROM user_ticket
			WHERE violator_id = $1::int
		`, userTicket.violator_id),
		db.query(`
			SELECT rule.category_id, rule.number, rule.name, count(*) AS count
			FROM user_ticket
			JOIN rule ON (user_ticket.rule_id = rule.id)
			WHERE user_ticket.violator_id = $1::int
			GROUP BY rule.id
			HAVING count(*) > 1
		`, userTicket.violator_id),
		this.query('v1/user', { id: userTicket.violator_id }),
		userTicket.reference_id ? db.query(`
			SELECT user_ticket.id
			FROM user_ticket
			JOIN user_ticket_deny_reason ON (user_ticket.deny_reason_id = user_ticket_deny_reason.id)
			WHERE user_ticket.id != $1::int AND user_ticket.reference_id = $2 AND user_ticket.type_id = $3::int
		`, userTicket.id, userTicket.reference_id, userTicket.type_id) : [],
		userTicket.assignee_id ? this.query('v1/user_lite', { id: userTicket.assignee_id }) : null,
		userTicket.status === constants.userTicket.statuses.closed ? db.query(`
			SELECT
				ban_length.id,
				ban_length.description,
				ban_length.days
			FROM ban_length
			JOIN user_ban_length ON (user_ban_length.ban_length_id = ban_length.id)
			WHERE user_ban_length.user_ticket_id = $1::int
		`, userTicket.id) : null,
		this.query('v1/users/ban_length', { id: userTicket.violator_id }),
		db.query(`
			SELECT count(*) AS count
			FROM support_ticket
			WHERE user_id = $1::int
		`, userTicket.violator_id),
		db.query(`
			SELECT id, title
			FROM support_ticket
			WHERE user_ticket_id = $1::int
		`, userTicket.id),
		userTicket.type_identifier === types.listingComment && userTicket.reference_id ? db.query(`
			SELECT listing_id
			FROM listing_comment
			WHERE id = $1::int
		`, userTicket.reference_id) : null,
		[types.shopServiceName, types.shopServiceDescription].includes(userTicket.type_identifier) && userTicket.reference_id ? db.query(`
			SELECT shop_id
			FROM shop_service
			WHERE id = $1
		`, userTicket.reference_id) : null,
		[types.shopRoleName, types.shopRoleDescription].includes(userTicket.type_identifier) && userTicket.reference_id ? db.query(`
			SELECT shop_id
			FROM shop_role
			WHERE id = $1
		`, userTicket.reference_id) : null,
		this.query('v1/notification/destroy', {
			id: userTicket.id,
			type: notificationTypes.modminUTPost,
		}),
		this.query('v1/notification/destroy', {
			id: userTicket.id,
			type: notificationTypes.modminUTDiscussion,
		}),
	]);

	let info = '';

	const staffIdentifiers = constants.staffIdentifiers;

	if ([
		staffIdentifiers.admin,
		staffIdentifiers.mod,
		staffIdentifiers.researcher,
		staffIdentifiers.dev,
		staffIdentifiers.scout,
		staffIdentifiers.owner,
		staffIdentifiers.devTL,
		staffIdentifiers.researcherTL,
		staffIdentifiers.exStaff,
	].includes(violator.group.identifier))
	{
		info += 'The user is a current or previous staff member.';
	}

	if (ruleCounts.length > 0)
	{
		info = checkAddToInfo(info);

		info += `The user has violated the following rules (${totalRuleCounts.count} total):`;

		ruleCounts.map((ruleCount: any) =>
		{
			if (ruleCount.name)
			{
				info += `
- "${ruleCount.name}" ${ruleCount.count} times`;
			}
			else
			{
				info += `
- "${ruleCount.category_id}.${ruleCount.number}" ${ruleCount.count} times`;
			}
		});
	}

	if (previousDenied.length > 0)
	{
		info = checkAddToInfo(info);

		info += 'This content has previously been denied a UT.';
	}

	if (supportTicketsCount.count > 0)
	{
		info = checkAddToInfo(info);

		info += `This user has ${supportTicketsCount.count} support tickets.`;
	}

	const [submitter, messagesList] = await Promise.all([
		this.query('v1/user_lite', { id: firstUserViolation.submitter_id }),
		Promise.all(messages.map(async (message: any) =>
		{
			return {
				id: message.id,
				user: await this.query('v1/user_lite', { id: message.user_id }),
				formattedDate: dateUtils.formatDateTime(message.created),
				message: message.message,
				staffOnly: message.staff_only,
				format: message.message_format,
			};
		})),
	]);

	let parentId = userTicket.parent_id;

	if (node && node[0])
	{
		parentId = userTicket.type_identifier === types.post ? node[0].parent_node_id : node[0].node_id;
	}
	else if (listingComment && listingComment[0])
	{
		parentId = listingComment[0].listing_id;
	}
	else if (serviceShop && serviceShop[0])
	{
		parentId = serviceShop[0].shop_id;
	}
	else if (roleShop && roleShop[0])
	{
		parentId = roleShop[0].shop_id;
	}

	return {
		id: userTicket.id,
		assignee: assignee,
		status: userTicket.status,
		formattedLastUpdated: dateUtils.formatDateTime(userTicket.last_updated),
		rule: rule ? `${rule[0].category_id}.${rule[0].number} - ${rule[0].name ? rule[0].name : rule[0].description}` : null,
		violation: ruleViolation ? `${ruleViolation[0].severity_id ? `${ruleViolation[0].severity_id} ` : ''}${ruleViolation[0].violation}` : null,
		formattedClosed: userTicket.closed ? dateUtils.formatDateTime(userTicket.closed) : null,
		formattedCreated: dateUtils.formatDateTime(firstUserViolation.submitted),
		reportedUsers: userViolations.map((uv: any) =>
		{
			return {
				...uv,
				formattedSubmitted: dateUtils.formatDateTime(uv.submitted),
			};
		}),
		denyReason: userTicket.deny_reason,
		violator: violator,
		type: {
			identifier: userTicket.type_identifier,
			description: userTicket.type_description,
		},
		submitter: submitter,
		reference: {
			id: userTicket.reference_id,
			url: userTicket.reference_url,
			text: userTicket.reference_text,
			format: userTicket.reference_format,
			parentId: parentId,
			boardId: node && node[0] && userTicket.type_identifier === types.thread ? node[0].parent_node_id : null,
		},
		updatedContent: userTicket.updated_text,
		action: {
			name: userTicket.action_name,
			identifier: userTicket.action_identifier,
		},
		messages: messagesList,
		info: info,
		ban: utBan ? utBan[0] : null,
		currentBan: currentBan,
		supportTickets: supportTickets.map((st: any) =>
		{
			return {
				id: st.id,
				title: st.title,
			};
		}),
	};
}

// Helper function for adding to info
function checkAddToInfo(info: string): string
{
	if (utils.realStringLength(info) > 0)
	{
		info += `
`;
	}

	return info;
}

user_ticket.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type userTicketProps = {
	id: number
};

export default user_ticket;
