import { useState } from 'react';
import { Link, Params } from 'react-router';
import {
	PayPalButtons,
	PayPalScriptProvider,
	ReactPayPalScriptOptions,
} from '@paypal/react-paypal-js';

import { RequireGroup, RequireClientJS } from '@behavior';
import { constants, routerUtils } from '@utils';
import { ContentBox, ErrorMessage } from '@layout';
import { Form, Text } from '@form';
import { APIThisType } from '@types';
import { iso } from 'common/iso.ts';

export const action = routerUtils.formAction;

export const shouldRevalidate = routerUtils.shouldRevalidate;

const ConsentPage = ({ loaderData, params }: { loaderData: ConsentPageProps, params: Params }) =>
{
	const { age } = loaderData;
	const { id } = params;

	const [error, setError] = useState<string>('');

	const initialOptions: ReactPayPalScriptOptions = {
		clientId: process.env.PAYPAL_CLIENT_ID as string,
	};

	const createOrder = async () =>
	{
		setError('');

		return (await iso).query(null, 'v1/paypal/consent', { id })
			.then((data: { id: string }) =>
			{
				return data.id;
			})
			.catch((_: any) =>
			{
				setError('paypal-error');
			});
	};

	const onApprove = async (_: any, actions: any) =>
	{
		return actions.order.capture();
	};

	return (
		<div className='ConsentPage'>
			<RequireGroup group={constants.groupIdentifiers.anonymous}>
				<ContentBox>
					<p>Below, you have the option to give Animal Crossing Community (ACC) consent to allow your child to be a member of this site, or you can deny consent which will remove their information from our site.</p>
					<p>Animal Crossing Community (ACC) is an interactive web site for fans of the Nintendo game series, Animal Crossing. On ACC, your child will be able to interact with other members of ACC both in public and private discussions, and will be able to provide personally identifiable information about themselves, such as their email address, their name, their city/state and other information through their account profile. However, none of this is required. They can participate on ACC without having to provide any information other than their email address. And unless they specify otherwise, their email address will remain hidden from view from all ACC members except site Administrators and Moderators.</p>

					{age < 13 ?
						<>
							<p>If you choose to give consent, your consent must be in the form of a $0.30 donation to the site. This donation is done safely and securely through PayPal, and is simply an acceptable method of consent according to COPPA laws. The nominal fee is to cover the PayPal fees for the transaction. ACC receives no part of this donation. Upon completing the donation process through PayPal, you will be directed to a page with instructions for completing the signup process for your child.</p>
							<p>If you want more details about this, please consult our <Link to='/legal/privacy'>Privacy Policies</Link> and our <Link to='/legal/coppa'>About COPPA</Link> pages. Of, if you have any other questions, feel free to contact us at <a href={'mailto:support@animalcrossingcommunity.com'}>support@animalcrossingcommunity.com</a>, or you can respond to the email we sent you.</p>
							<p>Depending on the method of payment, your payment may clear PayPal within 30 minutes for credit cards, and within 5 days for e-checks. Once your payment clears, an email will be sent to the email provided containing instructions for your child to complete the signup for Animal Crossing Community.</p>
						</>
						:
						<p>If you want more details about this, please consult our <Link to='/legal/privacy'>Privacy Policies</Link> page. Or, if you have any other questions, feel free to contact us at <a href={'mailto:support@animalcrossingcommunity.com'}>support@animalcrossingcommunity.com</a>, or you can respond to the email we sent you.</p>
					}

					<Form
						action='v1/signup/consent_denied'
						showButton
						buttonText='No, I do not agree and deny consent for this child.'
						callback='/'
					>
						<input type='hidden' name='id' value={id} />
					</Form>

					{age < 13 ?
						<RequireClientJS fallback={
							<ErrorMessage identifier='javascript-required' />
						}
						>
							<p>
								Please note that consent through donation will be in USD.
							</p>

							<br/>

							{error &&
								<ErrorMessage identifier={error} />
							}

							<PayPalScriptProvider options={initialOptions}>
								<PayPalButtons
									createOrder={createOrder}
									onApprove={onApprove}
								/>
							</PayPalScriptProvider>
						</RequireClientJS>
						:
						<Form
							action='v1/signup/consent_given'
							showButton
							buttonText='Yes, I agree and wish to give consent for this child.'
							callback='/'
						>
							<input type='hidden' name='id' value={id} />

							<Form.Group>
								<Text
									type='email'
									name='email'
									label="Child's Email"
									pattern={constants.regexes.email}
									placeholder='123@abc.com'
									required
								/>
							</Form.Group>
						</Form>
					}
				</ContentBox>
			</RequireGroup>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<ConsentPageProps>
{
	const [age] = await Promise.all([
		this.query('v1/signup/age', { id: id }),
	]);

	return { age };
}

export const loader = routerUtils.wrapLoader(loadData);

type ConsentPageProps = {
	age: number
};

export default ConsentPage;
