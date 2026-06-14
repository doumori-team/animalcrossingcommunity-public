import { useState, useEffect } from 'react';
import { Link } from 'react-router';

import { RequirePermission, RequireClientJS, RequireUser } from '@behavior';
import { Confirm, Checkbox, Button, Text, Form, RichTextArea } from '@form';
import { ContentBox, Header, Markup, ErrorMessage, FontAwesomeIcon, ReportProblem, Section } from '@layout';
import { APIThisType, NewsletterArticleType, NewsletterType, EmojiSettingType } from '@types';
import { routerUtils, constants } from '@utils';
import TableOfContents from '@/components/newsletter/TableOfContents.tsx';
import { UserContext } from '@contexts';

export const action = routerUtils.formAction;

const ArticlePage = ({ loaderData }: { loaderData: ArticlePageProps }) =>
{
	const [submit, setSubmit] = useState<boolean>(false);
	const [viewAnswers, setViewAnswers] = useState<boolean>(false);
	const [selection, setSelection] = useState<number[]>([]);
	const [silhouetteAnswers, setSilhouetteAnswers] = useState<string[]>([]);

	const { newsletter, article, articles, userEmojiSettings,
		currentUserEmojiSettings } = loaderData;

	const encodedId = encodeURIComponent(article.id);
	const encodedNewsletterId = encodeURIComponent(article.newsletterId);

	const handleChange = (questionIndex: number, optionIndex: number): void =>
	{
		let newSelection = [...selection];
		newSelection[questionIndex] = optionIndex;

		setSelection(newSelection);
	};

	const handleSilhouetteChange = (silhouetteIndex: number, answer: string): void =>
	{
		let newSilhouetteAnswers = [...silhouetteAnswers];
		newSilhouetteAnswers[silhouetteIndex] = answer;

		setSilhouetteAnswers(newSilhouetteAnswers);
	};

	useEffect(() =>
	{
		setSubmit(false);
		setViewAnswers(false);
		setSelection([]);
		setSilhouetteAnswers([]);
	}, [article.id]);

	return (
		<div className='ArticlePage'>
			<RequirePermission permission='view-newsletter'>
				<Header
					name={`Issue ${newsletter.issue} - ${newsletter.formattedIssueDate}`}
					link={`/newsletter/${encodedNewsletterId}`}
					links={
						!article.published &&
							<RequirePermission permission='modify-newsletter' silent>
								<Link to={`/newsletter/${encodedNewsletterId}/${encodedId}/edit`}>
									Edit
								</Link>

								<Confirm
									action='v1/newsletter/article/destroy'
									callback={`/newsletter/${encodedNewsletterId}`}
									id={article.id}
									label='Delete'
									message='Are you sure you want to delete this article?'
								/>
							</RequirePermission>

					}
				/>

				<TableOfContents
					newsletterId={article.newsletterId}
					articles={articles}
				/>

				<ContentBox>
					<Markup
						key={article.id}
						text={article.content}
						format='markdown+html'
					/>

					{article.questions.length > 0 &&
						<div>
							<ol>
								{article.questions.map((question, questionIndex) =>
									<li key={questionIndex} className='ArticlePage_question'>
										{question.text}

										<ol className='alpha-list'>
											{article.questions[questionIndex].options.map((option, optionIndex) =>
												<li key={optionIndex}>
													<Checkbox
														type='radio'
														name={`question_${questionIndex}_option`}
														value={option.text}
														label={option.text}
														clickHandler={() => handleChange(questionIndex, optionIndex)}
													/>
													{submit && selection[questionIndex] === optionIndex
														? option.answer ? correctIcon() : incorrectIcon()
														: ''}
													{viewAnswers && option.answer ? answerIcon() : ''}
												</li>,
											)}
										</ol>
									</li>,
								)}
							</ol>
							<RequireClientJS fallback={
								<ErrorMessage identifier='javascript-required' />
							}
							>
								<Button
									clickHandler={() =>
									{
										setViewAnswers(false);
										setSubmit(true);
									}}
									label='Submit'
									className='Form_button'
								/>
								<Button
									clickHandler={() =>
									{
										setSubmit(false);
										setViewAnswers(true);
									}}
									label='View Answers'
									className='Form_button'
								/>
							</RequireClientJS>
						</div>
					}

					{article.silhouettes.length > 0 &&
						<div className='ArticlePage_silhouettes'>
							<ol>
								{article.silhouettes.map((silhouette, silhouetteIndex) =>
									<li key={silhouetteIndex} className='ArticlePage_silhouette'>
										<img
											src={viewAnswers ? silhouette.answerFile : silhouette.silhouetteFile}
											alt="Who's That Character?"
											title="Who's That Character?"
										/>

										<Text
											name={`silhouette_${silhouetteIndex}`}
											label={`#${silhouetteIndex + 1}`}
											maxLength={constants.max.newsletterArticleSilhouetteAnswer}
											value={silhouetteAnswers[silhouetteIndex]}
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											changeHandler={(e: any) => handleSilhouetteChange(silhouetteIndex, e.target.value)}
										/>
										{submit ? silhouetteAnswers[silhouetteIndex] === silhouette.answer ? correctIcon() : incorrectIcon() : ''}
										{viewAnswers &&
											<>
												{silhouette.answer}
												<br />
												{silhouette.answerAdditional}
											</>
										}
									</li>,
								)}
							</ol>
							<RequireClientJS fallback={
								<ErrorMessage identifier='javascript-required' />
							}
							>
								<Button
									clickHandler={() =>
									{
										setViewAnswers(false);
										setSubmit(true);
									}}
									label='Submit'
									className='Form_button'
								/>
								<Button
									clickHandler={() =>
									{
										setSubmit(false);
										setViewAnswers(true);
									}}
									label='View Answers'
									className='Form_button'
								/>
							</RequireClientJS>
						</div>
					}
				</ContentBox>

				{article.published && ((article.questions.length > 0 || article.silhouettes.length > 0) && (submit || viewAnswers) || article.questions.length === 0 && article.silhouettes.length === 0) &&
					<Section>
						<div className='ArticlePage_chat'>
							<h3>Article Comments:</h3>

							<div className='ArticlePage_comments'>
								{article.comments.length > 0 ?
									article.comments.map(comment =>
										<div key={comment.id} className='ArticlePage_comment'>
											<div className='ArticlePage_commentBy'>
												<ReportProblem
													type={constants.userTicket.types.articleComment}
													id={comment.id}
												/>
												<UserContext.Consumer>
													{currentUser =>
														currentUser ?
															<div>
																Comment By: <Link to={`/profile/${encodeURIComponent(comment.user.id)}`}>
																	{comment.user.username}
																</Link> on {comment.formattedDate}
															</div>
															:
															<div>
																Comment By: {comment.user.username} on {comment.formattedDate}
															</div>
													}
												</UserContext.Consumer>
											</div>

											<div className='ArticlePage_comment'>
												<Markup
													text={comment.message}
													format={comment.format ?
														comment.format :
														'markdown'}
													emojiSettings={userEmojiSettings?.filter(s => s.userId === comment.user.id)}
												/>
											</div>
										</div>,
									)
									:
									'No comments have been made.'
								}
							</div>

							<RequireUser silent>
								<div className='ArticlePage_makeComment'>
									<Form
										action='v1/newsletter/article/comment'
										callback={`/newsletter/${encodedNewsletterId}/${encodedId}`}
										showButton
									>
										<input type='hidden' name='id' value={article.id} />

										<Form.Group>
											<RichTextArea
												textName='comment'
												formatName='format'
												label='Comment'
												emojiSettings={currentUserEmojiSettings}
												maxLength={constants.max.comment}
												required
												key={Math.random()}
											/>
										</Form.Group>
									</Form>
								</div>
							</RequireUser>
						</div>
					</Section>
				}
			</RequirePermission>
		</div>
	);
};

function correctIcon()
{
	return (
		<FontAwesomeIcon
			name='checkmark'
			alt='Correct!'
		/>
	);
}

function incorrectIcon()
{
	return (
		<FontAwesomeIcon
			name='xmark'
			alt='Incorrect!'
		/>
	);
}

function answerIcon()
{
	return (
		<FontAwesomeIcon
			name='star'
			alt='This is the answer'
		/>
	);
}

async function loadData(this: APIThisType, { newsletterId, articleId }: { newsletterId: string, articleId: string }): Promise<ArticlePageProps>
{
	const [newsletter, article, articles, currentUserEmojiSettings] = await Promise.all([
		this.query('v1/newsletter', { id: newsletterId }),
		this.query('v1/newsletter/article', { id: articleId }),
		this.query('v1/newsletter/articles', { id: newsletterId }),
		this.query('v1/settings/emoji'),
	]);

	const [userEmojiSettings] = await Promise.all([
		article.comments.length > 0 ? this.query('v1/settings/emoji', { userIds: article.comments.map(c => c.user.id) }) : null,
	]);

	return { newsletter, article, articles, currentUserEmojiSettings, userEmojiSettings };
}

export const loader = routerUtils.wrapLoader(loadData);

type ArticlePageProps = {
	newsletter: NewsletterType
	article: NewsletterArticleType
	articles: NewsletterArticleType[]
	userEmojiSettings: EmojiSettingType[] | null
	currentUserEmojiSettings: EmojiSettingType[]
};

export default ArticlePage;
