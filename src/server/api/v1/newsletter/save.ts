import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType } from '@types';

async function save(this: APIThisType, { id, volume, issue, issueDate, fileId }: saveProps): Promise<{ id: number }>
{
	if (id > 0)
	{
		const [checkId] = await db.query(`
			SELECT issue, published
			FROM newsletter
			WHERE id = $1::int
		`, id);

		if (!checkId)
		{
			throw new UserError('no-such-newsletter');
		}

		if (checkId.published !== null)
		{
			throw new UserError('bad-format');
		}

		await db.transaction(async (query: db.QueryType) =>
		{
			let headerFileId = null;

			if (utils.realStringLength(fileId) > 0)
			{
				const [file] = await query(`
					INSERT INTO file (file_id, name, caption, sequence)
					VALUES ($1, $2, $2, 1)
					RETURNING id
				`, fileId, `Issue ${checkId.issue}`);

				headerFileId = file.id;
			}

			await query(`
				UPDATE newsletter
				SET volume = $2, issue = $3, header_file_id = $4, issue_date = $5
				WHERE id = $1::int
			`, id, volume, issue, headerFileId, issueDate);
		});
	}
	else
	{
		const [existingNewsletter] = await db.query(`
			SELECT id
			FROM newsletter
			WHERE issue = $1 AND volume = $2
		`, issue, volume);

		if (existingNewsletter)
		{
			throw new UserError('existing-newsletter');
		}

		const [newNewsletter] = await db.query(`
			INSERT INTO newsletter (volume, issue, issue_date)
			VALUES ($1, $2, $3)
			RETURNING id
		`, volume, issue, issueDate);

		id = newNewsletter.id;
	}

	ACCCache.deleteMatch(constants.cacheKeys.newsletter);

	return {
		id: id,
	};
}

save.permissions = [
	'modify-newsletter',
];

save.apiTypes = {
	id: {
		type: APITypes.number,
		default: 0,
	},
	volume: {
		type: APITypes.number,
		required: true,
	},
	issue: {
		type: APITypes.number,
		required: true,
	},
	issueDate: {
		type: APITypes.date,
		default: '',
	},
	fileId: {
		type: APITypes.string,
		default: '',
		nullable: true,
	},
};

type saveProps = {
	id: number
	volume: number
	issue: number
	issueDate: string
	fileId: string
};

export default save;
