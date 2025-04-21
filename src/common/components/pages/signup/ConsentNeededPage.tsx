import { Params } from 'react-router';

import { RequireGroup } from '@behavior';
import { constants, routerUtils } from '@utils';
import { ContentBox } from '@layout';
import { Form, Text } from '@form';

export const action = routerUtils.formAction;

const ConsentNeededPage = ({ params }: { params: Params }) =>
{
	const { id } = params;

	return (
		<div className='ConsentNeededPage'>
			<RequireGroup group={constants.groupIdentifiers.anonymous}>
				<ContentBox>
					<p>Before you can continue to be a member of Animal Crossing Community, we need your parent's permission. Please type their email below and click "Submit", and we will send them an email asking for their permission.</p>

					<Form action='v1/signup/consent_needed' callback='/' showButton>
						<input type='hidden' name='id' value={id} />

						<Form.Group>
							<Text
								type='email'
								name='email'
								label='Email'
								pattern={constants.regexes.email}
								placeholder='123@abc.com'
								required
							/>
						</Form.Group>
					</Form>
				</ContentBox>
			</RequireGroup>
		</div>
	);
};

export default ConsentNeededPage;
