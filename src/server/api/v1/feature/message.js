import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';

async function message({id, message, staffOnly, format})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	const [feature] = await db.query(`
		SELECT read_only, staff_only
		FROM feature
		WHERE id = $1::int
	`, id);

	if (!feature)
	{
		throw new UserError('no-such-feature');
	}

	const advancedPermission = await this.query('v1/permission', {permission: 'advanced-features'});

	if (!advancedPermission && (feature.read_only || feature.staff_only))
	{
		throw new UserError('permission');
	}

	if (!advancedPermission)
	{
		staffOnly = false;
	}

	// Perform queries
	const [featureMessage] = await db.query(`
		INSERT INTO feature_message (user_id, feature_id, message, staff_only, message_format) VALUES
		($1::int, $2::int, $3, $4, $5)
		RETURNING id
	`, this.userId, id, message, staffOnly, format);

	this.query('v1/notification/create', {
		id: featureMessage.id,
		type: constants.notification.types.featurePost
	});
}

message.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	message: {
		type: APITypes.string,
		default: '',
		required: true,
		profanity: true,
	},
	staffOnly: {
		type: APITypes.boolean,
		default: 'false',
	},
	format: {
		type: APITypes.string,
		default: '',
		includes: constants.formatOptions,
		required: true,
	},
}

export default message;