import { Form, Check } from '@form';
import emojiDefs from 'common/markup/emoji.json';
import { Section } from '@layout';
import { APIThisType, EmojiSettingType } from '@types';
import { routerUtils, constants } from '@utils';

export const action = routerUtils.formAction;

const EmojiSettingsPage = ({ loaderData }: { loaderData: EmojiSettingsPageProps }) =>
{
	const { settings } = loaderData;

	const types = emojiDefs[0];
	const categories = emojiDefs[2];

	return (
		<div className='EmojiSettingsPage'>
			<Section>
				<Form action='v1/settings/emoji/save' showButton>
					<p>
						Choosing different emojis below will allow them to appear on the emoji select bar when writing posts. You can customize which emojis you post at any time by returning to this page.
					</p>
					<p>
						<a href='https://apps.apple.com/us/app/acc-retro-emoji/id6757111565'>
							<img
								src={constants.allImages['layout/AppStore.svg']}
								alt='Download on the App Store'
							/>
						</a>
					</p>
					<ul>
						{Object.keys(emojiDefs[0]).map((def, index) =>
						{
							const showCategories = (categories as string[])
							.map(cat =>
							{
								return {
									id: cat,
									filename: `${cat}/${types[def]}.png`,
									className: cat.includes('reaction') ? 'icon-reaction' : '',
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
};

async function loadData(this: APIThisType): Promise<EmojiSettingsPageProps>
{
	const [settings] = await Promise.all([
		this.query('v1/settings/emoji'),
	]);

	return { settings };
}

export const loader = routerUtils.wrapLoader(loadData);

type EmojiSettingsPageProps = {
	settings: EmojiSettingType[]
};

export default EmojiSettingsPage;
