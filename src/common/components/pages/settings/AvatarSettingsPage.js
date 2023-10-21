import React, { useState } from 'react';
import { Link, useAsyncValue } from 'react-router-dom';

import { RequireClientJS } from '@behavior';
import AvatarSelector from '@/components/settings/AvatarSelector.js';
import { constants } from '@utils';
import { Form, Switch, Button } from '@form';
import { ErrorMessage, Tabs, ContentBox } from '@layout';
import Avatar from '@/components/nodes/Avatar.js';

const AvatarSettingsPage = () =>
{
	const {avatar, characters, accents, backgrounds, colorations,
		characterTags, accentTags, backgroundTags} = getData(useAsyncValue());

	const [previewCharacter, setPreviewCharacter] = useState(avatar.character.name !== 'Default' ? avatar.character : characters[0]);
	const [previewAccent, setPreviewAccent] = useState(avatar.character.name !== 'Default' ? avatar.accent : null);
	const [previewAccentPosition, setPreviewAccentPosition] = useState(avatar.accentPosition ? avatar.accentPosition : 4);
	const [previewBackground, setPreviewBackground] = useState(avatar.character.name !== 'Default' ? avatar.background : backgrounds[0]);
	const [previewColoration, setPreviewColoration] = useState(avatar.character.name !== 'Default' ? avatar.coloration : colorations[0]);
	const [useDefault, setUseDefault] = useState(false);

	const handleCharacterChange = (character) =>
	{
		setPreviewCharacter(character);
	}

	const handleAccentChange = (accent) =>
	{
		setPreviewAccent(!accent ? null : accent);
	}
	
	const handleAccentPositionChange = (event) =>
	{
		setPreviewAccentPosition(Number(event.target.value));
	}

	const handleBackgroundChange = (background) =>
	{
		setPreviewBackground(background);
	}

	const handleColorationChange = (event) =>
	{
		if (event.target.value === '')
		{
			setPreviewColoration(null);
		}
		else
		{
			const colorationId = Number(event.target.value);

			setPreviewColoration(colorations.find(c => c.id === colorationId));
		}
	}

	const handleDefaultClick = () =>
	{
		setUseDefault(!useDefault);
	}

	return (
		<ContentBox>
			<RequireClientJS fallback={<ErrorMessage identifier='javascript-required' />}>
				<div className='AvatarSettingsPage_links'>
					<Form
						action='v1/avatar/create'
						showButton
						buttonText='Save Avatar'
						callback='/avatars'
					>
						<input
							type='hidden'
							name='characterId'
							value={previewCharacter ? previewCharacter.id : ''}
						/>
						<input
							type='hidden'
							name='accentId'
							value={previewAccent ? previewAccent.id : ''}
						/>
						<input
							type='hidden'
							name='accentPosition'
							value={previewAccentPosition}
						/>
						<input
							type='hidden'
							name='backgroundId'
							value={previewBackground ? previewBackground.id : ''}
						/>
						<input
							type='hidden'
							name='colorationId'
							value={previewColoration ? previewColoration.id : ''}
						/>
					</Form>
					<Link to='/avatars'>Saved Avatars</Link>
				</div>

				<Form className='AvatarSettingsPage_form' action='v1/settings/avatar/save'>
					<div className='AvatarSettingsPage_mainPortal'>
						<div className='AvatarSettingsPage_avatarPreviews'>
							<span className='AvatarSettingsPage_avatarContainer'>
								<div>Current:</div>

								<Avatar {...avatar} />
							</span>
							<span className='AvatarSettingsPage_avatarContainer'>
								<div>Preview:</div>

								{useDefault ? (
									<Avatar { ...constants.defaultAvatar } />
								) : (
									<Avatar
										character={previewCharacter}
										accent={previewAccent}
										accentPosition={(previewAccent && previewAccent.positionable) ? previewAccentPosition : null}
										background={previewBackground}
										coloration={previewBackground.colorable ? previewColoration : null}
									/>
								)}
							</span>
						</div>

						<div className='AvatarSettingsPage_toolbar'>
							<Switch
								label='No avatar'
								name='useDefault'
								value={useDefault}
								clickHandler={handleDefaultClick}
							/>

							<Button
								type='submit'
								label='Save'
								className='AvatarSettingsPage_submitButton'
							/>
						</div>
					</div>

					{!useDefault && (
						<Tabs defaultActiveKey='character' variant='dark'>
							<Tabs.Tab eventKey='character' title='Character'>
								<input
									type='hidden'
									name='accentId'
									value={previewAccent ? previewAccent.id : ''}
								/>
								<input
									type='hidden'
									name='accentPosition'
									value={previewAccentPosition}
								/>
								<input
									type='hidden'
									name='backgroundId'
									value={previewBackground ? previewBackground.id : ''}
								/>
								<input
									type='hidden'
									name='colorationId'
									value={previewColoration ? previewColoration.id : ''}
								/>

								<AvatarSelector
									elements={characters}
									currElement={previewCharacter}
									elementType='character'
									onElementChange={handleCharacterChange}
									tags={characterTags}
								/>
							</Tabs.Tab>
							<Tabs.Tab eventKey='accent' title='Accent'>
								<input
									type='hidden'
									name='characterId'
									value={previewCharacter ? previewCharacter.id : ''}
								/>
								<input
									type='hidden'
									name='backgroundId'
									value={previewBackground ? previewBackground.id : ''}
								/>
								<input
									type='hidden'
									name='colorationId'
									value={previewColoration ? previewColoration.id : ''}
								/>

								<AvatarSelector
									elements={accents}
									currElement={previewAccent}
									elementType='accent'
									currAccentPosition={previewAccentPosition}
									onAccentPositionChange={handleAccentPositionChange}
									onElementChange={handleAccentChange}
									tags={accentTags}
								/>
							</Tabs.Tab>
							<Tabs.Tab eventKey='background' title='Background'>
								<input
									type='hidden'
									name='characterId'
									value={previewCharacter ? previewCharacter.id : ''}
								/>
								<input
									type='hidden'
									name='accentId'
									value={previewAccent ? previewAccent.id : ''}
								/>
								<input
									type='hidden'
									name='accentPosition'
									value={previewAccentPosition}
								/>

								<AvatarSelector
									elements={backgrounds}
									currElement={previewBackground}
									elementType='background'
									colorations={colorations}
									currColoration={previewColoration}
									onColorationChange={handleColorationChange}
									onElementChange={handleBackgroundChange}
									tags={backgroundTags}
								/>
							</Tabs.Tab>
						</Tabs>
					)}
				</Form>
			</RequireClientJS>
		</ContentBox>
	);
}

export async function loadData()
{
	return Promise.all([
		this.query('v1/users/avatar'),
		this.query('v1/avatars'),
	]);
}

function getData(data)
{
	const [avatar, avatars] = data;

	return {
		avatar: avatar,
		characters: avatars.characters,
		accents: avatars.accents,
		backgrounds: avatars.backgrounds,
		colorations: avatars.colorations,
		characterTags: avatars.tags.characterTags,
		accentTags: avatars.tags.accentTags,
		backgroundTags: avatars.tags.backgroundTags
	};
}

export default AvatarSettingsPage;
