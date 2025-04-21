import { redirect } from 'react-router';

import { testSitePassword } from 'server/cookies.server.ts';
import { constants } from '@utils';
import { RequireTestSite } from '../behavior';

const acc_beta = process.env.TEST_SITE_PASSWORD;

export async function action({ request }: { request: any }): Promise<any>
{
	const formData: FormData = await request.formData();

	const password = String(formData.get('acc_beta') || '');

	if (password === acc_beta)
	{
		const cookieHeader = request.headers.get('Cookie');
		const cookie = await testSitePassword.parse(cookieHeader) || {};

		cookie.accBeta = acc_beta;

		return redirect('/', {
			headers: {
				'Set-Cookie': await testSitePassword.serialize(cookie),
			},
		});
	}

	return {
		incorrect: true,
	};
};

const TestSitePassword = ({ actionData }: { actionData: any }) =>
{
	return (
		<RequireTestSite>
			<form method='post' encType='multipart/form-data'>
				<img src={`${constants.AWS_URL}/images/layout/acc-banner-logo.png`} alt='Animal Crossing Community' />

				<p>
					{actionData?.incorrect ?
						'The password you entered was incorrect. You might have mistyped it. Please check the staff boards for the correct password.' :
						'To access this development test site, please enter the testing password, which you can find on the staff boards.'
					}
				</p>

				<input name='acc_beta' type='text' />
				<input type='submit' value='Enter' />
			</form>
		</RequireTestSite>
	);
};

export default TestSitePassword;
