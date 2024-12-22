import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as accounts from '@accounts';
import * as APITypes from '@apiTypes';
import { APIThisType, ListingType } from '@types';

/*
 * Gives information needed to initiate real-world trade (address).
 */
async function address(this: APIThisType, { id, address }: addressProps): Promise<void>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'use-trading-post' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const listing: ListingType = await this.query('v1/trading_post/listing', { id: id });

	const listingStatuses = constants.tradingPost.listingStatuses;

	// only users involved in trade can submit address info
	// only if listing in right status
	if (![listing.creator.id, listing.offers.accepted?.user.id].includes(this.userId) ||
		![listingStatuses.offerAccepted, listingStatuses.inProgress].includes(listing.status))
	{
		throw new UserError('permission');
	}

	// Perform queries
	await db.transaction(async (query: any) =>
	{
		await accounts.updateAddress(
			{
				user_id: Number(this.userId),
				address: address,
			});

		const otherAddress = (await accounts.getUserData(this.userId === listing.creator.id ?
			listing.offers.accepted?.user.id : listing.creator.id)).address;

		// both have put in addresss
		if (utils.realStringLength(otherAddress) > 0)
		{
			await query(`
				UPDATE listing
				SET status = $2
				WHERE id = $1::int
			`, id, listingStatuses.inProgress);
		}

		await Promise.all([
			query(`
				UPDATE listing
				SET last_updated = NOW()
				WHERE id = $1::int
			`, id),
			this.query('v1/notification/create', {
				id: id,
				type: constants.notification.types.listingContact,
			}),
		]);
	});
}

address.apiTypes = {
	id: {
		type: APITypes.listingId,
		required: true,
	},
	address: {
		type: APITypes.string,
		default: '',
		required: true,
		length: constants.max.address,
		profanity: true,
	},
};

type addressProps = {
	id: number
	address: string
};

export default address;
