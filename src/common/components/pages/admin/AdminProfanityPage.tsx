import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Header, Section } from '@layout';
import { Form, Text, Switch } from '@form';
import { constants } from '@utils';
import { APIThisType, ProfanityWordType } from '@types';

const AdminProfanityPage = () =>
{
	const {words} = useLoaderData() as AdminProfanityPageProps;

	return (
		<RequirePermission permission='profanity-admin'>
			<div className='AdminProfanityPage'>
				<Header
					name='Profanity Admin'
				/>

				<Section>
					<Form action='v1/profanity/save' showButton>
						<Form.Group>
							<Text
								name='word'
								label='Add Word'
								required
								maxLength={constants.max.profanityWord}
							/>
						</Form.Group>
					</Form>
					{words.length > 0 ? (
						<div className='AdminProfanityPage_words'>
							{words.map((word, index) =>
								<div key={index} className='AdminProfanityPage_word'>
									<div className='AdminProfanityPage_wordLinks'>
										{word.nodeId && (
											<Link to={`/forums/${encodeURIComponent(word.nodeId)}`}>
												Thread
											</Link>
										)}
									</div>
									<div className='AdminProfanityPage_wordUpdate'>
										<Form
											action='v1/profanity/save'
											showButton
											buttonText='Update'
										>
											<input type='hidden' name='id' value={word.id} />

											<Form.Group>
												<Text
													hideLabel
													label='Word'
													name='word'
													required
													value={word.word}
													maxLength={constants.max.profanityWord}
												/>
											</Form.Group>

											<RequirePermission permission='activate-profanity-words' silent>
												<Form.Group>
													<Switch
														name='activate'
														label='Active'
														value={word.active}
													/>
												</Form.Group>
											</RequirePermission>
										</Form>
									</div>
								</div>
							)}
						</div>
					) : (
						'No words found.'
					)}
				</Section>
			</div>
		</RequirePermission>
	);
}

export async function loadData(this: APIThisType) : Promise<AdminProfanityPageProps>
{
	const [words] = await Promise.all([
		this.query('v1/profanity/word'),
	]);

	return {words};
}

type AdminProfanityPageProps = {
	words: ProfanityWordType[]
}

export default AdminProfanityPage;
