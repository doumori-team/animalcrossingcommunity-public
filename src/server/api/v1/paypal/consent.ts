import axios from 'axios';

import { UserError } from '@errors';
import { constants } from '@utils';
import { APIThisType } from '@types';
import * as APITypes from '@apiTypes';
import * as db from '@db';

async function consent(this: APIThisType, { id }: consentProps): Promise<{ id: string }>
{
	if (this.userId)
	{
		throw new UserError('permission');
	}

	const [user] = await db.query(`
		SELECT user_id
		FROM consent_log
		WHERE guid = $1
	`, id);

	if (!user)
	{
		throw new UserError('bad-format');
	}

	const accessToken = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
	const PAYPAL_API_URL = constants.LIVE_SITE ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

	try
	{
		const response = await axios.post(`${PAYPAL_API_URL}/v2/checkout/orders`,
			{
				purchase_units: [{
					amount: {
						value: 0.30,
						currency_code: 'USD',
					},
					description: 'Parental Consent',
					custom_id: id,
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
	catch (error: any)
	{
		console.error('Error consenting with paypal:', error.response ? error.response.data : error.message);

		throw error;
	}
}

consent.apiTypes = {
	id: {
		type: APITypes.uuid,
		required: true,
	},
};

type consentProps = {
	id: string
};

export default consent;
