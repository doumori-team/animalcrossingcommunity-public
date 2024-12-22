import React from 'react';
import { Link } from 'react-router-dom';

import { RequireGroup } from '@behavior';
import { constants } from '@utils';
import { ContentBox } from '@layout';
import { Form, Text } from '@form';
import { dateUtils } from '@utils';

const SignupPage = () =>
{
	return (
		<div className='SignupPage'>
			<RequireGroup group={constants.groupIdentifiers.anonymous}>
				<ContentBox>
					<p>Please read the <Link to='/legal/tos'>Terms of Service</Link>, <Link to='/rules'>Site Rules</Link>, <Link to='/legal/policies'>Site Policies</Link> and <Link to='/legal/privacy'>Privacy Policies</Link> carefully. If you are under 16, ask a parent or guardian to read through it with you. These are not the usual legal jargon that comes at the beginning of software installs (you know, that screen where you quickly click I Accept). These are a summary of the main rules that you must follow to be a member of this site. You will be responsible for these rules whether you read them or not, so be sure you understand them, and <a href={'mailto:support@animalcrossingcommunity.com'}>reach out to support</a> if anything is unclear.</p>

					<Form action='v1/signup/signup' showButton>
						<Form.Group>
							<Text
								label='User Name'
								name='username'
								pattern={constants.regexes.username}
								required
								maxLength={constants.max.username}
								minLength={constants.min.username}
							/>
						</Form.Group>

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

						<Form.Group>
							<Text
								label='Date of Birth'
								type='date'
								name='birthday'
								required
								max={dateUtils.formatCurrentDateYearMonthDay()}
								min='1900-01-01'
							/>
						</Form.Group>
					</Form>

					<p>User names must be between 3 and 15 characters, and cannot contain spaces or special characters. Only numbers, letters, and underscores are allowed.</p>
					<p>A valid email address is required to join. A temporary password is sent to your email address to verify that your email address is valid.</p>
					<p>Note: Users are only allowed a single account. If you have an active account and have lost access to it, please do not create another account. Instead, email support@animalcrossingcommunity.com and explain the issue with accessing your account to receive assistance in recovering it.</p>
				</ContentBox>
			</RequireGroup>
		</div>
	);
};

export default SignupPage;
