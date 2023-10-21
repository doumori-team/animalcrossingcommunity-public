import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { dateUtils, constants } from '@utils';

async function feature({id})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [[feature], user, advancedPermission] = await Promise.all([
		db.query(`
			SELECT
				feature.id,
				feature.title,
				feature.description,
				feature.status_id,
				feature_status.name	AS status_name,
				feature.category_id,
				COALESCE(feature_category.name, 'Other') AS category_name,
				feature.is_bug,
				feature.staff_only,
				feature.read_only,
				feature.created_user_id,
				feature.created,
				feature.format,
				feature.staff_description,
				feature.staff_description_format
			FROM feature
			JOIN feature_status ON feature.status_id = feature_status.id
			LEFT JOIN feature_category ON feature.category_id = feature_category.id
			WHERE feature.id = $1::int
		`, id),
		this.query('v1/user_lite', {id: this.userId}),
		this.query('v1/permission', {permission: 'advanced-features'}),
	]);

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	if (!feature)
	{
		throw new UserError('no-such-feature');
	}

	if (!advancedPermission && feature.staff_only)
	{
		throw new UserError('permission');
	}

	const [messages, createdUser, [followed], users] = await Promise.all([
		db.query(`
			SELECT id, user_id, message, created, message_format, staff_only
			FROM feature_message
			WHERE feature_id = $1::int
			ORDER BY created ASC
		`, feature.id),
		feature.created_user_id ? this.query('v1/user_lite', {id: feature.created_user_id}) : null,
		db.query(`
			SELECT feature_id
			FROM followed_feature
			WHERE feature_id = $1::int AND user_id = $2::int
		`, id, this.userId),
		db.query(`
			SELECT user_id
			FROM feature_assigned_user
			WHERE feature_id = $1
		`, feature.id),
		this.query('v1/notification/destroy', {
			id: feature.id,
			type: constants.notification.types.followFeature
		}),
		this.query('v1/notification/destroy', {
			id: feature.id,
			type: constants.notification.types.feature
		}),
		this.query('v1/notification/destroy', {
			id: feature.id,
			type: constants.notification.types.featurePost
		}),
	]);

	return {
		id: feature.id,
		title: feature.title,
		description: feature.description,
		format: feature.format,
		statusId: feature.status_id,
		status: feature.status_name,
		categoryId: feature.category_id,
		category: feature.category_name,
		isBug: feature.is_bug,
		staffOnly: advancedPermission ? feature.staff_only : false,
		readOnly: feature.read_only,
		user: createdUser,
		formattedCreated: dateUtils.formatDateTime(feature.created),
		messages: await Promise.all(messages.filter(m => advancedPermission || !m.staff_only).map(async(message) => {
			return {
				id: message.id,
				user: await this.query('v1/user_lite', {id: message.user_id}),
				formattedDate: dateUtils.formatDateTime(message.created),
				message: message.message,
				staffOnly: message.staff_only,
				format: message.message_format,
			};
		})),
		followed: followed ? true : false,
		staffDescription: advancedPermission ? feature.staff_description : null,
		staffDescriptionFormat: advancedPermission ? feature.staff_description_format : null,
		assignedUsers: advancedPermission ? await Promise.all(
			users.map(async user => await this.query('v1/user_lite', {id: user.user_id})),
		) : [],
		claimed: users.some(u => u.user_id === this.userId),
	};
}

feature.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default feature;