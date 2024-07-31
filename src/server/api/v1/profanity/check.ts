import * as db from '@db';
import { ProfanityError } from '@errors';
import { utils } from '@utils';
import { APIThisType } from '@types';

/*
 * Check whether given text contains a filtered word.
 */
export default async function check(this: APIThisType, {text}: checkProps) : Promise<void>
{
	if (text === null || utils.realStringLength(text) === 0)
	{
		return;
	}

	const words = await db.query(`
		SELECT word
		FROM filter_word
		WHERE active = true
	`);

	// strip of all punctuation first
	const removePunctuation = /[.,!;:–—?]/g;

	text = text.replaceAll(removePunctuation, '');

	const startsWith = '(^|\\s)';
	const endsWith = '(?=\\s|$)';

	const filteredWords = words.filter((fw:any) => {
		const noWildCardWord = fw.word.replaceAll('*', '');

		// checks for (example): hell, *hell, hell*, *hell*
		if (
			(fw.word.startsWith('*') && fw.word.endsWith('*') && text.match(RegExp(noWildCardWord, 'i'))) ||
			(fw.word.startsWith('*') && text.match(RegExp(`${noWildCardWord}${endsWith}`, 'i'))) ||
			(fw.word.endsWith('*') && text.match(RegExp(`${startsWith}${noWildCardWord}`, 'i'))) ||
			(!(fw.word.startsWith('*') || fw.word.endsWith('*')) && text.match(RegExp(`${startsWith}${noWildCardWord}${endsWith}`, 'i')))
		)
		{
			return fw;
		}
	});

	if (filteredWords.length > 0)
	{
		const uniqueWords = [...new Set(filteredWords.map((fw:any) => fw.word.replaceAll('*', '')))];
		throw new ProfanityError(uniqueWords.join(', '));
	}
}

type checkProps = {
	text: any
}