import * as db from '@db';
import { UserError } from '@errors';
import { constants, utils, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, UserType, UserDonationsType, MarkupStyleType } from '@types';

async function save(this: APIThisType, { id, location = null, name, bio, format, fileIds, fileNames,
	fileWidths, fileHeights, fileCaptions }: saveProps): Promise<{ id: number }>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-profiles' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	if (id !== this.userId)
	{
		throw new UserError('permission');
	}

	const user: UserType = await this.query('v1/user', { id: this.userId });

	const userDonations: UserDonationsType = await this.query('v1/users/donations', { id: this.userId });

	if (
		userDonations.monthlyPerks < 10 && utils.realStringLength(bio) > constants.max.bio3 ||
		userDonations.monthlyPerks < 5 && utils.realStringLength(bio) > constants.max.bio2 ||
		userDonations.perks < 20 && utils.realStringLength(bio) > constants.max.bio1
	)
	{
		throw new UserError('bad-format');
	}

	if (fileIds.length != fileNames.length || fileIds.length != fileWidths.length || fileIds.length != fileHeights.length || fileIds.length != fileCaptions.length)
	{
		throw new UserError('bad-format');
	}

	if (fileIds.length > constants.max.imagesProfile)
	{
		throw new UserError('too-many-files');
	}

	fileCaptions.map((caption: string) =>
	{
		if (utils.realStringLength(caption) > constants.max.imageCaption)
		{
			throw new UserError('bad-format');
		}
	});

	if (fileIds.length > 0)
	{
		if (dateUtils.isNewMember(user.signupDate))
		{
			throw new UserError('permission');
		}
	}

	await db.query(`
		UPDATE users
		SET
			bio_location = $2::text,
			name = $3::text,
			bio = $4::text,
			bio_format = $5
		WHERE id = $1::int
		RETURNING 1
	`, id, location, name, bio, format);

	await db.query(`
		DELETE FROM file
		WHERE id IN (
			SELECT user_file.file_id
			FROM user_file
			WHERE user_file.user_id = $1::int
		)
	`, user.id);

	if (fileIds.length > 0)
	{
		await Promise.all(fileIds.map(async (id: any, index: any) =>
		{
			const [file] = await db.query(`
				INSERT INTO file (file_id, name, width, height, caption, sequence)
				VALUES ($1, $2, $3, $4, $5, $6)
				RETURNING id
			`, id, fileNames[index], fileWidths[index], fileHeights[index], fileCaptions[index], index);

			await db.query(`
				INSERT INTO user_file (user_id, file_id)
				VALUES ($1, $2)
			`, user.id, file.id);
		}));
	}

	return {
		id: id,
	};
}

save.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
	location: {
		type: APITypes.string,
		length: constants.max.location,
		profanity: true,
		nullable: true,
	},
	name: {
		type: APITypes.string,
		default: '',
		length: constants.max.name,
		profanity: true,
	},
	bio: {
		type: APITypes.string,
		default: '',
		length: constants.max.bio4,
		profanity: true,
	},
	format: {
		type: APITypes.string,
		default: 'markdown',
		includes: ['markdown', 'bbcode', 'plaintext'],
	},
	fileIds: {
		type: APITypes.array,
	},
	fileNames: {
		type: APITypes.array,
	},
	fileWidths: {
		type: APITypes.array,
	},
	fileHeights: {
		type: APITypes.array,
	},
	fileCaptions: {
		type: APITypes.array,
	},
};

type saveProps = {
	id: number
	location: string | null
	name: string
	bio: string
	format: MarkupStyleType
	fileIds: any[]
	fileNames: any[]
	fileWidths: any[]
	fileHeights: any[]
	fileCaptions: any[]
};

export default save;
