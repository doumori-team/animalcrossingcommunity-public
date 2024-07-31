import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

async function save(this: APIThisType, {gameId, hemisphereId, categories}: saveProps) : Promise<SuccessType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// check params

	let settings:any = [];

	if (hemisphereId > 0)
	{
		const checmHemisphereId = await db.query(`
			SELECT id
			FROM hemisphere
			WHERE id = $1::int
		`, hemisphereId);

		if (!checmHemisphereId)
		{
			throw new UserError('bad-format');
		}
	}

	await Promise.all(categories.map(async (value) =>
	{
		let gameId = value.substring(0, value.indexOf('_'));
		const categoryId = value.substring(value.indexOf('_')+'_'.length);

		if (isNaN(gameId))
		{
			throw new UserError('no-such-ac-game');
		}

		const checkCatGameId = await db.query(`
			SELECT id
			FROM ac_game
			WHERE id = $1::int
		`, gameId);

		if (!checkCatGameId)
		{
			throw new UserError('no-such-ac-game');
		}

		if (isNaN(categoryId))
		{
			throw new UserError('bad-format');
		}

		const checkCategoryId = await db.query(`
			SELECT id
			FROM calendar_category
			WHERE id = $1::int
		`, categoryId);

		if (!checkCategoryId)
		{
			throw new UserError('bad-format');
		}

		gameId = Number(gameId);

		if (gameId === constants.gameIds.ACNH && hemisphereId === 0)
		{
			throw new UserError('missing-hemisphere');
		}

		const setting = settings.find((s:any) => s.id === gameId);

		if (!setting)
		{
			settings.push({
				id: gameId,
				hemisphereId: gameId === constants.gameIds.ACNH ? hemisphereId : null,
				categories: [Number(categoryId)],
			});
		}
		else
		{
			setting.categories.push(Number(categoryId));
		}
	}));

	// update settings

	await db.transaction(async (query:any) =>
	{
		await query(`
			DELETE FROM calendar_setting WHERE user_id = $1::int
		`, this.userId);

		if (settings.length === 0)
		{
			return { _success: 'Your calendar settings have been updated.' };
		}

		settings.map(async (setting:any) => {
			const [calendarSetting] = await query(`
				INSERT INTO calendar_setting (user_id, game_id, hemisphere_id, homepage) VALUES
				($1::int, $2::int, $3, $4)
				RETURNING id
			`, this.userId, setting.id, setting.hemisphereId, setting.id === gameId);

			setting.categories.map(async (categoryId:number) => {
				await query(`
					INSERT INTO calendar_setting_category (calendar_setting_id, category_id) VALUES
					($1::int, $2::int)
				`, calendarSetting.id, categoryId);
			});
		});
	});

	return {
		_success: 'Your calendar settings have been updated.',
		_callbackFirst: true,
	};
}

save.apiTypes = {
	gameId: {
		type: APITypes.acgameId,
		required: true,
	},
	hemisphereId: {
		type: APITypes.number,
		default: 0,
	},
	categories: {
		type: APITypes.array,
	},
}

type saveProps = {
	gameId: number
	hemisphereId: number
	categories: any[]
}

export default save;