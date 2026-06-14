import * as db from '@db';
import * as APITypes from '@apiTypes';
import { APIThisType, BadgeType } from '@types';

async function badges(this: APIThisType, { id }: badgesProps): Promise<BadgeType[]>
{
	return await db.query(`
		SELECT badge.id, badge.name, user_badge.earned
		FROM badge
		JOIN user_badge ON (user_badge.badge_id = badge.id)
		WHERE user_badge.user_id = $1
		ORDER BY user_badge.earned ASC
	`, id);
}

badges.permissions = [
	'view-profiles',
];

badges.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
};

type badgesProps = {
	id: number
};

export default badges;
