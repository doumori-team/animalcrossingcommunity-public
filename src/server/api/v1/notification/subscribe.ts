import * as db from '@db';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';
import { constants } from '@utils';

async function subscribe(this: APIThisType, { subscription, desktop }: subscribeProps): Promise<void>
{
	await db.query(`
		INSERT INTO user_subscription (user_id, subscription, desktop) VALUES
		($1, $2, $3)
	`, this.userId, subscription, desktop);

	this.query('v1/users/badge/check', { badgeId: constants.badges.pushnotifications });
}

subscribe.permissions = [
	'userId',
];

subscribe.apiTypes = {
	subscription: {
		type: APITypes.string,
		default: '',
		required: true,
	},
	// desktop is real boolean
};

type subscribeProps = {
	subscription: string
	desktop: boolean
};

export default subscribe;
