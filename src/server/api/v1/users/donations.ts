import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants } from '@utils';
import { APIThisType, UserDonationsType } from '@types';

async function donations(this: APIThisType, { id }: donationsType): Promise<UserDonationsType>
{
	const currentUser = this.userId === id;
	let viewProfiles = true, accForumsPerm = true;

	if (!currentUser)
	{
		[viewProfiles, accForumsPerm] = await Promise.all([
			this.query('v1/permission', { permission: 'view-profiles' }),
			this.query('v1/node/permission', { permission: 'read', nodeId: constants.boardIds.accForums }),
		]);

		if (!(viewProfiles || accForumsPerm))
		{
			throw new UserError('permission');
		}
	}

	const [
		[donations], [perks], [monthlyPerks],
	] = await Promise.all([
		db.query(`
			SELECT COALESCE(sum(donation), 0) AS donations
			FROM user_donation
			WHERE user_id = $1::int
		`, id),
		db.query(`
			SELECT COALESCE(sum(donation), 0) AS donations
			FROM user_donation
			WHERE user_id = $1::int AND donated >= now() - interval '1' year
		`, id),
		db.query(`
			SELECT COALESCE(sum(donation), 0) AS donations
			FROM user_donation
			WHERE user_donation.user_id = $1::int AND donated >= now() - interval '32' day AND monthly = true
		`, id),
	]);

	return <UserDonationsType>{
		id: id,
		donations: viewProfiles ? Number(donations.donations) : 0,
		perks: viewProfiles || accForumsPerm ? Number(perks.donations) : 0,
		monthlyPerks: viewProfiles ? Number(monthlyPerks.donations) : 0,
	};
}

donations.apiTypes = {
	id: {
		type: APITypes.userId,
		default: true,
	},
};

type donationsType = {
	id: number
};

export default donations;
