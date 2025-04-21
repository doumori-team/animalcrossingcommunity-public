import * as db from '@db';

// keep user logged in forever
async function signedInForever(request: any, response: any, next: any): Promise<Promise<void>>
{
	if (request.session?.user)
	{
		const [user] = await db.query(`
			SELECT id
			FROM users
			WHERE id = $1 AND stay_forever = true
		`, request.session.user);

		if (user)
		{
			const cookieSessionId = request.cookies['connect.sid'];

			await db.query(`
				UPDATE session
				SET expire = now() + interval '1 year'
				WHERE sid = $1
			`, request.sessionID);

			response.cookie('connect.sid', cookieSessionId, { maxAge: 366 * 24 * 60 * 60 * 1000, httpOnly: true });
		}
	}

	next();
}

export default signedInForever;
