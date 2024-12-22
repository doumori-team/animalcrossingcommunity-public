import * as db from '@db';
import { APIThisType, SiteHeaderType } from '@types';

async function site_header(this: APIThisType): Promise<SiteHeaderType[]>
{
	if (!this.userId)
	{
		return [];
	}

	return await db.query(`
		SELECT site_header.name, site_header.url, site_header.permission
		FROM site_header
		JOIN users_site_header ON (users_site_header.site_header_id = site_header.id)
		WHERE users_site_header.user_id = $1
		ORDER BY site_header.id ASC
	`, this.userId);
}

export default site_header;
