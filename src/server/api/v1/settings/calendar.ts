import * as db from '@db';
import { UserError } from '@errors';
import { APIThisType, CalendarSettingType } from '@types';

export default async function calendar(this: APIThisType) : Promise<CalendarSettingType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [calendarCategories, settings] = await Promise.all([
		db.query(`
			SELECT
				id,
				identifier,
				name
			FROM calendar_category
		`),
		db.query(`
			SELECT id, game_id, hemisphere_id, homepage
			FROM calendar_setting
			WHERE user_id = $1::int
		`, this.userId),
	]);

	const games = await Promise.all(settings.map(async (setting:any) =>
	{
		return {
			id: setting.game_id,
			hemisphereId: setting.hemisphere_id,
			homepage: setting.homepage,
			categoryIds: (await db.query(`
				SELECT category_id
				FROM calendar_setting_category
				WHERE calendar_setting_id = $1::int
			`, setting.id)).map((csc:any) => csc.category_id),
		};
	}));

	return <CalendarSettingType>{
		categories: calendarCategories,
		games: games,
	}
}