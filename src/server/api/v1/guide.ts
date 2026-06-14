import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, GuideType, UserLiteType } from '@types';

async function guide(this: APIThisType, { id }: guideProps): Promise<GuideType>
{
	const [guide]: [{
		id: number
		name: string
		updated_name: string | null
		game_id: number
		shortname: string
		description: string
		updated_description: string | null
		content: string
		updated_content: string | null
		last_updated: Date
		updated_user_id: number
		last_published: Date
	} | undefined] = await db.cacheQuery(constants.cacheKeys.guides, `
		SELECT
			guide.id,
			guide.name,
			guide.updated_name,
			guide.game_id,
			ac_game.shortname,
			guide.description,
			guide.updated_description,
			guide.content,
			guide.updated_content,
			guide.last_updated,
			guide.updated_user_id,
			guide.last_published
		FROM guide
		JOIN ac_game ON (ac_game.id = guide.game_id)
		WHERE guide.id = $1::int
	`, id);

	if (!guide)
	{
		throw new UserError('no-such-guide');
	}

	let returnGuide: GuideType = {
		id: guide.id,
		name: guide.name,
		description: guide.description,
		content: guide.content,
		game: {
			id: guide.game_id,
			shortname: guide.shortname,
		},
	};

	const [modifyGuidesPerm, user]: [boolean, UserLiteType] = await Promise.all([
		this.query('v1/permission', { permission: 'modify-guides' }),
		this.query('v1/user_lite', { id: guide.updated_user_id }),
	]);

	if (modifyGuidesPerm)
	{
		returnGuide.updatedContent = guide.updated_content;
		returnGuide.updatedDescription = guide.updated_description;
		returnGuide.updatedName = guide.updated_name;
		returnGuide.formattedLastUpdated = dateUtils.formatDateTime(guide.last_updated);
		returnGuide.user = user;
		returnGuide.formattedLastPublished = guide.last_published ? dateUtils.formatDateTime(guide.last_published) : 'Unpublished';
		returnGuide.hasChanges = dateUtils.isAfterTimezone2(guide.last_updated, guide.last_published);
	}

	return returnGuide;
}

guide.permissions = [
	'view-guides',
];

guide.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type guideProps = {
	id: number
};

export default guide;
