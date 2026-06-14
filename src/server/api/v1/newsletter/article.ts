import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, NewsletterArticleType } from '@types';

async function article(this: APIThisType, { id }: articleProps): Promise<NewsletterArticleType>
{
	const [[article], modifyNewsletterPerm]: [[{
		id: number
		newsletter_id: number
		type: NewsletterArticleType['type']
		title: string
		content: string
		published: Date | null
		issue: number
		sort_order: number
	} | undefined], boolean] = await Promise.all([
		db.cacheQuery(constants.cacheKeys.newsletter, `
			SELECT
				newsletter_article.id,
				newsletter_article.newsletter_id,
				newsletter_article.type,
				newsletter_article.title,
				newsletter_article.content,
				newsletter.published,
				newsletter.issue,
				newsletter_article.sort_order
			FROM newsletter_article
			JOIN newsletter ON (newsletter.id = newsletter_article.newsletter_id)
			WHERE newsletter_article.id = $1::int
		`, id),
		this.query('v1/permission', { permission: 'modify-newsletter' }),
	]);

	if (!article)
	{
		throw new UserError('no-such-newsletter-article');
	}

	if (!modifyNewsletterPerm && !article.published)
	{
		throw new UserError('permission');
	}

	const [questionOptions, silhouettes, comments] = await Promise.all([
		db.query(`
			SELECT
				newsletter_article_question.text AS question_text,
				newsletter_article_question_option.text AS option_text,
				newsletter_article_question_option.answer
			FROM newsletter_article_question_option
			JOIN newsletter_article_question ON (newsletter_article_question_option.newsletter_article_question_id = newsletter_article_question.id)
			WHERE newsletter_article_question.newsletter_article_id = $1::int
			ORDER BY newsletter_article_question.id ASC
		`, article.id),
		db.query(`
			SELECT
				silhouette_file.file_id AS silhouette_file_id,
				answer_file.file_id AS answer_file_id,
				newsletter_article_silhouette.answer,
				newsletter_article_silhouette.answer_additional
			FROM newsletter_article_silhouette
			LEFT JOIN file AS silhouette_file ON (silhouette_file.id = newsletter_article_silhouette.silhouette_file_id)
			LEFT JOIN file AS answer_file ON (answer_file.id = newsletter_article_silhouette.answer_file_id)
			WHERE newsletter_article_silhouette.newsletter_article_id = $1::int
			ORDER BY newsletter_article_silhouette.id ASC
		`, article.id),
		db.query(`
			SELECT
				newsletter_article_comment.id,
				newsletter_article_comment.comment,
				newsletter_article_comment.format,
				newsletter_article_comment.user_id,
				newsletter_article_comment.created,
				user_account_cache.username
			FROM newsletter_article_comment
			JOIN user_account_cache ON (user_account_cache.id = newsletter_article_comment.user_id)
			WHERE newsletter_article_comment.newsletter_article_id = $1::int
			ORDER BY newsletter_article_comment.created ASC
		`, article.id),
	]);

	const questionsMap = new Map();

	for (const row of questionOptions)
	{
		if (!questionsMap.has(row.question_text))
		{
			questionsMap.set(row.question_text, {
				text: row.question_text,
				options: [],
			});
		}

		questionsMap.get(row.question_text).options.push({
			text: row.option_text,
			answer: !!row.answer,
		});
	}

	const questions = Array.from(questionsMap.values()).map(q => ({
		...q,
		options: q.options.sort((a, b) => a.sortOrder - b.sortOrder),
	}));

	return {
		id: article.id,
		newsletterId: article.newsletter_id,
		type: article.type,
		title: article.title,
		content: article.content,
		issue: article.issue,
		sortOrder: article.sort_order,
		published: article.published !== null,
		questions: questions,
		silhouettes: silhouettes.map(s =>
		{
			return {
				answer: s.answer,
				answerAdditional: s.answer_additional,
				silhouetteFileId: s.silhouette_file_id,
				answerFileId: s.answer_file_id,
				silhouetteFile: `${constants.NEWSLETTER_IMAGE_FILE_DIR}${article.newsletter_id}/${s.silhouette_file_id}`,
				answerFile: `${constants.NEWSLETTER_IMAGE_FILE_DIR}${article.newsletter_id}/${s.answer_file_id}`,
			};
		}),
		comments: comments.map(comment =>
		{
			return {
				id: comment.id,
				user: {
					id: comment.user_id,
					username: comment.username,
				},
				formattedDate: dateUtils.formatDateTime(comment.created),
				message: comment.comment,
				format: comment.format,
			};
		}),
	};
}

article.permissions = [
	'view-newsletter',
];

article.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type articleProps = {
	id: number
};

export default article;
