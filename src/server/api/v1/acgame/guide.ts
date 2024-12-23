import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants } from '@utils';
import { APIThisType, ACGameGuideType } from '@types';

async function guide(this: APIThisType, { id }: guideProps): Promise<ACGameGuideType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-guides' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [guides, modifyGuidesPerm] = await Promise.all([
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

	return guides.filter((g: any) => modifyGuidesPerm || !modifyGuidesPerm && g.last_published !== null).map((guide: any) =>
	{
		return {
			id: guide.id,
			name: guide.updated_name && modifyGuidesPerm ? guide.updated_name : guide.name,
			description: guide.updated_description && modifyGuidesPerm ? guide.updated_description : guide.description,
		};
	});
}

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
