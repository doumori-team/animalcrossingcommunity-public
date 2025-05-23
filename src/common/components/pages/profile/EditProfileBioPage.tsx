import { useOutletContext } from 'react-router';

import { RequireUser } from '@behavior';
import { Form, Text, RichTextArea } from '@form';
import { constants, routerUtils } from '@utils';
import { Header, Section } from '@layout';
import { APIThisType, UserBioType, EmojiSettingType, UserDonationsType, UserType } from '@types';

export const action = routerUtils.formAction;

const EditProfileBioPage = ({ loaderData }: { loaderData: EditProfileBioPageProps }) =>
{
	const { bio, emojiSettings, userDonations } = loaderData;
	const { user } = useOutletContext() as { user: UserType };

	return (
		<RequireUser id={user.id} permission='modify-profiles'>
			<div className='EditProfileBioPage'>
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
								maxLength={userDonations.monthlyPerks >= 5 ? userDonations.monthlyPerks < 10 ? constants.max.bio3 : constants.max.bio4 : userDonations.perks < 20 ? constants.max.bio1 : constants.max.bio2}
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
			</div>
		</RequireUser>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<EditProfileBioPageProps>
{
	const [bio, emojiSettings, userDonations] = await Promise.all([
		this.query('v1/users/bio', { id }),
		this.query('v1/settings/emoji'),
		this.query('v1/users/donations', { id }),
	]);

	return { bio, emojiSettings, userDonations };
}

export const loader = routerUtils.wrapLoader(loadData);

type EditProfileBioPageProps = {
	bio: UserBioType
	emojiSettings: EmojiSettingType[]
	userDonations: UserDonationsType
};

export default EditProfileBioPage;
