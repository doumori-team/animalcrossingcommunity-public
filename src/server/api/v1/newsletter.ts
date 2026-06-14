import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, NewsletterType } from '@types';

async function newsletter(this: APIThisType, { id }: newsletterProps): Promise<NewsletterType>
{
	const [[newsletter], modifyNewsletterPerm]: [[{
		id: number
		issue: number
		volume: number
		issue_date: Date
		pdf_only: boolean
		pdf_file_id: string | null
		header_file_id: string | null
		published: Date | null
	} | undefined], boolean] = await Promise.all([
		db.cacheQuery(constants.cacheKeys.newsletter, `
			SELECT
				newsletter.id,
				newsletter.issue,
				newsletter.volume,
				newsletter.issue_date,
				pdf_file.file_id AS pdf_file_id,
				header_file.file_id AS header_file_id,
				newsletter.published
			FROM newsletter
			LEFT JOIN file AS pdf_file ON (pdf_file.id = newsletter.pdf_file_id)
			LEFT JOIN file AS header_file ON (header_file.id = newsletter.header_file_id)
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

	return {
		id: newsletter.id,
		issue: newsletter.issue,
		volume: newsletter.volume,
		issueDate: String(newsletter.issue_date),
		formattedIssueDate: dateUtils.formatDate4(newsletter.issue_date),
		pdfOnly: newsletter.pdf_file_id ? true : false,
		pdfDownload: newsletter.pdf_file_id ? `${constants.NEWSLETTER_FILE_DIR}${newsletter.pdf_file_id}` : null,
		header: newsletter.pdf_file_id ? `${constants.NEWSLETTER_IMAGE_FILE_DIR}${newsletter.header_file_id}` : `${constants.NEWSLETTER_IMAGE_FILE_DIR}${newsletter.issue}/${newsletter.header_file_id}`,
		published: newsletter.published !== null,
	};
}

newsletter.permissions = [
	'view-newsletter',
];

newsletter.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type newsletterProps = {
	id: number
};

export default newsletter;
