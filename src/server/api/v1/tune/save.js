import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';

async function save({townId, id, tuneName, noteId0, noteId1, noteId2, noteId3,
	noteId4, noteId5, noteId6, noteId7, noteId8, noteId9, noteId10, noteId11,
	noteId12, noteId13, noteId14, noteId15})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-tunes'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	if (townId > 0)
	{
		const [town] = await db.query(`
			SELECT town.user_id
			FROM town
			WHERE town.id = $1::int
		`, townId);

		if (town.user_id != this.userId)
		{
			throw new UserError('permission');
		}
	}

	let notes = [noteId0, noteId1, noteId2, noteId3, noteId4, noteId5, noteId6, noteId7,
		noteId8, noteId9, noteId10, noteId11, noteId12, noteId13, noteId14, noteId15];

	const gameNotes = utils.getTownTunes();

	notes = notes.map((id) =>
	{
		if (isNaN(id) || !gameNotes[Number(id)])
		{
			throw new UserError('bad-format');
		}

		return Number(id).toString(16).padStart(4, '0');
	});

	if (notes === undefined || notes.length !== 16)
	{
		throw new UserError('bad-format');
	}

	// Perform query
	if (id > 0)
	{
		const [tune] = await db.query(`
			SELECT town_tune.creator_id
			FROM town_tune
			WHERE town_tune.id = $1::int
		`, id);

		if (!tune)
		{
			throw new UserError('no-such-tune');
		}

		if (tune.creator_id != this.userId)
		{
			throw new UserError('permission');
		}

		await db.query(`
			UPDATE town_tune
			SET name = $1, notes = $3
			WHERE id = $2::int
		`, tuneName, id, notes.join(''));
	}
	else
	{
		[id] = await db.query(`
			INSERT INTO town_tune (name, creator_id, notes)
			VALUES ($1, $2::int, $3)
			RETURNING id
		`, tuneName, this.userId, notes.join(''));

		id = id.id;
	}

	if (townId > 0)
	{
		await db.query(`
			UPDATE town
			SET town_tune_id = $1::int, town_tune_notes = $3, town_tune_creator_id = $4, town_tune_name = $5
			WHERE id = $2::int
		`, id, townId, notes.join(''), this.userId, tuneName);
	}

	ACCCache.deleteMatch(constants.cacheKeys.tunes);

	return id;
}

save.apiTypes = {
	townId: {
		type: APITypes.townId,
		nullable: true,
	},
	id: {
		type: APITypes.number,
		nullable: true,
	},
	tuneName: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-town-tune-name',
		length: constants.max.tuneName,
		profanity: true,
	},
	// nodeId0-15 is manually checked more easily above
}

export default save;