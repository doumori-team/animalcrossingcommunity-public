import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { Form, RichTextArea, TextArea, Text, Select, Switch } from '@form';
import { constants } from '@utils';
import { Section } from '@layout';
import { APIThisType, ForumSettingType, EmojiSettingType, UserDonationsType } from '@types';

const ForumSettingsPage = () =>
{
	const {settings, emojiSettings, userDonations} = useLoaderData() as ForumSettingsPageProps;

	return (
		<div className='ForumSettingsPage'>
			<Section>
				<Form action='v1/settings/forum/save' showButton>
					<Form.Group>
						{userDonations.perks >= 5 ? (
							<>
							<label htmlFor='signature'>Signature:</label>
							<RichTextArea
								textName='signature'
								textValue={settings.signature ? settings.signature : ''}
								formatName='format'
								formatValue={settings.format ? settings.format : 'markdown'}
								maxLength={userDonations.perks >= 20 ?
									constants.max.signature3 :
									(userDonations.perks >= 10 ?
										constants.max.signature2 :
										constants.max.signature1)}
								label='Signature'
								characterCount
								emojiSettings={emojiSettings}
							/>
							</>
						) : (
							<TextArea
								name='signature'
								label='Signature'
								value={settings.signature ? settings.signature : ''}
								rows={2}
								maxLength={constants.max.signature1}
							/>
						)}
					</Form.Group>
					<Form.Group>
						<Text
							name='userTitle'
							label='User Title'
							value={settings.userTitle ? settings.userTitle : ''}
							maxLength={constants.max.userTitle}
						/>
					</Form.Group>
					<Form.Group>
						<Select
							name='flagOption'
							label='Mark Thread as Favorited'
							options={[
								{value: 'never', label: 'Never'},
								{value: 'create', label: 'When I create the thread'},
								{value: 'create_reply', label: 'When I create or reply to a thread'},
							]}
							value={settings.flagOption}
							key={settings.flagOption}
						/>
					</Form.Group>
					<Form.Group>
						<Select
							name='markupStyle'
							label='Markup Style'
							options={[
								{value: 'markdown', label: 'Markdown'},
								{value: 'bbcode', label: 'Traditional'},
								{value: 'plaintext', label: 'No Markup'},
							]}
							value={settings.markupStyle}
							key={settings.markupStyle}
						/>
					</Form.Group>
					<Form.Group>
						<Switch
							name='showImages'
							label='Show Images'
							value={settings.showImages}
						/>
					</Form.Group>
					<Form.Group>
						<Select
							name='conciseMode'
							label='How Many Lines of Information to Display with Threads'
							options={[
								{value: 1, label: '1'},
								{value: 2, label: '2'},
								{value: 3, label: '3'},
								{value: 4, label: '4'},
							]}
							value={settings.conciseMode}
							key={settings.conciseMode}
						/>
					</Form.Group>
				</Form>
			</Section>
		</div>
	);
}

export async function loadData(this: APIThisType) : Promise<ForumSettingsPageProps>
{
	const [settings, emojiSettings, userDonations] = await Promise.all([
		this.query('v1/settings/forum'),
		this.query('v1/settings/emoji'),
		this.query('v1/users/donations'),
	]);

	return {settings, emojiSettings, userDonations};
}

type ForumSettingsPageProps = {
	settings: ForumSettingType
	emojiSettings: EmojiSettingType[]
	userDonations: UserDonationsType
}

export default ForumSettingsPage;
