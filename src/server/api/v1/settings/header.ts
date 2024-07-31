import { UserError } from '@errors';
import * as db from '@db';
import { APIThisType, HeaderSettingType } from '@types';

async function header(this: APIThisType) : Promise<HeaderSettingType[]>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [headers, status] = await Promise.all([
		db.query(`
			SELECT
				site_header.id,
				site_header.name,
				CASE WHEN EXISTS (
					SELECT users_site_header.user_id
					FROM users_site_header
					WHERE users_site_header.site_header_id = site_header.id AND users_site_header.user_id = $1
				) THEN 1 ELSE 0 END AS granted,
				site_header.permission
			FROM site_header
			ORDER BY site_header.id ASC
		`, this.userId),
		this.query('v1/status'),
	]);

	return headers.filter((header:any) => header.permission === null || status.permissions.includes(header.permission));
}

export default header;