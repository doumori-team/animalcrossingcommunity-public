import * as db from '@db';
import { APIThisType, ProfanityWordType } from '@types';

async function word(this: APIThisType): Promise<ProfanityWordType[]>
{
	const filteredWords: { id: number, word: string, active: boolean, node_id: number | null }[] = await db.query(`
		SELECT id, word, active, node_id
		FROM filter_word
		ORDER BY word ASC
	`);

	return filteredWords.map(fw =>
	{
		return {
			id: fw.id,
			word: fw.word,
			active: fw.active,
			nodeId: fw.node_id,
		};
	});
}

word.permissions = [
	'profanity-admin',
];

export default word;
