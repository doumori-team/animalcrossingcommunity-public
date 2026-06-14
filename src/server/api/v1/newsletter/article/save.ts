import * as db from '@db';
import { UserError } from '@errors';
import { constants, utils } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, NewsletterArticleType } from '@types';

async function save(this: APIThisType, { id, newsletterId, type, title, content, sortOrder, questions, optionQuestionIndex, options, optionsAnswer, silhouettes, silhouetteAdditionals, silhouetteFileIds, silhouetteAnswerFileIds }: saveProps): Promise<{ id: number }>
{
	const [newsletter] = await db.query(`
		SELECT published
		FROM newsletter
		WHERE id = $1::int
	`, newsletterId);

	if (!newsletter)
	{
		throw new UserError('no-such-newsletter');
	}

	if (newsletter.published !== null)
	{
		throw new UserError('bad-format');
	}

	if (
		optionQuestionIndex.length !== options.length ||
		optionQuestionIndex.length !== optionsAnswer.length
	)
	{
		throw new UserError('bad-format');
	}

	if (
		silhouettes.length !== silhouetteAdditionals.length ||
		silhouetteFileIds.length > 0 && silhouettes.length !== silhouetteFileIds.length ||
		silhouetteAnswerFileIds.length > 0 && silhouettes.length !== silhouetteAnswerFileIds.length
	)
	{
		throw new UserError('bad-format');
	}

	if (id > 0)
	{
		const [checkId] = await db.query(`
			SELECT id
			FROM newsletter_article
			WHERE id = $1::int
		`, id);

		if (!checkId)
		{
			throw new UserError('no-such-newsletter-article');
		}

		const [checkDuplicate] = await db.query(`
			SELECT id
			FROM newsletter_article
			WHERE id != $3::int AND title = $2 AND newsletter_id = $1
		`, newsletterId, title, id);

		if (checkDuplicate)
		{
			throw new UserError('duplicate-article');
		}

		await db.transaction(async (query: db.QueryType) =>
		{
			await query(`
				UPDATE newsletter_article
				SET title = $2, content = $3, last_updated = now(), updated_user_id = $4::int, sort_order = $5::int
				WHERE id = $1::int
			`, id, title, content, this.userId, sortOrder);

			await query(`
				DELETE FROM newsletter_article_question_option
				WHERE newsletter_article_question_id IN (SELECT id FROM newsletter_article_question WHERE newsletter_article_id = $1::int)
			`, id);

			await query(`
				DELETE FROM newsletter_article_question
				WHERE newsletter_article_id = $1::int
			`, id);

			await query(`
				DELETE FROM newsletter_article_silhouette
				WHERE newsletter_article_id = $1::int
			`, id);
		});
	}
	else
	{
		const [checkDuplicate] = await db.query(`
			SELECT id
			FROM newsletter_article
			WHERE title = $2 AND newsletter_id = $1
		`, newsletterId, title);

		if (checkDuplicate)
		{
			throw new UserError('duplicate-article');
		}

		const [newArticle] = await db.query(`
			INSERT INTO newsletter_article (newsletter_id, user_id, type, title, content, updated_user_id, sort_order)
			VALUES ($1, $5, $2, $3, $4, $5, $6)
			RETURNING id
		`, newsletterId, type, title, content, this.userId, sortOrder);

		id = newArticle.id;
	}

	if (questions.length > 0)
	{
		const questionIds = await Promise.all(
			questions.map(async (questionText) =>
			{
				const [question] = await db.query(`
					INSERT INTO newsletter_article_question (newsletter_article_id, text)
					VALUES ($1, $2)
					RETURNING id
				`, id, questionText);

				return question.id;
			}),
		);

		await Promise.all(
			options.map(async (optionText, optionIndex) =>
			{
				const questionIndex = optionQuestionIndex[optionIndex];
				const questionId = questionIds[questionIndex];
				const answer = optionsAnswer[optionIndex];

				await db.query(`
					INSERT INTO newsletter_article_question_option (newsletter_article_question_id, text, answer)
					VALUES ($1, $2, $3)
				`, questionId, optionText, answer);
			}),
		);
	}

	if (silhouettes.length > 0)
	{
		await Promise.all(
			silhouettes.map(async (answerText, silhouetteIndex) =>
			{
				const additional = silhouetteAdditionals[silhouetteIndex];
				const silhouetteFileId = silhouetteFileIds[silhouetteIndex];
				const answerFileId = silhouetteAnswerFileIds[silhouetteIndex];

				let silhouetteHeaderFileId = null;

				if (utils.realStringLength(silhouetteFileId) > 0)
				{
					const [file] = await db.query(`
						INSERT INTO file (file_id, name, caption, sequence)
						VALUES ($1, $2, $2, 1)
						RETURNING id
					`, silhouetteFileId, `Silhouette ${silhouetteIndex}`);

					silhouetteHeaderFileId = file.id;
				}

				let answerHeaderFileId = null;

				if (utils.realStringLength(answerFileId) > 0)
				{
					const [file] = await db.query(`
						INSERT INTO file (file_id, name, caption, sequence)
						VALUES ($1, $2, $2, 1)
						RETURNING id
					`, answerFileId, `Silhouette Answer ${silhouetteIndex}`);

					answerHeaderFileId = file.id;
				}

				await db.query(`
					INSERT INTO newsletter_article_silhouette (newsletter_article_id, answer, answer_additional, silhouette_file_id, answer_file_id)
					VALUES ($1, $2, $3, $4, $5)
				`, id, answerText, additional, silhouetteHeaderFileId, answerHeaderFileId);
			}),
		);
	}

	ACCCache.deleteMatch(constants.cacheKeys.newsletter);

	return {
		id: id,
	};
}

save.permissions = [
	'modify-newsletter',
	'userId',
];

save.apiTypes = {
	id: {
		type: APITypes.number,
		default: 0,
	},
	newsletterId: {
		type: APITypes.number,
		required: true,
	},
	type: {
		type: APITypes.string,
		default: 'text',
		includes: ['text', 'quiz', 'silhouette'],
	},
	title: {
		type: APITypes.string,
		default: '',
		required: true,
		length: constants.max.newsletterArticleName,
		profanity: true,
	},
	content: {
		type: APITypes.string,
		default: '',
		required: true,
		length: constants.max.newsletterArticleContent,
		profanity: true,
	},
	sortOrder: {
		type: APITypes.number,
		required: true,
	},
	questions: {
		type: APITypes.array,
		subType: 'string',
		max: constants.max.newsletterArticleQuestion,
	},
	optionQuestionIndex: {
		type: APITypes.array,
		subType: 'number',
	},
	options: {
		type: APITypes.array,
		subType: 'string',
		max: constants.max.newsletterArticleAnswer,
	},
	optionsAnswer: {
		type: APITypes.array,
		subType: 'boolean',
	},
	silhouettes: {
		type: APITypes.array,
		subType: 'string',
		max: constants.max.newsletterArticleSilhouetteAnswer,
	},
	silhouetteAdditionals: {
		type: APITypes.array,
		subType: 'string',
		max: constants.max.newsletterArticleSilhouetteAnswerAdditional,
	},
	silhouetteFileIds: {
		type: APITypes.array,
		subType: 'string',
	},
	silhouetteAnswerFileIds: {
		type: APITypes.array,
		subType: 'string',
	},
};

type saveProps = {
	id: number
	newsletterId: number
	type: NewsletterArticleType['type']
	title: string
	content: string
	sortOrder: number
	questions: string[]
	optionQuestionIndex: number[]
	options: string[]
	optionsAnswer: boolean[]
	silhouettes: string[]
	silhouetteAdditionals: string[]
	silhouetteFileIds: string[]
	silhouetteAnswerFileIds: string[]
};

export default save;
