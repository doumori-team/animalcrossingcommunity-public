import * as db from '@db';
import { APIThisType, CalendarSettingType } from '@types';

async function calendar(this: APIThisType): Promise<CalendarSettingType>
{
	const [calendarCategories, settings]: [{
		id: number
		identifier: string
		name: string
	}[], {
		id: number
		game_id: number
		hemisphere_id: number | null
		homepage: boolean
	}[]] = await Promise.all([
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

	const games = await Promise.all(settings.map(async setting =>
	{
		return {
			id: setting.game_id,
			hemisphereId: setting.hemisphere_id,
			homepage: setting.homepage,
			categoryIds: (await db.query(`
				SELECT category_id
				FROM calendar_setting_category
				WHERE calendar_setting_id = $1::int
			`, setting.id)).map((csc: { category_id: number }) => csc.category_id),
		};
	}));

	return <CalendarSettingType>{
		categories: calendarCategories,
		games: games,
	};
}

calendar.permissions = [
	'userId',
];

export default calendar;
