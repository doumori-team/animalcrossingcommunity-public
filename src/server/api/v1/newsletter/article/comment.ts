import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, MarkupStyleType } from '@types';

async function comment(this: APIThisType, { id, comment, format }: commentProps): Promise<void>
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

	if (article.published === null)
	{
		throw new UserError('bad-format');
	}

	// Perform queries
	await db.query(`
		INSERT INTO newsletter_article_comment (newsletter_article_id, comment, format, user_id)
		VALUES ($1, $2, $3, $4)
	`, id, comment, format, this.userId);
}

comment.permissions = [
	'view-newsletter',
	'userId',
];

comment.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	comment: {
		type: APITypes.string,
		default: '',
		required: true,
		length: constants.max.comment,
		profanity: true,
	},
	format: {
		type: APITypes.string,
		default: '',
		includes: ['markdown', 'bbcode', 'plaintext'],
		required: true,
	},
};

type commentProps = {
	id: number
	comment: string
	format: MarkupStyleType
};

export default comment;
