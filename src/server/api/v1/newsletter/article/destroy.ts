import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { constants } from '@utils';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, { id }: destroyProps): Promise<void>
{
	const [article] = await db.query(`
		SELECT newsletter.published
		FROM newsletter_article
		JOIN newsletter ON (newsletter.id = newsletter_article.newsletter_id)
		WHERE newsletter_article.id = $1::int
	`, id);

	if (!article)
	{
		throw new UserError('no-such-newsletter-article');
	}

	if (article.published !== null)
	{
		throw new UserError('bad-format');
	}

	await db.query(`
		DELETE FROM newsletter_article
		WHERE id = $1::int
	`, id);

	ACCCache.deleteMatch(constants.cacheKeys.newsletter);
}

destroy.permissions = [
	'modify-newsletter',
];

destroy.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type destroyProps = {
	id: number
};

export default destroy;
