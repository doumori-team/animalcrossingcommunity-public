import * as db from '@db';

export default async function ban_lengths()
{
	const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
	{
		return [];
	}

	return await db.query(`
		SELECT
			id,
			description
		FROM ban_length
		WHERE active = true
		ORDER BY days ASC
	`);
}