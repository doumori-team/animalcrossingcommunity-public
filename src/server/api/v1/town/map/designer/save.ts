import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function save(this: APIThisType, { townId, data, dataUrl, cursorData, flipData, imageData }: saveProps): Promise<{ userId: number, townId: number }>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-towns' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	const [town] = await db.query(`
		SELECT user_id, game_id
		FROM town
		WHERE town.id = $1::int
	`, townId);

	if (town.user_id != this.userId)
	{
		throw new UserError('permission');
	}

	const colors = Object.values(utils.getMapColors(town.game_id));

	data = data.map(rgb =>
	{
		let id = colors.indexOf(rgb);

		if (isNaN(id) || id < 0 || id > colors.length - 1)
		{
			throw new UserError('bad-format');
		}

		return Number(id).toString(16).padStart(4, '0');
	});

	const mapInfo = utils.getMapInfo(town.game_id);
	const total = mapInfo.gridLength * mapInfo.width * (mapInfo.gridLength * mapInfo.height);

	if (data.length !== total)
	{
		throw new UserError('bad-format');
	}

	const rectTypes = constants.town.rectTypes;

	cursorData = cursorData.map(pos =>
	{
		let id = 0;

		for (let i = 1; i <= Object.keys(rectTypes).length; i++)
		{
			if (pos == (rectTypes as any)[i].value)
			{
				id = i;

				break;
			}
		}

		if (isNaN(id) || id <= 0)
		{
			throw new UserError('bad-format');
		}

		return Number(id).toString(16).padStart(4, '0');
	});

	if (cursorData.length !== total)
	{
		throw new UserError('bad-format');
	}

	flipData = flipData.map(rgb =>
	{
		let id = colors.indexOf(rgb);

		if (isNaN(id) || id < 0 || id > colors.length - 1)
		{
			throw new UserError('bad-format');
		}

		return Number(id).toString(16).padStart(4, '0');
	});

	if (flipData.length !== total)
	{
		throw new UserError('bad-format');
	}

	const images = Object.keys(utils.getMapImages(town.game_id));

	imageData = imageData.map(imageName =>
	{
		let id: any = images.indexOf(imageName);

		if (imageName === constants.town.noImageId)
		{
			id = constants.town.noImageId;
		}
		else
		{
			if (isNaN(id) || id < 0 || id > images.length - 1)
			{
				throw new UserError('bad-format');
			}
		}

		return Number(id).toString(16).padStart(4, '0');
	});

	if (imageData.length !== total)
	{
		throw new UserError('bad-format');
	}

	// Perform queries
	await db.transaction(async (query: any) =>
	{
		await query(`
			DELETE FROM map_design
			WHERE town_id = $1::int
		`, townId);

		await query(`
			INSERT INTO map_design (town_id, data_url, color_data, cursor_data, flip_data, image_data)
			VALUES ($1::int, $2, $3, $4, $5, $6)
		`, townId, dataUrl, data.join(''), cursorData.join(''), flipData.join(''), imageData.join(''));
	});

	return {
		townId: townId,
		userId: town.user_id,
	};
}

save.apiTypes = {
	townId: {
		type: APITypes.townId,
		required: true,
	},
	data: {
		type: APITypes.array,
		required: true,
	},
	dataUrl: {
		type: APITypes.string,
		default: '',
		required: true,
	},
	cursorData: {
		type: APITypes.array,
		required: true,
	},
	flipData: {
		type: APITypes.array,
		required: true,
	},
	imageData: {
		type: APITypes.array,
		required: true,
	},
};

type saveProps = {
	townId: number
	data: any[]
	dataUrl: string
	cursorData: any[]
	flipData: any[]
	imageData: any[]
};

export default save;
