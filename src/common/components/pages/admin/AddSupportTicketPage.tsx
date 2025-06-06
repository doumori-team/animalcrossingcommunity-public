import { RequireUser, RequirePermission } from '@behavior';
import { Form, Text, Switch, Select, RichTextArea } from '@form';
import { Header, Section } from '@layout';
import { constants, routerUtils } from '@utils';
import { APIThisType, UserTicketBanLengthType, EmojiSettingType } from '@types';

export const action = routerUtils.formAction;

const AddSupportTicketPage = ({ loaderData }: { loaderData: AddSupportTicketPageProps }) =>
{
	const { banLengths, currentUserEmojiSettings } = loaderData;

	return (
		<div className='AddSupportTicketPage'>
			<RequireUser permission='submit-support-tickets'>
				<Header name='Create a Support Ticket' />

				<Section>
					<Form action='v1/support_ticket/create' callback='/support-ticket/:id' showButton>
						<Form.Group>
							<Text
								name='title'
								label='Title'
								maxLength={constants.max.postTitle}
							/>
						</Form.Group>

						<Form.Group>
							<RichTextArea
								textName='message'
								formatName='format'
								label='Message'
								emojiSettings={currentUserEmojiSettings}
								maxLength={constants.max.post1}
								required
							/>
						</Form.Group>

						<RequirePermission permission='process-user-tickets' silent>
							<Form.Group>
								<Text
									label='Username'
									name='username'
									maxLength={constants.max.searchUsername}
								/>
							</Form.Group>

							<Form.Group>
								<Switch
									name='staffOnly'
									label='Staff Only'
									value={true}
								/>
							</Form.Group>

							<Form.Group>
								<Select
									label='Current Ban Length'
									name='banLengthId'
									options={[{ id: null, description: 'Not Banned' } as any].concat(banLengths)}
									optionsMapping={{ value: 'id', label: 'description' }}
								/>
							</Form.Group>

							<Form.Group>
								<Text
									label='User Ticket ID'
									name='userTicketId'
									type='number'
								/>
							</Form.Group>
						</RequirePermission>
					</Form>
				</Section>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType): Promise<AddSupportTicketPageProps>
{
	const [banLengths, currentUserEmojiSettings] = await Promise.all([
		this.query('v1/user_ticket/ban_lengths'),
		this.query('v1/settings/emoji'),
	]);

	return { banLengths, currentUserEmojiSettings };
}

export const loader = routerUtils.wrapLoader(loadData);

type AddSupportTicketPageProps = {
	banLengths: UserTicketBanLengthType[]
	currentUserEmojiSettings: EmojiSettingType[]
};

export default AddSupportTicketPage;
