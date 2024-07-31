import React from 'react';
import { useParams } from 'react-router-dom';

import { RequireGroup } from '@behavior';
import { constants } from '@utils';
import { ContentBox } from '@layout';
import { Form, Text } from '@form';

const EmailNeededPage = () =>
{
	const {id} = useParams();

	return (
		<div className='EmailNeededPage'>
			<RequireGroup group={constants.groupIdentifiers.anonymous}>
				<ContentBox>
					<p>Your email is required to continue using ACC.</p>

					<Form action='v1/signup/email_needed' callback='/congrats' showButton>
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
}

export default EmailNeededPage;
