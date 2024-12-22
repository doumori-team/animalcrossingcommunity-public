import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

async function save(this: APIThisType, { headerIds }: saveProps): Promise<SuccessType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	await db.transaction(async (query: any) =>
	{
		const [status] = await Promise.all([
			this.query('v1/status'),
			query(`
				DELETE FROM users_site_header
				WHERE user_id = $1
			`, this.userId),
		]);

		await Promise.all(headerIds.map(async (headerId) =>
		{
			const [siteHeader] = await query(`
				SELECT permission
				FROM site_header
				WHERE id = $1
			`, headerId);

			if (!siteHeader)
			{
				throw new UserError('bad-format');
			}

			if (siteHeader.permission != null && !status.permissions.includes(siteHeader.permission))
			{
				throw new UserError('permission');
			}

			await query(`
				INSERT INTO users_site_header (user_id, site_header_id) VALUES
				($1::int, $2::int)
				ON CONFLICT (user_id, site_header_id) DO NOTHING
			`, this.userId, headerId);
		}));
	});

	return {
		_success: 'Your site header settings have been updated.',
		_callbackFirst: true,
	};
}

save.apiTypes = {
	headerIds: {
		type: APITypes.array,
	},
};

type saveProps = {
	headerIds: any[]
};

export default save;
