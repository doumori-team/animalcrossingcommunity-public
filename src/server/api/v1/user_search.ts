import * as APITypes from '@apiTypes';
import { APIThisType, UserLiteType } from '@types';

async function user_search(this: APIThisType, { searchUser }: userLiteProps): Promise<UserLiteType>
{
	return await this.query('v1/user_lite', { username: searchUser });
}

user_search.apiTypes = {
	searchUser: {
		type: APITypes.string,
		nullable: true,
	},
};

type userLiteProps = {
	searchUser: string
};

export default user_search;
