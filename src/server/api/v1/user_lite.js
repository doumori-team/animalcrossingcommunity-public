import * as accounts from '@accounts';
import * as APITypes from '@apiTypes';

/*
 * Extracts a user's really basic information. Mostly used for validation.
 *
 * This method should only return public information - nothing you ought to have
 * to log in to see.
 *
 * This method should be kept extremely light so that it can be used when
 * minimal user info is needed. For example, checking that a given user id
 * actually corresponds to an existing user. By keeping this bare-bones, it
 * reduces the odds of an API loop.
 */
async function user_lite({id, username})
{
	if (isNaN(id))
	{
		if (typeof(username) === 'undefined')
		{
			id = this.userId;
		}
		else
		{
			id = undefined;
		}
	}

	const data = await accounts.getData(id, username);

	return {
		id: data.id,
		username: data.username,
	}
}

user_lite.apiTypes = {
	id: {
		type: APITypes.number,
	},
}

export default user_lite;