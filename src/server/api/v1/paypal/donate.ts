import axios from 'axios';

import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function donate(this: APIThisType, { custom, type, amount }: donateProps): Promise<{ id: string }>
{
	const accessToken = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
	const PAYPAL_API_URL = constants.LIVE_SITE ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

	try
	{
		if (type === 'one-time')
		{
			const response = await axios.post(`${PAYPAL_API_URL}/v2/checkout/orders`,
				{
					purchase_units: [{
						amount: {
							value: amount,
							currency_code: 'USD',
						},
						description: `One-Time ACC Donation - ${amount}`,
						custom_id: custom,
					}],
					intent: 'CAPTURE',
					application_context: {
						shipping_preference: 'NO_SHIPPING',
					},
				}, {
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Basic ${accessToken}`,
					},
				});

			return {
				id: response.data.id,
			};
		}

		const planResponse = await axios.post(`${PAYPAL_API_URL}/v1/billing/plans`,
			{
				product_id: process.env.PAYPAL_PRODUCT_ID_MONTHLY,
				name: `Monthly ACC Donation Plan - ${amount}`,
				billing_cycles: [{
					tenure_type: 'REGULAR',
					sequence: 1,
					total_cycles: 0,
					pricing_scheme: {
						fixed_price: {
							value: amount,
							currency_code: 'USD',
						},
					},
					frequency: {
						interval_unit: 'MONTH',
						interval_count: 1,
					},
				}],
				payment_preferences: {
					auto_bill_outstanding: true,
					setup_fee_failure_action: 'CONTINUE',
					payment_failure_threshold: 1,
				},
			}, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Basic ${accessToken}`,
				},
			});

		return {
			id: planResponse.data.id,
		};
	}
	catch (error: any)
	{
		console.error('Error donating to paypal:', error.response ? error.response.data : error.message);

		throw error;
	}
}

donate.apiTypes = {
	custom: {
		type: APITypes.string,
		required: true,
	},
	type: {
		type: APITypes.string,
		required: true,
		includes: ['one-time', 'monthly'],
	},
	amount: {
		type: APITypes.number,
		required: true,
		min: constants.min.number,
		max: constants.max.donationAmount,
	},
};

type donateProps = {
	custom: string
	type: 'one-time' | 'monthly'
	amount: number
};

export default donate;
