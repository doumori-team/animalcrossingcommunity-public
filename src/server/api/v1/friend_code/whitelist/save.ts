import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { APIThisType, SuccessType, UserLiteType } from '@types';

async function save(this: APIThisType, { whiteListUser, action }: saveProps): Promise<SuccessType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'use-friend-codes' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	await this.query('v1/user_lite', { id: this.userId });

	const userWhiteList: UserLiteType = await this.query('v1/user_lite', { username: whiteListUser });

	if (userWhiteList.id === this.userId)
	{
		throw new UserError('bad-format');
	}

	const successImage = `${constants.AWS_URL}/images/icons/icon_check.png`;

	// Check if user already has whitelisted user
	await db.transaction(async (query: any) =>
	{
		const [checkId] = await query(`
			SELECT id
			FROM friend_code_whitelist
			WHERE user_id = $1::int AND whitelist_user_id = $2::int
		`, this.userId, userWhiteList.id);

		// Perform queries
		if (checkId)
		{
			if (action === 'remove')
			{
				await query(`
					DELETE FROM friend_code_whitelist
					WHERE id = $1::int
				`, checkId.id);
			}

			return {
				_successImage: successImage,
			};
		}
		else if (action === 'remove')
		{
			return true;
		}

		await Promise.all([
			query(`
				INSERT INTO friend_code_whitelist (user_id, whitelist_user_id)
				VALUES ($1::int, $2::int)
			`, this.userId, userWhiteList.id),
			query(`
				DELETE FROM wifi_rating_whitelist
				WHERE (user_id = $1::int AND whitelist_user_id = $2::int) OR (user_id = $2::int AND whitelist_user_id = $1::int)
			`, this.userId, userWhiteList.id),
		]);
	});

	return {
		_successImage: successImage,
	};
}

save.apiTypes = {
	whiteListUser: {
		type: APITypes.string,
		default: '',
		required: true,
	},
	action: {
		type: APITypes.string,
		includes: ['add', 'remove'],
		required: true,
	},
};

type saveProps = {
	whiteListUser: string
	action: 'add' | 'remove'
};

export default save;
