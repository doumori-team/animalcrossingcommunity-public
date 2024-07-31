import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants } from '@utils';
import { APIThisType, FaceType } from '@types';

async function face(this: APIThisType, {id}: faceProps) : Promise<FaceType[]>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'modify-towns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			face.id,
			face.filename
		FROM ac_game_face
		JOIN face ON (ac_game_face.face_id = face.id)
		WHERE ac_game_face.game_id = $1::int
		ORDER BY face.id ASC
	`, id);
}

face.apiTypes = {
	id: {
		type: APITypes.acgameId,
		required: true,
	},
}

type faceProps = {
	id: number
}

export default face;