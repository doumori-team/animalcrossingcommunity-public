import { NotFoundError } from '@errors';
import * as db from '@db';
import * as APITypes from '@apiTypes';

export async function query(userId = null, method, params = {})
{
	try
	{
		if (method.includes('v1/status'))
		{
			// update user activity
			await db.query(`
				UPDATE users
				SET last_active_time = now()
				WHERE id = $1::int
			`, userId);
		}

		const func = (await import(`./api/${method}.js`)).default;

		if (func.apiTypes)
		{
			params = await APITypes.parse
				.bind({
					userId,
					query: query.bind(null, userId)
				})
				(func.apiTypes, params);
		}

		return await func
			.bind({
				userId,
				query: query.bind(null, userId)
			})
			(params);
	}
	catch (error)
	{
		if (error.code === 'MODULE_NOT_FOUND')
		{
			// We got an error because that API method doesn't exist.
			// Wrap it in a custom error to indicate that we know why it
			// happened, then pass it on.
			throw new NotFoundError(method, error);
		}
		else
		{
			// It's some other error - ignore it and pass it on.
			throw error;
		}
	}
}