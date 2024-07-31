import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, ListingType } from '@types';

async function save(this: APIThisType, {id, rating, comment, userId, listingId, adoptionNodeId, shopNodeId}: saveProps) : Promise<number|null>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'use-friend-codes'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	if (adoptionNodeId > 0)
	{
		const [check] = await db.query(`
			SELECT adoptee_id, scout_id
			FROM adoption
			WHERE node_id = $1::int
		`, adoptionNodeId);

		if (!check)
		{
			throw new UserError('no-such-node');
		}

		// only adoptee can submit feedback
		if (check.adoptee_id !== this.userId)
		{
			throw new UserError('permission');
		}

		userId = check.scout_id;
	}

	if (this.userId === userId)
	{
		throw new UserError('bad-format');
	}

	const listingStatuses = constants.tradingPost.listingStatuses;

	if (listingId > 0)
	{
		const listing:ListingType = await this.query('v1/trading_post/listing', {id: listingId});

		// only users involved in trade can submit
		// only if listing in right status
		if (![listing.creator.id, listing.offers.accepted?.user.id].includes(this.userId) ||
			![listingStatuses.completed, listingStatuses.failed].includes(listing.status))
		{
			throw new UserError('permission');
		}
	}

	if (shopNodeId > 0)
	{
		const [shopNode] = await db.query(`
			SELECT node.user_id
			FROM shop_node
			JOIN node ON (node.id = shop_node.node_id)
			JOIN user_node_permission ON (user_node_permission.node_id = node.id)
			WHERE shop_node.node_id = $1 AND node.locked IS NOT NULL AND user_node_permission.granted = true AND user_node_permission.node_permission_id = $2 AND user_node_permission.user_id = $3
		`, shopNodeId, constants.nodePermissions.read, this.userId);

		if (!shopNode)
		{
			throw new UserError('permission');
		}

		userId = shopNode.user_id;
	}

	// Perform queries
	if (id != null && id > 0)
	{
		let [checkId] = await db.query(`
			SELECT user_id
			FROM rating
			WHERE id = $1::int
		`, id);

		if (!checkId)
		{
			throw new UserError('no-such-rating');
		}

		if (checkId.user_id != this.userId)
		{
			throw new UserError('permission');
		}

		await db.query(`
			UPDATE rating
			SET rating = $2, comment = $3::text, last_updated = 'now'
			WHERE id = $1::int
		`, id, rating, comment);
	}
	else
	{
		const [newRating] = await db.query(`
			INSERT INTO rating (user_id, rating_user_id, rating, comment)
			VALUES ($1::int, $2::int, $3, $4::text)
			RETURNING id
		`, this.userId, userId, rating, comment);

		id = newRating.id;

		const types = constants.notification.types;

		if (listingId > 0)
		{
			await db.transaction(async (query:any) =>
			{
				await Promise.all([
					query(`
						UPDATE rating
						SET listing_id = $2::int
						WHERE id = $1::int
					`, id, listingId),
					query(`
						UPDATE listing_offer
						SET rating_id = $2::int
						WHERE listing_id = $1::int AND user_id = $3::int
					`, listingId, id, this.userId),
					query(`
						UPDATE listing
						SET last_updated = NOW()
						WHERE id = $1::int
					`, listingId),
				]);
			});

			const [updatedListing] = await Promise.all([
				this.query('v1/trading_post/listing', {id: listingId}),
				this.query('v1/notification/create', {
					id: listingId,
					type: types.listingFeedback
				}),
			]);

			if (updatedListing.offers.accepted.rating && updatedListing.rating)
			{
				await db.query(`
					UPDATE listing
					SET status = $2
					WHERE id = $1::int
				`, listingId, listingStatuses.closed);
			}
		}

		if (adoptionNodeId > 0)
		{
			await db.query(`
				UPDATE rating
				SET adoption_node_id = $2::int
				WHERE id = $1::int
			`, id, adoptionNodeId);

			await this.query('v1/notification/create', {
				id: adoptionNodeId,
				type: types.scoutFeedback
			});
		}

		if (shopNodeId > 0)
		{
			await db.query(`
				UPDATE rating
				SET shop_node_id = $2::int
				WHERE id = $1::int
			`, id, shopNodeId);
		}
	}

	return id;
}

save.apiTypes = {
	id: {
		type: APITypes.number,
		nullable: true,
	},
	rating: {
		type: APITypes.string,
		default: '',
		includes: [constants.rating.configs.positive.id, constants.rating.configs.neutral.id, constants.rating.configs.negative.id],
		required: true,
	},
	comment: {
		type: APITypes.string,
		default: '',
		length: constants.max.comment,
		profanity: true,
	},
	userId: {
		type: APITypes.userId,
		nullable: true,
	},
	listingId: {
		type: APITypes.number,
		default: 0,
	},
	adoptionNodeId: {
		type: APITypes.number,
		default: 0,
	},
	shopNodeId: {
		type: APITypes.number,
		default: 0,
	},
}

type saveProps = {
	id: number|null
	rating: string
	comment: string
	userId: number|null
	listingId: number
	adoptionNodeId: number
	shopNodeId: number
}

export default save;