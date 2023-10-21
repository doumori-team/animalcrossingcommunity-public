import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireGroup } from '@behavior';
import { constants } from '@utils';
import { Form, RichTextArea } from '@form';
import { Header, Section } from '@layout';
import { UserContext } from '@contexts';

const ScoutSettingsPage = () =>
{
	const {settings, emojiSettings} = useLoaderData();

	return (
		<div className='ScoutSettingsPage'>
			<RequireGroup group={constants.staffIdentifiers.scout}>
				<UserContext.Consumer>
					{scout => scout && (
						<>
						<Header
							name='Scout Settings'
							links={
								<>
								<Link to={`/scout-hub`}>Scout Hub</Link>
								<Link to={`/scout-hub/new-members`}>New Members</Link>
								<Link to={`/scout-hub/settings`}>Settings</Link>
								<Link to={`/scout-hub/ratings/${encodeURIComponent(scout.id)}`}>
									Feedback
								</Link>
								<Link to={`/scout-hub/adoption/${encodeURIComponent(constants.boardIds.adopteeBT)}`}>
									Adoptee BT
								</Link>
								</>
							}
						/>

						<Section>
							<div className='ScoutSettingsPage_key'>
								<p><strong>AdopteeName:</strong> The Adoptee's username can appear in your templates when using the <strong>AdopteeName</strong> template variable.</p>
								<p><strong>ScoutName:</strong> Your username can appear in your templates when using the <strong>ScoutName</strong> template variable.</p>
								<p><strong>AdopteeId:</strong> The Adoptee's user ID can be used in your templates to create links to the Adoptee's content when using the <strong>AdopteeId</strong> template variable. For example, /profile/<strong>AdopteeId</strong>/towns</p>
								<p><strong>ScoutId:</strong> Your user ID can be used in your templates to create links to your content when using the <strong>ScoutId</strong> template variable. For example, /profile/<strong>ScoutId</strong>/friend-codes</p>
							</div>
						</Section>

						<Section>
							<p>Your Welcome Template will automatically be used as the first post for new adoption threads, while the Closing Template will be automatically used when locking an adoption thread without having text.</p>
							<Form action='v1/scout_hub/save' showButton>
								<input type='hidden' name='scoutId' value={scout.id} />

								<Form.Group>
									<label htmlFor='welcomeTemplate'>Welcome Template: </label>
									<RichTextArea
										textName='welcomeTemplate'
										formatName='welcomeTemplateFormat'
										textValue={settings.welcomeTemplate}
										placeholder={constants.scoutHub.defaultWelcomeTemplate}
										formatValue={settings.welcomeTemplateFormat}
										key={Math.random()}
										label='Welcome Template'
										emojiSettings={emojiSettings}
									/>
								</Form.Group>

								<Form.Group>
									<label htmlFor='closingTemplate'>Closing Template: </label>
									<RichTextArea
										textName='closingTemplate'
										formatName='closingTemplateFormat'
										textValue={settings.closingTemplate}
										placeholder={constants.scoutHub.defaultClosingTemplate}
										formatValue={settings.closingTemplateFormat}
										key={Math.random()}
										label='Closing Template'
										emojiSettings={emojiSettings}
									/>
								</Form.Group>
							</Form>
						</Section>
						</>
					)}
					</UserContext.Consumer>
			</RequireGroup>
		</div>
	);
}

export async function loadData()
{
	const [settings, emojiSettings] = await Promise.all([
		this.query('v1/scout_hub/settings'),
		this.query('v1/settings/emoji'),
	]);

	return {settings, emojiSettings};
}

export default ScoutSettingsPage;
