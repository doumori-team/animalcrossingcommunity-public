import * as db from '@db';
import { constants } from '@utils';
import { APIThisType, CalendarType } from '@types';

/*
 * Get monthly calendar information for multiple games.
 */
async function calendar_multi(this: APIThisType, { requester, gameIDs, month, year, debug }: calendarProps): Promise<CalendarType[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-calendar' });

	if (!permissionGranted)
	{
		return [{
			game: {},
			months: [],
		}];
	}

	if (this.userId && (!gameIDs || gameIDs.length === 0))
	{
		const games = await db.query(`
			SELECT
				calendar_setting.game_id
			FROM calendar_setting
			WHERE calendar_setting.user_id = $1::int AND calendar_setting.homepage = true
			ORDER BY calendar_setting.game_id ASC
		`, this.userId);

		gameIDs = games?.map((game: { game_id: number }) => game.game_id);
	}


	if (!gameIDs || gameIDs.length === 0)
	{
		gameIDs = [constants.gameIds.ACNH];
	}

	return Promise.all(gameIDs.map(gameId => this.query('v1/acgame/calendar', { requester, gameId, month, year, debug })));
}

type calendarProps = {
	requester: 'homepage' | 'calendar'
	gameIDs: number[] | null
	month: number
	year: number
	debug: string
};

export default calendar_multi;
