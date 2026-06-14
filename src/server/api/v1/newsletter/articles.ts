import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, NewsletterArticleType } from '@types';
import { constants } from '@utils';

async function articles(this: APIThisType, { id }: articlesProps): Promise<NewsletterArticleType[]>
{
	const [[newsletter], modifyNewsletterPerm]: [[{
		published: Date | null
	} | undefined], boolean] = await Promise.all([
		db.cacheQuery(constants.cacheKeys.newsletter, `
			SELECT
				newsletter.published
			FROM newsletter
			WHERE newsletter.id = $1::int
		`, id),
		this.query('v1/permission', { permission: 'modify-newsletter' }),
	]);

	if (!newsletter)
	{
		throw new UserError('no-such-newsletter');
	}

	if (!modifyNewsletterPerm && !newsletter.published)
	{
		throw new UserError('permission');
	}

	const articles = await db.cacheQuery(constants.cacheKeys.newsletter, `
		SELECT
			id
		FROM newsletter_article
		WHERE newsletter_article.newsletter_id = $1::int
		ORDER BY sort_order ASC
	`, id);

	return await Promise.all(articles.map(async article =>
	{
		return this.query('v1/newsletter/article', { id: article.id });
	}));
}

articles.permissions = [
	'view-newsletter',
];

articles.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type articlesProps = {
	id: number
};

export default articles;
