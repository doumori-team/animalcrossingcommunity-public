import { faker } from '@faker-js/faker/locale/en';

import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, SuccessType, ListingType, ACGameItemType, ResidentsType } from '@types';

/*
 * Advanced Trading Post; able to do trade from start to end without doing it yourself
 */
async function trading_post(this: APIThisType, { gameId, listingId, step }: tradingPostProps): Promise<SuccessType>
{
	// You must be logged in and on a test site
	if (constants.LIVE_SITE)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters

	if (Number(gameId || 0) === 0)
	{
		if (gameId !== 'real-world')
		{
			throw new UserError('bad-format');
		}
	}
	else
	{
		gameId = Number(gameId || 0);

		const [checkId] = await db.query(`
			SELECT id
			FROM ac_game
			WHERE id = $1::int AND has_town = true
		`, gameId);

		if (!checkId)
		{
			throw new UserError('no-such-ac-game');
		}
	}

	let listing: ListingType | null = null;

	if (listingId)
	{
		listing = await this.query('v1/trading_post/listing', { id: listingId });
	}

	if (!listing && step !== 'create_trade')
	{
		throw new UserError('bad-format');
	}

	// Perform queries

	const offerStatuses = constants.tradingPost.offerStatuses;
	const listingStatuses = constants.tradingPost.listingStatuses;
	const listingTypes = constants.tradingPost.listingTypes;

	if (step === 'create_trade')
	{
		await db.transaction(async (query: any) =>
		{
			const type = faker.helpers.arrayElement([listingTypes.sell, listingTypes.buy]);

			const [listing] = await query(`
				INSERT INTO listing (creator_id, status, game_id, type)
				VALUES ($1::int, $2, $3::int, $4)
				RETURNING id
			`, this.userId, listingStatuses.open, Number(gameId || 0) > 0 ? gameId : null, type);

			const defaults = await getDefaultsForListing(gameId);

			const [listingOffer] = await query(`
				INSERT INTO listing_offer (user_id, listing_id, bells, status, comment)
				VALUES ($1::int, $2::int, $3, $4, $5)
				RETURNING id
			`, this.userId, listing.id, defaults.bells, offerStatuses.accepted, defaults.comment);

			await Promise.all([
				defaults.items.map(async(item) =>
				{
					const quantity = gameId === constants.gameIds.ACGC ? 1 : faker.string.numeric({ length: 1, exclude: ['0'] });

					await query(`
						INSERT INTO listing_offer_catalog_item (listing_offer_id, catalog_item_id, quantity)
						VALUES ($1::int, $2, $3::int)
					`, listingOffer.id, item.id, quantity);
				}),
			]);

			await Promise.all([
				defaults.residents.map(async (resident) =>
				{
					await query(`
						INSERT INTO listing_offer_resident (listing_offer_id, resident_id)
						VALUES ($1::int, $2)
					`, listingOffer.id, resident.id);
				}),
			]);
		});
	}
	else if (step === 'make_offers' && listing)
	{
		if (listing.status !== listingStatuses.open)
		{
			throw new UserError('bad-format');
		}

		let staffUserIds = await db.query(`
			SELECT users.id
			FROM users
			JOIN user_group ON (user_group.id = users.user_group_id)
			JOIN user_group AS staff_group ON (user_group.parent_id = staff_group.id)
			LEFT JOIN listing_offer ON (listing_offer.listing_id = $1::int AND listing_offer.user_id = users.id)
			WHERE staff_group.identifier = 'staff' AND listing_offer.id IS NULL
		`, listing.id);

		if (staffUserIds.length === 0)
		{
			throw new UserError('bad-format');
		}

		const offersToMake = Math.min(Number(faker.string.numeric({ length: 1, exclude: ['0'] })), staffUserIds.length);

		await db.transaction(async (query: any) =>
		{
			for (let i = 0; i < offersToMake; i++)
			{
				const offerUserId = (faker.helpers.arrayElement(staffUserIds) as any).id;
				staffUserIds = staffUserIds.filter((sui: any) => sui.id !== offerUserId);

				const defaults = await getDefaultsForListing(listing.game?.id);

				const [listingOffer] = await query(`
					INSERT INTO listing_offer (user_id, listing_id, bells, status, comment)
					VALUES ($1::int, $2::int, $3, $4, $5)
					RETURNING id
				`, offerUserId, listing.id, defaults.bells, offerStatuses.pending, defaults.comment);

				await Promise.all([
					defaults.items.map(async(item) =>
					{
						const quantity = gameId === constants.gameIds.ACGC ? 1 : faker.string.numeric({ length: 1, exclude: ['0'] });

						await query(`
							INSERT INTO listing_offer_catalog_item (listing_offer_id, catalog_item_id, quantity)
							VALUES ($1::int, $2, $3::int)
						`, listingOffer.id, item.id, quantity);
					}),
				]);

				await Promise.all([
					defaults.residents.map(async (resident) =>
					{
						await query(`
							INSERT INTO listing_offer_resident (listing_offer_id, resident_id)
							VALUES ($1::int, $2)
						`, listingOffer.id, resident.id);
					}),
				]);

				await query(`
					INSERT INTO listing_comment (user_id, listing_id, comment)
					VALUES ($1::int, $2::int, $3)
				`, offerUserId, listing.id, faker.lorem.sentence());
			}

			await query(`
				UPDATE listing
				SET last_updated = NOW()
				WHERE id = $1::int
			`, listing.id);
		});
	}
	else if (step === 'accept_offer' && listing)
	{
		if (listing.offers.accepted ||
			![listingStatuses.open, listingStatuses.offerAccepted, listingStatuses.inProgress].includes(listing.status))
		{
			throw new UserError('bad-format');
		}

		const offer = faker.helpers.arrayElement(listing.offers.list.filter(o => o.status === offerStatuses.pending));

		if (!offer)
		{
			throw new UserError('bad-format');
		}

		if ([offerStatuses.rejected, offerStatuses.cancelled].includes(offer.status))
		{
			throw new UserError('bad-format');
		}

		await db.transaction(async (query: any) =>
		{
			await query(`
				UPDATE listing_offer
				SET status = $2
				WHERE id = $1::int
			`, offer.id, offerStatuses.accepted);

			await query(`
				UPDATE listing_offer
				SET status = $3
				WHERE id != $1::int AND listing_id = $2::int AND status = $4
			`, offer.id, listing.id, offerStatuses.onHold, offerStatuses.pending);

			await query(`
				UPDATE listing
				SET status = $2, last_updated = NOW()
				WHERE id = $1::int
			`, listing.id, listingStatuses.offerAccepted);

			if (!listing.game)
			{
				const updatedListing: ListingType = await this.query('v1/trading_post/listing', { id: listing.id });

				if (updatedListing.address && updatedListing.offers.accepted?.address)
				{
					await query(`
						UPDATE listing
						SET status = $2
						WHERE id = $1::int
					`, listing.id, listingStatuses.inProgress);
				}
			}
		});
	}
	else if (step === 'share_info' && listing)
	{
		if (![listingStatuses.offerAccepted, listingStatuses.inProgress].includes(listing.status))
		{
			throw new UserError('bad-format');
		}

		// can't do real-world trades from here
		// involves accounts website, which won't save real user's addresses from test site
		// do it manually instead
		if (!listing.game)
		{
			throw new UserError('bad-format');
		}
		else if (listing.game.id === constants.gameIds.ACGC)
		{
			await db.transaction(async (query: any) =>
			{
				await Promise.all([[listing.creator.id, listing.offers.accepted?.user.id].map(async (userId) =>
				{
					let [character] = await query(`
						SELECT character.id
						FROM character
						JOIN town ON (character.town_id = town.id)
						WHERE town.user_id = $1::int
					`, userId);

					if (!character)
					{
						await this.query('v1/automation/other/town', { gameId: listing.game?.id, userId: userId });

						[character] = await query(`
							SELECT character.id
							FROM character
							JOIN town ON (character.town_id = town.id)
							WHERE town.user_id = $1::int
						`, userId);
					}

					const [offer] = await query(`
						SELECT
							listing_offer.id
						FROM listing_offer
						WHERE listing_offer.listing_id = $1::int AND listing_offer.user_id = $2::int
					`, listing.id, userId);

					await query(`
						UPDATE listing_offer
						SET character_id = $2::int
						WHERE id = $1::int
					`, offer.id, character.id);

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
						let itemOffer = userId === listing.creator.id ? listing.offers.accepted : null;

						if (userId !== listing.creator.id)
						{
							[itemOffer] = await query(`
								SELECT
									id
								FROM listing_offer
								WHERE listing_id = $1::int AND user_id = $2::int
							`, listing.id, listing.creator.id);
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

					items.map(async(item: any) =>
					{
						const secretCode = `${faker.string.alphanumeric(14)} ${faker.string.alphanumeric(14)}`;

						await query(`
							UPDATE listing_offer_catalog_item
							SET secret_code = $2
							WHERE id = $1::int
						`, item.id, secretCode);
					});
				})]);

				await query(`
					UPDATE listing
					SET status = $2, last_updated = NOW()
					WHERE id = $1::int
				`, listing.id, listingStatuses.inProgress);
			});
		}
		else
		{
			await db.transaction(async (query: any) =>
			{
				let methods = ['friend_code', 'character'];

				if (listing.game?.id === constants.gameIds.ACNH)
				{
					methods.push('dodo_code');
				}

				const method = faker.helpers.arrayElement(methods);

				if (method === 'friend_code')
				{
					await Promise.all([[listing.creator.id, listing.offers.accepted?.user.id].map(async (userId) =>
					{
						let [friendCode] = await query(`
							SELECT
								friend_code.friend_code
							FROM friend_code
							JOIN ac_game_game ON (ac_game_game.game_id = friend_code.game_id)
							WHERE friend_code.user_id = $1::int AND ac_game_game.acgame_id = $2::int
						`, userId, listing.game?.id);

						if (!friendCode)
						{
							await this.query('v1/automation/other/town', { gameId: listing.game?.id, userId: userId });

							[friendCode] = await query(`
								SELECT
									friend_code.friend_code
								FROM friend_code
								JOIN ac_game_game ON (ac_game_game.game_id = friend_code.game_id)
								WHERE friend_code.user_id = $1::int AND ac_game_game.acgame_id = $2::int
							`, userId, listing.game?.id);
						}

						let offer = userId === listing.creator.id ? null : listing.offers.accepted;

						if (userId === listing.creator.id)
						{
							[offer] = await query(`
								SELECT
									id
								FROM listing_offer
								WHERE listing_id = $1::int AND user_id = $2::int
							`, listing.id, listing.creator.id);
						}

						await query(`
							UPDATE listing_offer
							SET friend_code = $2
							WHERE id = $1::int
						`, offer?.id, friendCode.friend_code);
					})]);
				}
				else if (method === 'character')
				{
					await Promise.all([[listing.creator.id, listing.offers.accepted?.user.id].map(async (userId) =>
					{
						let [friendCode] = await query(`
							SELECT
								friend_code.friend_code,
								friend_code_character.character_id
							FROM friend_code
							JOIN friend_code_character ON (friend_code.id = friend_code_character.friend_code_id)
							JOIN ac_game_game ON (ac_game_game.game_id = friend_code.game_id)
							WHERE friend_code.user_id = $1::int AND ac_game_game.acgame_id = $2::int
						`, userId, listing.game?.id);

						if (!friendCode)
						{
							await this.query('v1/automation/other/town', { gameId: listing.game?.id, userId: userId });

							[friendCode] = await query(`
								SELECT
									friend_code.friend_code,
									friend_code_character.character_id
								FROM friend_code
								JOIN friend_code_character ON (friend_code.id = friend_code_character.friend_code_id)
								JOIN ac_game_game ON (ac_game_game.game_id = friend_code.game_id)
								WHERE friend_code.user_id = $1::int AND ac_game_game.acgame_id = $2::int
							`, userId, listing.game?.id);
						}

						let offer = userId === listing.creator.id ? null : listing.offers.accepted;

						if (userId === listing.creator.id)
						{
							[offer] = await query(`
								SELECT
									id
								FROM listing_offer
								WHERE listing_id = $1::int AND user_id = $2::int
							`, listing.id, listing.creator.id);
						}

						await query(`
							UPDATE listing_offer
							SET character_id = $2::int, friend_code = $3
							WHERE id = $1::int
						`, offer?.id, friendCode.character_id, friendCode.friend_code);
					})]);
				}
				else if (method === 'dodo_code')
				{
					const userId = faker.helpers.arrayElement([listing.creator.id, listing.offers.accepted?.user.id]);

					let offer = userId === listing.creator.id ? null : listing.offers.accepted;

					if (userId === listing.creator.id)
					{
						[offer] = await query(`
							SELECT
								id
							FROM listing_offer
							WHERE listing_id = $1::int AND user_id = $2::int
						`, listing.id, listing.creator.id);
					}

					const dodoCode = faker.string.alphanumeric(5);

					await query(`
						UPDATE listing_offer
						SET dodo_code = $2
						WHERE id = $1::int
					`, offer?.id, dodoCode);
				}

				await query(`
					UPDATE listing
					SET status = $2, last_updated = NOW()
					WHERE id = $1::int
				`, listing.id, listingStatuses.inProgress);
			});
		}
	}
	else if (step === 'complete_trade' && listing)
	{
		if (![listingStatuses.inProgress].includes(listing.status))
		{
			throw new UserError('bad-format');
		}

		await db.transaction(async (query: any) =>
		{
			await query(`
				UPDATE listing_offer
				SET completed = true
				WHERE listing_id = $1::int AND (user_id = $2::int OR user_id = $3::int)
			`, listing.id, listing.creator.id, listing.offers.accepted?.user.id);

			await query(`
				UPDATE listing
				SET status = $2, last_updated = NOW()
				WHERE id = $1::int
			`, listing.id, listingStatuses.completed);

			await query(`
				UPDATE listing_offer
				SET status = $2
				WHERE listing_id = $1::int AND status = $3
			`, listing.id, offerStatuses.rejected, offerStatuses.onHold);
		});
	}
	else if (step === 'submit_feedback' && listing)
	{
		if (![listingStatuses.completed, listingStatuses.failed].includes(listing.status))
		{
			throw new UserError('bad-format');
		}

		const ratingConfig = constants.rating.configs;

		const ratingIds = [ratingConfig.positive.id, ratingConfig.neutral.id, ratingConfig.negative.id];

		await db.transaction(async (query: any) =>
		{
			await Promise.all([[listing.creator.id, listing.offers.accepted?.user.id].map(async (userId) =>
			{
				const ratingUserId = userId === listing.creator.id ?
					listing.offers.accepted?.user.id : listing.creator.id;

				const [rating] = await query(`
					INSERT INTO rating (user_id, rating_user_id, rating, comment, listing_id)
					VALUES ($1::int, $2::int, $3, $4::text, $5::int)
					RETURNING id
				`, userId, ratingUserId, faker.helpers.arrayElement(ratingIds), faker.lorem.sentence(), listing.id);

				await query(`
					UPDATE listing_offer
					SET rating_id = $2::int
					WHERE listing_id = $1::int AND user_id = $3::int
				`, listing.id, rating.id, userId);
			})]);

			await query(`
				UPDATE listing
				SET status = $2, last_updated = NOW()
				WHERE id = $1::int
			`, listing.id, listingStatuses.closed);
		});
	}

	return {
		_success: `Your trade has been created / updated!`,
	};
}

/*
 * Grabs trading elements for listing / offer.
 */
async function getDefaultsForListing(gameId: number | string | null | undefined): Promise<{ bells: number | null, comment: string, items: ACGameItemType[number]['all']['items'], residents: ResidentsType[number] }>
{
	let bells: number | null = null, comment = '', items: ACGameItemType[number]['all']['items'] = [], residents: ResidentsType[number] = [];

	if (gameId === 'real-world' || gameId === undefined)
	{
		const catalogItems: ACGameItemType[number]['all']['items'] = (await ACCCache.get(constants.cacheKeys.sortedCategories))['all']['items'];

		items = faker.helpers.arrayElements(catalogItems, 10);
	}
	else if (gameId === constants.gameIds.ACGC)
	{
		const catalogItems: ACGameItemType[number]['all']['items'] = (await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${gameId}_all_items`)).filter((item: ACGameItemType[number]['all']['items'][number]) => item.tradeable);

		items = faker.helpers.arrayElements(catalogItems, 10);
	}
	else
	{
		const categories = faker.helpers.arrayElements(['items', 'residents', 'bells', 'comment'], 2);

		if (categories.includes('items'))
		{
			const catalogItems: ACGameItemType[number]['all']['items'] = (await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${gameId}_all_items`)).filter((item: ACGameItemType[number]['all']['items'][number]) => item.tradeable);

			items = faker.helpers.arrayElements(catalogItems, 10);
		}

		if (categories.includes('residents') && gameId)
		{
			const sortedResidents: ResidentsType = await ACCCache.get(constants.cacheKeys.residents);
			residents = faker.helpers.arrayElements(sortedResidents[Number(gameId)], 5);
		}

		if (categories.includes('bells'))
		{
			bells = Number(faker.number.int(99999));
		}

		if (categories.includes('comment'))
		{
			comment = faker.lorem.sentence();
		}
	}

	return { bells, comment, items, residents };
}

trading_post.apiTypes = {
	gameId: {
		type: APITypes.string,
		nullable: true,
	},
	listingId: {
		type: APITypes.number,
		nullable: true,
	},
	step: {
		type: APITypes.string,
		default: '',
		includes: ['create_trade', 'make_offers', 'accept_offer', 'share_info', 'complete_trade', 'submit_feedback'],
		required: true,
	},
};

type tradingPostProps = {
	gameId: string | null | number
	listingId: string | null
	step: 'create_trade' | 'make_offers' | 'accept_offer' | 'share_info' | 'complete_trade' | 'submit_feedback'
};

export default trading_post;
