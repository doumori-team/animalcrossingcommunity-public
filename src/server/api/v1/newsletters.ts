import * as db from '@db';
import { constants } from '@utils';
import { APIThisType, NewsletterType } from '@types';

async function newsletters(this: APIThisType): Promise<NewsletterType[]>
{
	const [newsletters, modifyNewsletterPerm]: [{
		id: number
		published: boolean | null
	}[], boolean] = await Promise.all([
		db.cacheQuery(constants.cacheKeys.newsletter, `
			SELECT
				id,
				published
			FROM newsletter
			ORDER BY issue_date DESC
		`),
		this.query('v1/permission', { permission: 'modify-newsletter' }),
	]);

	return await Promise.all(newsletters.filter(n => modifyNewsletterPerm || !modifyNewsletterPerm && n.published !== null).map(async newsletter =>
	{
		return this.query('v1/newsletter', { id: newsletter.id });
	}));
}

newsletters.permissions = [
	'view-newsletter',
];

export default newsletters;
