import React from 'react';
import { useLoaderData, useOutletContext } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { Form, Text, RichTextArea } from '@form';
import { constants } from '@utils';
import { Header, Section } from '@layout';
import { UserContext } from '@contexts';

const EditProfileBioPage = () =>
{
	const {bio, emojiSettings} = useLoaderData();
	const {user} = useOutletContext();

	return (
		<RequireUser id={user.id} permission='modify-profiles'>
			<div className='EditProfileBioPage'>
				<UserContext.Consumer>
					{currentUser => currentUser && (
						<>
						<Header
							name='About Me'
						/>

						<Section>
							<Form
								action='v1/users/bio/save'
								callback='/profile/:id'
								showButton
							>
								<input type='hidden' name='id' value={user.id} />

								<Form.Group>
									<Text
										name='name'
										label='Name'
										value={bio.name}
										placeholder='e.g. Jerad'
										maxLength={constants.max.name}
									/>
								</Form.Group>

								<Form.Group>
									<Text
										name='location'
										label='Location'
										value={bio.location ? bio.location : ''}
										placeholder='e.g. Louisville, KY'
										maxLength={constants.max.location}
									/>
								</Form.Group>

								<Form.Group>
									<label htmlFor='bio'>Other Stuff About Me:</label>
									<RichTextArea
										textName='bio'
										textValue={bio.bio ? bio.bio : ''}
										formatName='format'
										formatValue={bio.format ? bio.format : 'markdown'}
										maxLength={currentUser.perks < 20 ? constants.max.bio1 : constants.max.bio2}
										label='Other Stuff About Me'
										characterCount
										emojiSettings={emojiSettings}
										upload
										maxImages={constants.max.imagesProfile}
										files={bio.files}
									/>
								</Form.Group>
							</Form>
						</Section>
						</>
					)}
				</UserContext.Consumer>
			</div>
		</RequireUser>
	);
}

export async function loadData({id})
{
	const [bio, emojiSettings] = await Promise.all([
		this.query('v1/users/bio', {id}),
		this.query('v1/settings/emoji'),
	]);

	return {bio, emojiSettings};
}

export default EditProfileBioPage;
