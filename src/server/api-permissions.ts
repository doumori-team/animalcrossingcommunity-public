import { UserError } from '@errors';
import { APIThisType } from '@types';
import { constants } from '@utils';

export async function check(this: APIThisType, permissions: string[]): Promise<void>
{
	const userPermissions = permissions.filter(perm => !['userId', 'TEST_SITE'].includes(perm));

	if (userPermissions.length > 0)
	{
		const results: boolean[] = await Promise.all(
			userPermissions.map(perm =>
			{
				return this.query('v1/permission', { permission: perm });
			}),
		);

		if (results.every(val => val === false))
		{
			throw new UserError('permission');
		}
	}

	if (permissions.includes('userId'))
	{
		if (!this.userId)
		{
			throw new UserError('login-needed');
		}
	}

	if (permissions.includes('TEST_SITE'))
	{
		if (constants.LIVE_SITE)
		{
			throw new UserError('permission');
		}
	}
}
