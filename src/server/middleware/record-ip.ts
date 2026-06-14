import { Request, Response, NextFunction } from 'express';

import * as db from '@db';
import { utils } from '@utils';

async function recordIP(request: Request, _: Response, next: NextFunction): Promise<Promise<void>>
{
	if (request.session?.user)
	{
		let ipAddresses: string | string[] = utils.getIPAddresses(request);

		if (ipAddresses)
		{
			ipAddresses = ipAddresses.split(',')
				.map(item => item.trim());

			if (ipAddresses.length > 1)
			{
				// firewall IP changes but is always last
				ipAddresses.pop();
			}

			if (ipAddresses.length > 0)
			{
				await Promise.all([
					ipAddresses.map(async (ip: string) =>
					{
						await db.query(`
							INSERT INTO user_ip_address (user_id, ip_address)
							VALUES ($1::int, $2)
							ON CONFLICT (user_id, ip_address) DO NOTHING
						`, request.session.user, ip);
					}),
				]);
			}
		}
	}

	next();
}

export default recordIP;
