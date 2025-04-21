import * as db from '@db';
import { constants } from '@utils';
import { APIThisType, TreasureType } from '@types';
import { UserError } from '@errors';

export default async function treasure(this: APIThisType): Promise<null | TreasureType>
{
	// You must be on a test site
	if (constants.LIVE_SITE)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		return null;
	}

	const treasureType = 'amount', bells = 100, treasureTypeId = 1;

	const [offer] = await db.query(`
		INSERT INTO treasure_offer (user_id, bells, type)
		VALUES ($1::int, $2::int, $3)
		RETURNING id
	`, this.userId, bells, treasureType);

	await db.regenerateTopBells({ userId: this.userId });

	return {
		treasureTypeId,
		id: offer.id,
	};
}
