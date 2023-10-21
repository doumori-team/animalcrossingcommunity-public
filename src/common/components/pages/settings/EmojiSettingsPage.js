import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { Form, Check } from '@form';
import emojiDefs from 'common/markup/emoji.json' assert { type: "json"};
import { Section } from '@layout';

const EmojiSettingsPage = () =>
{
	const {settings} = useLoaderData();

	const types = emojiDefs[0];
	const categories = emojiDefs[2];

	return (
		<div className='EmojiSettingsPage'>
			<Section>
				<Form action='v1/settings/emoji/save' showButton>
					<p>
						Choosing different emojis below will allow them to appear on the emoji select bar when writing posts. You can customize which emojis you post at any time by returning to this page.
					</p>
					<ul>
					{Object.keys(emojiDefs[0]).map((def, index) => {
						const showCategories = categories
							.map(cat => {
								return {
									id: cat,
									filename: `${cat}/${types[def]}.png`
								};
							});

						const setting = settings.find(s => s.type === def);

						return (
							<div className='EmojiSettingsPage_type' key={index}>
								<Check
									options={showCategories}
									name={def}
									defaultValue={setting ? [setting.category] : ['reaction']}
									required={true}
									imageLocation='emoji'
									useImageFilename={true}
									showName={false}
									label={def}
								/>
							</div>
						);
					})}
					</ul>
				</Form>
			</Section>
		</div>
	);
}

export async function loadData()
{
	const [settings] = await Promise.all([
		this.query('v1/settings/emoji'),
	]);

	return {settings};
}

export default EmojiSettingsPage;