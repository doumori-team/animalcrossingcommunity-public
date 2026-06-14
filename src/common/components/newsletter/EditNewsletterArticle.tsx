import { useState } from 'react';

import { Form, RichTextArea, Text, Button, Switch } from '@form';
import { NewsletterArticleType } from '@types';
import { constants } from '@utils';
import ImageUpload from '@/components/layout/ImageUpload.tsx';
import { InnerSection, ErrorMessage } from '@layout';
import { RequireClientJS } from '@behavior';

const EditNewsletterArticle = ({
	newsletterId,
	article,
	type,
}: EditNewsletterArticleProps) =>
{
	const [curQuestions, setCurQuestions] = useState(article ? article.questions : [
		{ text: '', options: [{ text: '', answer: true }] },
		{ text: '', options: [{ text: '', answer: true }] },
	]);

	const [curSilhouettes, setCurSilhouettes] = useState(article ? article.silhouettes : [
		{ answer: '', answerAdditional: '', silhouetteFileId: '', answerFileId: '' },
		{ answer: '', answerAdditional: '', silhouetteFileId: '', answerFileId: '' },
	]);

	const addQuestion = (): void =>
	{
		let newQuestions = [...curQuestions];
		newQuestions.push({ text: '', options: [{ text: '', answer: true }] });

		setCurQuestions(newQuestions);
	};

	const deleteQuestion = (index: number): void =>
	{
		let newQuestions = [...curQuestions];
		newQuestions.splice(index, 1);

		setCurQuestions(newQuestions);
	};

	const addOption = (questionIndex: number): void =>
	{
		let newOptions = [...curQuestions];
		newOptions[questionIndex].options.push({ text: '', answer: true });

		setCurQuestions(newOptions);
	};

	const deleteOption = (questionIndex: number, optionIndex: number): void =>
	{
		let newOptions = [...curQuestions];
		newOptions[questionIndex].options.splice(optionIndex, 1);

		setCurQuestions(newOptions);
	};

	const addSilhouette = (): void =>
	{
		let newSilhouettes = [...curSilhouettes];
		newSilhouettes.push({ answer: '', answerAdditional: '', silhouetteFileId: '', answerFileId: '' });

		setCurSilhouettes(newSilhouettes);
	};

	const deleteSilhouette = (index: number): void =>
	{
		let newSilhouettes = [...curSilhouettes];
		newSilhouettes.splice(index, 1);

		setCurSilhouettes(newSilhouettes);
	};

	return (
		<section className='EditNewsletterArticle'>
			<Form action='v1/newsletter/article/save' callback={`/newsletter/${encodeURIComponent(newsletterId)}/:id`} showButton>
				<input type='hidden' name='newsletterId' value={newsletterId} />
				<input type='hidden' name='id' value={article ? article.id : 0} />
				<input type='hidden' name='type' value={type} />

				<h1 className='EditNewsletterArticle_name'>
					<Form.Group>
						<Text
							name='title'
							value={article ? article.title : ''}
							required
							maxLength={constants.max.newsletterArticleName}
							label='Article Title'
							hideLabels
							placeholder='Article Title'
							className='text-full'
						/>
					</Form.Group>
				</h1>

				<Form.Group>
					<Text
						name='sortOrder'
						type='number'
						value={article ? article.sortOrder : 1}
						required
						label='Sort Order'
						className='text-full'
					/>
				</Form.Group>

				<Form.Group>
					<label htmlFor='content'>Content:</label>
					<RichTextArea
						textName='content'
						textValue={article ? article.content : ''}
						formatValue='markdown+html'
						maxLength={constants.max.newsletterArticleContent}
						label='Content'
						hideEmojis
						required
					/>
				</Form.Group>

				{article &&
					<ImageUpload
						directory={`${constants.NEWSLETTER_IMAGE_FILE_DIR2}${article.issue}`}
						api='v1/newsletter/article/upload_image'
						label='Upload Article Image'
					/>
				}

				{type === 'quiz' &&
					<RequireClientJS fallback={
						<ErrorMessage identifier='javascript-required' />
					}
					>
						<InnerSection>
							<div className='EditNewsletterArticle_links'>
								<Button
									clickHandler={addQuestion}
									label='Add Question'
									className='Form_button'
								/>
							</div>

							{curQuestions.map((question: typeof curQuestions[number], questionIndex: number) =>
								<div key={questionIndex} className='EditNewsletterArticle_question'>
									<div className='EditNewsletterArticle_questionLinks'>
										<Form.Group>
											<Text
												name='questions'
												label={`Question #${questionIndex + 1}`}
												value={question.text}
												maxLength={constants.max.newsletterArticleQuestion}
												required
											/>
										</Form.Group>

										<Button
											clickHandler={() => deleteQuestion(questionIndex)}
											label='Delete Question'
											className='Form_button'
										/>

										<Button
											clickHandler={() => addOption(questionIndex)}
											label='Add Option'
											className='Form_button'
										/>
									</div>

									{curQuestions[questionIndex].options.map((option: typeof curQuestions[number]['options'][number], optionIndex: number) =>
										<div key={optionIndex} className='EditNewsletterArticle_option'>
											<input type='hidden' name='optionQuestionIndex' value={questionIndex} />

											<Form.Group>
												<Text
													name='options'
													label={`Option #${optionIndex + 1}`}
													value={option.text}
													maxLength={constants.max.newsletterArticleAnswer}
													required
												/>
											</Form.Group>

											<Form.Group>
												<Switch
													name='optionsAnswer'
													label='Answer?'
													value={option.answer}
												/>
											</Form.Group>

											<Button
												clickHandler={() => deleteOption(questionIndex, optionIndex)}
												label='Delete Option'
												className='Form_button'
											/>
										</div>,
									)}
								</div>,
							)}
						</InnerSection>
					</RequireClientJS>
				}

				{type === 'silhouette' &&
					<RequireClientJS fallback={
						<ErrorMessage identifier='javascript-required' />
					}
					>
						<InnerSection>
							<div className='EditNewsletterArticle_links'>
								<Button
									clickHandler={addSilhouette}
									label='Add Silhouette'
									className='Form_button'
								/>
							</div>

							{curSilhouettes.map((silhouette: typeof curSilhouettes[number], silhouetteIndex: number) =>
								<div key={silhouetteIndex} className='EditNewsletterArticle_silhouette'>
									<Form.Group>
										<Text
											name='silhouettes'
											label={`Silhouette #${silhouetteIndex + 1} Answer`}
											value={silhouette.answer}
											maxLength={constants.max.newsletterArticleSilhouetteAnswer}
											required
										/>
									</Form.Group>

									<Form.Group>
										<Text
											name='silhouetteAdditionals'
											label='Additional'
											value={silhouette.answerAdditional}
											maxLength={constants.max.newsletterArticleSilhouetteAnswerAdditional}
											required
										/>
									</Form.Group>

									{article &&
										<ImageUpload
											directory={`${constants.NEWSLETTER_IMAGE_FILE_DIR2}${article.issue}`}
											api='v1/newsletter/article/upload_image'
											fileIdName='silhouetteFileIds'
											label='Upload Silhouette Image'
											hidden
										/>
									}

									{article &&
										<ImageUpload
											directory={`${constants.NEWSLETTER_IMAGE_FILE_DIR2}${article.issue}`}
											api='v1/newsletter/article/upload_image'
											fileIdName='silhouetteAnswerFileIds'
											label='Upload Answer Image'
											hidden
										/>
									}

									<Button
										clickHandler={() => deleteSilhouette(silhouetteIndex)}
										label='Delete Silhouette'
										className='Form_button'
									/>
								</div>,
							)}
						</InnerSection>
					</RequireClientJS>
				}
			</Form>
		</section>
	);
};

type EditNewsletterArticleProps = {
	newsletterId: number
	type: NewsletterArticleType['type']
	article?: NewsletterArticleType
};

export default EditNewsletterArticle;
