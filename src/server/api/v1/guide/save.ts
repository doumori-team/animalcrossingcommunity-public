import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType } from '@types';

async function save(this: APIThisType, { id, gameId, name, description, content }: saveProps): Promise<{ id: number }>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-guides' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	if (id > 0)
	{
		const [checkId] = await db.query(`
			SELECT id
			FROM guide
			WHERE id = $1::int
		`, id);

		if (!checkId)
		{
			throw new UserError('no-such-guide');
		}

		await db.query(`
			UPDATE guide
			SET updated_name = $2, updated_description = $3, updated_content = $4, last_updated = now(), updated_user_id = $5::int
			WHERE id = $1::int
		`, id, name, description, content, this.userId);
	}
	else
	{
		const [newGuide] = await db.query(`
			INSERT INTO guide (updated_name, game_id, updated_description, updated_content, updated_user_id)
			VALUES ($1, $2::int, $3, $4, $5::int)
			RETURNING id
		`, name, gameId, description, content, this.userId);

		id = newGuide.id;
	}

	ACCCache.deleteMatch(constants.cacheKeys.guides);
	ACCCache.deleteMatch(constants.cacheKeys.acGameGuide);

	return {
		id: id,
	};
}

save.apiTypes = {
	id: {
		type: APITypes.number,
		default: 0,
	},
	gameId: {
		type: APITypes.acgameId,
		required: true,
	},
	name: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-guide-name',
		length: constants.max.guideName,
		profanity: true,
	},
	description: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-guide-description',
		length: constants.max.guideDescription,
		profanity: true,
	},
	content: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-guide-content',
		length: constants.max.guideContent,
		profanity: true,
	},
};

type saveProps = {
	id: number
	gameId: number
	name: string
	description: string
	content: string
};

export default save;
