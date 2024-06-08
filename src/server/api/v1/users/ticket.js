import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';

/*
 * Grabs user-friendly information on a user ticket.
 */
async function ticket({id})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [userTicket] = await db.query(`
		SELECT
			user_ticket.id,
			user_ticket.rule_id,
			user_ticket.rule_id,
			user_ticket.rule_violation_id,
			user_ticket.closed,
			user_ticket_type.description AS type_description,
			user_ticket_type.identifier AS type_identifier,
			user_ticket.updated_text,
			user_ticket_action.name AS action_name,
			user_ticket_action.identifier AS action_identifier,
			user_ticket.reference_id,
			user_ticket.reference_text,
			user_ticket.reference_url,
			user_ticket.violator_id,
			user_ticket.reference_format
		FROM user_ticket
		JOIN user_ticket_type ON (user_ticket_type.id = user_ticket.type_id)
		LEFT JOIN user_ticket_action ON (user_ticket.action_id = user_ticket_action.id)
		WHERE user_ticket.id = $1::int
	`, id);

	if (!userTicket)
	{
		throw new UserError('no-such-user-ticket');
	}

	// Only yourself AND closed ones
	if (userTicket.violator_id !== this.userId || (userTicket.rule_violation_id === null && userTicket.rule_id === null))
	{
		throw new UserError('permission');
	}

	const types = constants.userTicket.types

	const [ruleViolation, rule, messages, node, user, messageUser, [banLength]] = await Promise.all([
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
			SELECT id, user_id, message, created, message_format
			FROM user_ticket_message
			WHERE user_ticket_id = $1::int AND staff_only = false
		`, userTicket.id),
		[types.post, types.thread].includes(userTicket.type_identifier) && userTicket.reference_id ? db.query(`
			SELECT node.parent_node_id, node_revision.node_id
			FROM node_revision
			JOIN node ON (node_revision.node_id = node.id)
			WHERE node_revision.id = $1::int
		`, userTicket.reference_id) : null,
		this.query('v1/user', {id: userTicket.violator_id}),
		this.query('v1/user_lite', {id: this.userId}),
		db.query(`
			SELECT ban_length.description
			FROM user_ban_length
			JOIN ban_length ON (ban_length.id = user_ban_length.ban_length_id)
			WHERE user_ticket_id = $1::int
		`, userTicket.id),
		this.query('v1/notification/destroy', {
			id: userTicket.id,
			type: constants.notification.types.ticketProcessed
		}),
		this.query('v1/notification/destroy', {
			id: userTicket.id,
			type: constants.notification.types.modminUTPost
		}),
	]);

	return {
		id: userTicket.id,
		rule: rule ? `${rule[0].category_id}.${rule[0].number} - ${rule[0].name ? rule[0].name : rule[0].description}` : null,
		violation: ruleViolation ? `${ruleViolation[0].severity_id ? `${ruleViolation[0].severity_id} ` : ''}${ruleViolation[0].violation}` : null,
		formattedClosed: userTicket.closed ? dateUtils.formatDateTime(userTicket.closed) : null,
		violator: user,
		type: {
			identifier: userTicket.type_identifier,
			description: userTicket.type_description,
		},
		reference: {
			id: userTicket.reference_id,
			url: userTicket.reference_url,
			text: userTicket.reference_text,
			format: userTicket.reference_format,
			parentId: node && node[0] ? (userTicket.type_identifier === types.post ? node[0].parent_node_id : node[0].node_id) : null,
		},
		updatedContent: userTicket.updated_text,
		action: {
			name: userTicket.action_name,
			identifier: userTicket.action_identifier,
		},
		messages: messages.map(message => {
			return {
				id: message.id,
				user: message.user_id === this.userId ? messageUser : null,
				formattedDate: dateUtils.formatDateTime(message.created),
				message: message.message,
				format: message.message_format,
			};
		}),
		banLength: banLength ? banLength.description : 'Not Banned',
	};
}

ticket.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default ticket;
