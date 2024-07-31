import * as db from '@db';
import { UserError } from '@errors';
import { APIThisType, ProfanityWordType } from '@types';

export default async function word(this: APIThisType) : Promise<ProfanityWordType[]>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'profanity-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const filteredWords = await db.query(`
		SELECT id, word, active, node_id
		FROM filter_word
		ORDER BY word ASC
	`);

	return filteredWords.map((fw:any) => {
		return {
			id: fw.id,
			word: fw.word,
			active: fw.active,
			nodeId: fw.node_id,
		};
	});
}