import * as db from '@db';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { APIThisType, FaceType } from '@types';

async function face(this: APIThisType, { id }: faceProps): Promise<FaceType[]>
{
	return await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			face.id,
			face.filename
		FROM ac_game_face
		JOIN face ON (ac_game_face.face_id = face.id)
		WHERE ac_game_face.game_id = $1::int
		ORDER BY ac_game_face.id ASC
	`, id);
}

face.permissions = [
	'modify-towns',
];

face.apiTypes = {
	id: {
		type: APITypes.acgameId,
		required: true,
	},
};

type faceProps = {
	id: number
};

export default face;
