import * as db from '@db';

async function recordIP(request: any, _: any, next: any): Promise<Promise<void>>
{
	if (request.session?.user)
	{
		let ipAddresses = request.headers['x-forwarded-for'];

		if (request.headers['cloudfront-viewer-address'])
		{
			ipAddresses = request.headers['cloudfront-viewer-address'].split(':');

			if (ipAddresses.length > 1)
			{
				ipAddresses.pop();
				ipAddresses = ipAddresses.join(':');
			}
		}

		if (typeof ipAddresses === 'string')
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
