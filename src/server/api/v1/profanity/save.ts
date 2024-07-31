import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

async function save(this: APIThisType, {id, word, activate}: saveProps) : Promise<SuccessType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'profanity-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	let filteredWord;

	if (id > 0)
	{
		[filteredWord] = await db.query(`
			SELECT id, node_id, word, active
			FROM filter_word
			WHERE id = $1
		`, id);

		if (!filteredWord)
		{
			throw new UserError('no-such-word');
		}
	}

	// Confirm word doesn't already exist
	const [duplicate] = await db.query(`
		SELECT id
		FROM filter_word
		WHERE word = $1 AND id != $2::int
	`, word, id);

	if (duplicate)
	{
		throw new UserError('duplicate-word');
	}

	if (id > 0)
	{
		if (activate !== filteredWord.active)
		{
			const permissionGranted:boolean = await this.query('v1/permission', {permission: 'activate-profanity-words'});

			if (!permissionGranted)
			{
				activate = filteredWord.active;
			}
		}

		let nodeId = filteredWord.node_id;
		let content = '';

		if (word != filteredWord.word)
		{
			content += `**${filteredWord.word}** updated to **${word}**.`;
		}

		if (activate !== filteredWord.active)
		{
			if (utils.realStringLength(content) !== 0)
			{
				content += `
`;
			}

			content += `**${word}** ${activate ? 'activated' : 'deactivated'} in filter.`;
		}

		if (utils.realStringLength(content) > 0)
		{
			if (!filteredWord.node_id)
			{
				nodeId = await createThread.bind(this)(word, content, activate);
			}
			else
			{
				await db.query(`
					INSERT INTO node_revision (node_id, reviser_id, title)
					VALUES ($1::int, $2::int, $3::text)
				`, nodeId, this.userId, `${word} (${activate ? 'Active' : 'Inactive'})`);

				const [message] = await db.query(`
					INSERT INTO node (parent_node_id, user_id, type)
					VALUES ($1::int, $2::int, $3::node_type)
					RETURNING id
				`, nodeId, this.userId, 'post');

				await db.query(`
					INSERT INTO node_revision (node_id, reviser_id, content, content_format)
					VALUES ($1::int, $2::int, $3::text, $4::node_content_format)
				`, message.id, this.userId, content, 'markdown');

				await this.query('v1/notification/create', {id: message.id, type: constants.notification.types.FT});
			}

			await db.query(`
				UPDATE filter_word
				SET word = $2, node_id = $3, active = $4
				WHERE id = $1::int
			`, id, word, nodeId, activate);
		}
	}
	else
	{
		const nodeId = await createThread.bind(this)(
			word,
			`Suggestion for new filtered word: **${word}**.`,
			false
		);

		await db.query(`
			INSERT INTO filter_word (word, active, node_id) VALUES
			($1, false, $2)
		`, word, nodeId);
	}

	return {
		_success: 'The filtered word has been updated.',
		_callbackFirst: true,
	};
}

/*
 * Create thread for the profanity word.
 */
async function createThread(this: APIThisType, word:string, content:string, active:boolean) : Promise<number>
{
	const [thread] = await db.query(`
		INSERT INTO node (parent_node_id, user_id, type)
		VALUES ($1::int, $2::int, $3::node_type)
		RETURNING id
	`, constants.boardIds.profanity, this.userId, 'thread');

	await db.query(`
		INSERT INTO node_revision (node_id, reviser_id, title)
		VALUES ($1::int, $2::int, $3::text)
	`, thread.id, this.userId, `${word} (${active ? 'Active' : 'Inactive'})`);

	const [message] = await db.query(`
		INSERT INTO node (parent_node_id, user_id, type)
		VALUES ($1::int, $2::int, $3::node_type)
		RETURNING id
	`, thread.id, this.userId, 'post');

	await db.query(`
		INSERT INTO node_revision (node_id, reviser_id, content, content_format)
		VALUES ($1::int, $2::int, $3::text, $4::node_content_format)
	`, message.id, this.userId, content, 'markdown');

	await this.query('v1/notification/create', {id: thread.id, type: constants.notification.types.FB});

	await db.updateThreadStats(thread.id);

	return thread.id;
}

save.apiTypes = {
	id: {
		type: APITypes.number,
		default: 0,
	},
	word: {
		type: APITypes.string,
		default: '',
		required: true,
		length: constants.max.profanityWord,
	},
	activate: {
		type: APITypes.boolean,
		default: 'false',
	}
}

type saveProps = {
	id: number
	word: string
	activate: boolean
}

export default save;