import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, ListingType } from '@types';

/*
 * Gives information needed to initiate trade (character, secret codes, friend code, dodo code).
 */
async function code(this: APIThisType, { id, characterId, secretCodes, friendCode, dodoCode }: codeProps): Promise<void>
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

	// Check parameters
	const listing: ListingType = await this.query('v1/trading_post/listing', { id: id });

	if (listing.game?.id === constants.gameIds.ACGC && Number(characterId || 0) <= 0)
	{
		throw new UserError('bad-format');
	}

	secretCodes = secretCodes.filter((sc) => /\S/.test(sc));

	secretCodes = secretCodes.map(secretCode =>
	{
		if (!secretCode.match(RegExp(constants.regexes.secretCode)))
		{
			throw new UserError('bad-format');
		}

		return String(secretCode).trim();
	});

	const [offer] = await db.query(`
		SELECT
			id
		FROM listing_offer
		WHERE listing_id = $1::int AND user_id = $2::int
	`, id, this.userId);

	if (!offer)
	{
		throw new UserError('no-such-offer');
	}

	const listingStatuses = constants.tradingPost.listingStatuses;

	// only users involved in trade can submit codes
	// only if listing in right status
	if (![listing.creator.id, listing.offers.accepted?.user.id].includes(this.userId) ||
		![listingStatuses.offerAccepted, listingStatuses.inProgress].includes(listing.status))
	{
		throw new UserError('permission');
	}

	// Perform queries
	await db.transaction(async (query: any) =>
	{
		if (characterId > 0)
		{
			await query(`
				UPDATE listing_offer
				SET character_id = $2::int
				WHERE id = $1::int
			`, offer.id, characterId);

			if (Number(listing.game?.id || 0) > constants.gameIds.ACGC && utils.realStringLength(friendCode) === 0 && utils.realStringLength(dodoCode) === 0)
			{
				const [friendCode] = await query(`
					SELECT
						friend_code.friend_code
					FROM friend_code
					JOIN friend_code_character ON (friend_code.id = friend_code_character.friend_code_id)
					WHERE friend_code_character.character_id = $1::int
				`, characterId);

				if (friendCode.friend_code)
				{
					await query(`
						UPDATE listing_offer
						SET friend_code = $2
						WHERE id = $1::int
					`, offer.id, friendCode.friend_code);
				}
			}
		}

		if (secretCodes.length > 0)
		{
			// if sell, you're updating your own items
			// if buying, you're updating the other's items
			const listingTypes = constants.tradingPost.listingTypes;
			let items = [];

			if (listing.type === listingTypes.sell)
			{
				items = await query(`
					SELECT
						id
					FROM listing_offer_catalog_item
					WHERE listing_offer_id = $1::int
				`, offer.id);
			}
			else if (listing.type === listingTypes.buy)
			{
				let itemOffer = this.userId === listing.creator.id ? listing.offers.accepted : null;

				if (this.userId !== listing.creator.id)
				{
					[itemOffer] = await query(`
						SELECT
							id
						FROM listing_offer
						WHERE listing_id = $1::int AND user_id = $2::int
					`, id, listing.creator.id);
				}

				if (itemOffer !== null)
				{
					items = await query(`
						SELECT
							id
						FROM listing_offer_catalog_item
						WHERE listing_offer_id = $1::int
					`, itemOffer.id);
				}
			}

			items.map(async(item: any, index: any) =>
			{
				await query(`
					UPDATE listing_offer_catalog_item
					SET secret_code = $2
					WHERE id = $1::int
				`, item.id, secretCodes[index]);
			});
		}

		if (utils.realStringLength(friendCode) > 0)
		{
			await query(`
				UPDATE listing_offer
				SET friend_code = $2
				WHERE id = $1::int
			`, offer.id, friendCode);
		}

		if (utils.realStringLength(dodoCode) > 0)
		{
			await query(`
				UPDATE listing_offer
				SET dodo_code = $2
				WHERE id = $1::int
			`, offer.id, dodoCode);
		}
	});

	await db.transaction(async (query: any) =>
	{
		const updatedListing: ListingType = await this.query('v1/trading_post/listing', { id: id });

		const offerAccepted = updatedListing.offers.accepted;

		// either has put in character id (GC)
		// either has a dodo code (NH)
		// either have FCs (WW / CF / NL / NH)
		if (offerAccepted?.character || updatedListing.character ||
			(offerAccepted?.dodoCode || updatedListing.dodoCode) ||
			(offerAccepted?.friendCode || updatedListing.friendCode))
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

code.apiTypes = {
	id: {
		type: APITypes.listingId,
		required: true,
	},
	characterId: {
		type: APITypes.characterId,
		nullable: true,
	},
	secretCodes: {
		type: APITypes.array,
	},
	friendCode: {
		type: APITypes.string,
		default: '',
	},
	dodoCode: {
		type: APITypes.regex,
		regex: constants.regexes.dodoCode,
	},
};

type codeProps = {
	id: number
	characterId: number
	secretCodes: any[]
	friendCode: string
	dodoCode: string
};

export default code;
