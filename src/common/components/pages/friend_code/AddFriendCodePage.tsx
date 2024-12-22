import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditFriendCode from '@/components/friend_codes/EditFriendCode.tsx';
import { Section } from '@layout';
import { APIThisType, CharacterType, GamesType } from '@types';

const AddFriendCodePage = () =>
{
	const { games, characters } = useLoaderData() as AddFriendCodePageProps;

	return (
		<div className='AddFriendCodePage'>
			<RequireUser permission='use-friend-codes'>
				<Section>
					<EditFriendCode
						games={games}
						characters={characters}
					/>
				</Section>
			</RequireUser>
		</div>
	);
};

export async function loadData(this: APIThisType): Promise<AddFriendCodePageProps>
{
	const [games, characters] = await Promise.all([
		this.query('v1/games'),
		this.query('v1/users/characters'),
	]);

	return { games, characters };
}

type AddFriendCodePageProps = {
	games: GamesType[]
	characters: CharacterType[]
};

export default AddFriendCodePage;
