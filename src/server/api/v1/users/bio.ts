import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';
import { constants } from '@utils';
import { APIThisType, UserBioType } from '@types';

/*
 * Lists the information about a user that should appear in the "Bio" tab of their profile.
 */
async function bio(this: APIThisType, { id }: bioProps): Promise<UserBioType>
{
	const permission: boolean = await this.query('v1/permission', { permission: 'view-profiles' });

	if (!permission)
	{
		throw new UserError('permission');
	}

	// Run query
	const [result] = await db.query(`
		SELECT
			bio_location AS location,
			name,
			bio,
			bio_format AS format,
			show_email
		FROM users
		WHERE id = $1::int
	`, id);

	if (!result)
	{
		throw new UserError('no-such-user');
	}

	let email = null;

	if (result.show_email)
	{
		const userData = await accounts.getUserData(id);

		email = userData.email;
	}

	const userFiles = await db.query(`
		SELECT file.id, file.file_id, file.name, file.width, file.height, file.caption
		FROM user_file
		JOIN file ON (user_file.file_id = file.id)
		WHERE user_file.user_id = $1::int
		ORDER BY file.sequence ASC
	`, id);

	if (id === this.userId)
	{
		this.query('v1/notification/destroy', {
			id: id,
			type: constants.notification.types.giftDonation,
		});
	}

	return <UserBioType>{
		location: result.location,
		name: result.name,
		bio: result.bio,
		format: result.format,
		email: email,
		files: userFiles ? userFiles.map((file: any) =>
		{
			return {
				id: file.id,
				fileId: file.file_id,
				name: file.name,
				width: file.width,
				height: file.height,
				caption: file.caption,
			};
		}) : [],
	};
}

bio.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
};

type bioProps = {
	id: number
};

export default bio;
