import React from 'react';

import { Form, RichTextArea, TextArea, Text } from '@form';
import { ACGameType, GuideType } from '@types';
import { constants } from '@utils';

const EditGuide = ({
	guide,
	game
}: EditGuideProps) =>
{
	return (
		<section className='EditGuide'>
			<Form action='v1/guide/save' callback='/guide/:id' showButton>
				<input type='hidden' name='gameId' value={game.id} />
				<input type='hidden' name='id' value={guide ? guide.id : 0} />

				<h1 className='EditGuide_name'>
					<Form.Group>
						<Text
							name='name'
							value={guide ?
								(guide.updatedName ? guide.updatedName : guide.name)
								: ''
							}
							required
							maxLength={constants.max.guideName}
							label='Guide Name'
							hideLabel
							placeholder='Guide Name'
							className='text-full'
						/>
						{' '}
						<small className='EditGuide_gameName'><cite>
							{game.shortname}
						</cite></small>
					</Form.Group>
				</h1>

				<Form.Group>
					<TextArea
						name='description'
						label='Description'
						required
						value={guide ?
							(guide.updatedDescription ? guide.updatedDescription : guide.description)
							: ''
						}
						maxLength={constants.max.guideDescription}
					/>
				</Form.Group>

				<Form.Group>
					<label htmlFor='content'>Content:</label>
					<RichTextArea
						textName='content'
						textValue={guide ? (guide.updatedContent ? guide.updatedContent : guide.content) : ''}
						formatValue='markdown+html'
						maxLength={constants.max.guideContent}
						label='Content'
						hideEmojis
						required
					/>
				</Form.Group>
			</Form>
		</section>
	);
}

type EditGuideProps = {
	game: ACGameType|GuideType['game']
	guide?: GuideType
};

export default EditGuide;
