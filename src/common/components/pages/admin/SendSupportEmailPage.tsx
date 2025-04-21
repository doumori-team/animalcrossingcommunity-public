import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { Form, Text, TextArea } from '@form';
import { Header, Section } from '@layout';
import { constants } from '@utils';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const SendSupportEmailPage = () =>
{
	return (
		<div className='SendSupportEmailPage'>
			<RequirePermission permission='process-user-tickets'>
				<Header
					name={`Send New Support Email`}
					links={
						<Link to={`/support-emails`}>
							Dashboard
						</Link>
					}
				/>

				<Section>
					<Form
						action='v1/support_email/send'
						callback='/support-email/:id'
						showButton
					>
						<Form.Group>
							<Text
								label='To User'
								name='toUser'
								maxLength={constants.max.searchUsername}
							/>
						</Form.Group>
						<Form.Group>
							<Text
								label='Subject'
								name='subject'
								maxLength={constants.max.subject}
							/>
						</Form.Group>
						<Form.Group>
							<TextArea
								name='message'
								label='Message'
								rows={10}
								maxLength={constants.max.email}
							/>
						</Form.Group>
					</Form>
				</Section>
			</RequirePermission>
		</div>
	);
};

export default SendSupportEmailPage;
