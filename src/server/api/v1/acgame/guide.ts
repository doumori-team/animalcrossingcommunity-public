import * as db from '@db';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { APIThisType, ACGameGuideType } from '@types';

async function guide(this: APIThisType, { id }: guideProps): Promise<ACGameGuideType[]>
{
	const [guides, modifyGuidesPerm]: [{
		id: number
		name: string
		updated_name: string | null
		description: string
		updated_description: string | null
		last_published: Date | null
	}[], boolean] = await Promise.all([
		db.cacheQuery(constants.cacheKeys.guides, `
			SELECT
				id,
				name,
				updated_name,
				description,
				updated_description,
				last_published
			FROM guide
			WHERE game_id = $1::int
			ORDER BY name ASC, updated_name ASC
		`, id),
		this.query('v1/permission', { permission: 'modify-guides' }),
	]);

	return guides.filter(g => modifyGuidesPerm || !modifyGuidesPerm && g.last_published !== null).map(guide =>
	{
		return {
			id: guide.id,
			name: guide.updated_name && modifyGuidesPerm ? guide.updated_name : guide.name,
			description: guide.updated_description && modifyGuidesPerm ? guide.updated_description : guide.description,
		};
	});
}

guide.permissions = [
	'view-guides',
];

guide.apiTypes = {
	id: {
		type: APITypes.acgameId,
		required: true,
	},
};

type guideProps = {
	id: number
};

export default guide;
