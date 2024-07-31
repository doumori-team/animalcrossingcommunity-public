import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, ListingType, MarkupStyleType } from '@types';

async function comment(this: APIThisType, {id, comment, format}: commentProps) : Promise<void>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'use-trading-post'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const listing:ListingType = await this.query('v1/trading_post/listing', {id: id});

	const listingStatuses = constants.tradingPost.listingStatuses;

	// only users involved in trade can comment at a certain point
	// only if listing in right status
	if (![listingStatuses.open, listingStatuses.offerAccepted, listingStatuses.inProgress, listingStatuses.completed].includes(listing.status) ||
		([listingStatuses.offerAccepted, listingStatuses.inProgress, listingStatuses.completed].includes(listing.status) &&
		![listing.creator.id, listing.offers.accepted?.user.id].includes(this.userId)))
	{
		throw new UserError('permission');
	}

	const [blocked] = await db.query(`
		SELECT user_id
		FROM block_user
		WHERE block_user_id = $1::int AND user_id = $2::int
	`, this.userId, listing.creator.id);

	if (blocked)
	{
		throw new UserError('blocked');
	}

	// Perform queries
	const listingCommentId = await db.transaction(async (query:any) =>
	{
		const [[listingComment]] = await Promise.all([
			query(`
				INSERT INTO listing_comment (user_id, listing_id, comment, comment_format)
				VALUES ($1::int, $2::int, $3, $4)
				RETURNING id
			`, this.userId, id, comment, format),
			query(`
				UPDATE listing
				SET last_updated = NOW()
				WHERE id = $1::int
			`, id),
		]);

		return listingComment.id;
	});

	await this.query('v1/notification/create', {
		id: listingCommentId,
		type: constants.notification.types.listingComment
	});
}

comment.apiTypes = {
	id: {
		type: APITypes.listingId,
		required: true,
	},
	comment: {
		type: APITypes.string,
		default: '',
		required: true,
		length: constants.max.comment,
		profanity: true,
	},
	format: {
		type: APITypes.string,
		default: '',
		includes: ['markdown', 'bbcode', 'plaintext'],
		required: true,
	},
}

type commentProps = {
	id: number
	comment: string
	format: MarkupStyleType
}

export default comment;