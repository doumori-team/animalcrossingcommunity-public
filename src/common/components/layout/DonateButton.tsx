import { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import {
	PayPalButtons,
	PayPalScriptProvider,
	ReactPayPalScriptOptions,
} from '@paypal/react-paypal-js';

import { RequireClientJS } from '@behavior';
import { constants } from '@utils';
import { UserContext } from '@contexts';
import { Checkbox } from '@form';
import { iso } from 'common/iso.ts';
import { Form, Check, Text } from '@form';
import { ErrorMessage, UserLookup } from '@layout';

const DonateButton = ({
	donate = false,
}: DonateButtonProps) =>
{
	const userContext = useContext(UserContext);
	const navigate = useNavigate();

	const [chosenUserId, setChosenUserId] = useState<number>(userContext ? userContext.id : 0);
	const [type, setType] = useState<'one-time' | 'monthly'>('one-time');
	const [amount, setAmount] = useState<string>('5.00');
	const [customAmount, setCustomAmount] = useState<number>();
	const [coverFees, setCoverFees] = useState<boolean>(false);
	const [error, setError] = useState<string>('');

	const getButton = (): any =>
	{
		return (
			<button type='submit'>
				<img src={`${constants.AWS_URL}/images/layout/donate.png`} className='DonateButton' alt='Donate' />
			</button>
		);
	};

	const onUsernameChange = (userId: string): void =>
	{
		setChosenUserId(Number(userId));
	};

	const handleCustomAmountChange = (e: any) =>
	{
		const value = e.target.value;

		// Allow only digits and up to one optional decimal with two digits
		if (value === '' || /^\d+(\.\d{0,2})?$/.test(value))
		{
			setCustomAmount(value);
		}
	};

	const getFee = (checkBoolean: boolean = false): string =>
	{
		if (checkBoolean)
		{
			if (!coverFees)
			{
				return '0';
			}
		}

		if (amount === '5.00')
		{
			return '0.65';
		}

		if (amount === '10.00')
		{
			return '0.80';
		}

		if (amount === '20.00')
		{
			return '1.10';
		}

		return '0';
	};

	const initialOptionsOrder: ReactPayPalScriptOptions = {
		clientId: process.env.PAYPAL_CLIENT_ID as string,
	};

	const initialOptionsSubscription: ReactPayPalScriptOptions = {
		clientId: process.env.PAYPAL_CLIENT_ID as string,
		vault: true,
		intent: 'subscription',
	};

	const createOrder = async () =>
	{
		setError('');

		const params = {
			custom: userContext ? `${chosenUserId}|${userContext.id}` : 'Anonymous',
			type,
			amount: amount === 'other' ? customAmount : Number(amount) + Number(getFee(true)),
		};

		return (await iso).query(null, 'v1/paypal/donate', params)
			.then((data: { id: string }) =>
			{
				return data.id;
			})
			.catch((_: any) =>
			{
				setError('paypal-error');
			});
	};

	const createSubscription = async (_: any, actions: any) =>
	{
		setError('');

		const params = {
			custom: userContext ? `${chosenUserId}|${userContext.id}` : 'Anonymous',
			type,
			amount: amount === 'other' ? customAmount : Number(amount) + Number(getFee(true)),
		};

		return (await iso).query(null, 'v1/paypal/donate', params)
			.then((data: { id: string }) =>
			{
				return actions.subscription.create({
					'plan_id': data.id,
					'custom_id': params.custom,
					'application_context': {
						'shipping_preference': 'NO_SHIPPING',
					},
				});
			})
			.catch((_: any) =>
			{
				setError('paypal-error');
			});
	};

	const onApprove = async (_: any, actions: any) =>
	{
		return actions.order.capture().then(function(_: any)
		{
			navigate('/donated');
		});
	};

	return (
		donate ?
			<RequireClientJS fallback={
				<ErrorMessage identifier='javascript-required' />
			}
			>
				<Form.Group>
					<Check
						label='Type'
						options={[
							{ id: 'one-time', name: 'One-Time' },
							{ id: 'monthly', name: 'Monthly' },
						]}
						name='type'
						defaultValue={type}
						onChangeHandler={(e: any) => setType(e.target.value)}
						required
					/>
				</Form.Group>

				<Form.Group>
					<Check
						label='Amount'
						options={[
							{ id: '5.00', name: '$5 USD' },
							{ id: '10.00', name: '$10 USD' },
							{ id: '20.00', name: '$20 USD' },
							{ id: 'other', name: 'Other' },
						]}
						name='amount'
						defaultValue={amount}
						onChangeHandler={(e: any) => setAmount(e.target.value)}
						required
					/>
				</Form.Group>

				{amount === 'other' ?
					<Form.Group>
						<Text
							name='amount'
							label='Amount (USD)'
							type='number'
							value={customAmount}
							required
							min={constants.min.number}
							max={constants.max.donationAmount}
							changeHandler={handleCustomAmountChange}
							step={0.01}
						/>
					</Form.Group>
					: <Checkbox
						type='checkbox'
						name='coverFees'
						checked={coverFees}
						label={`Add $${getFee()} to help cover the fees.`}
						clickHandler={(e: any) => setCoverFees(e.target.checked)}
					/>}

				{userContext &&
					<Form.Group>
						<UserLookup
							label='User To Donate For'
							options={[{ id: userContext.id, username: userContext.username }]}
							value={chosenUserId}
							changeHandler={onUsernameChange}
						/>
					</Form.Group>
				}

				<br/>

				{error &&
					<ErrorMessage identifier={error} />
				}

				<PayPalScriptProvider options={type === 'monthly' ? initialOptionsSubscription : initialOptionsOrder} key={type}>
					{type === 'monthly' ? <PayPalButtons
						createSubscription={createSubscription}
						onApprove={onApprove}
					/> : <PayPalButtons
						createOrder={createOrder}
						onApprove={onApprove}
					/>}
				</PayPalScriptProvider>
			</RequireClientJS>
			:
			<form action='/donate'>
				{getButton()}
			</form>

	);
};

type DonateButtonProps = {
	donate?: boolean
};

export default DonateButton;
