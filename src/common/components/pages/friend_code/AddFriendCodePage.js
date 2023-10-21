import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditFriendCode from '@/components/friend_codes/EditFriendCode.js';
import { Section } from '@layout';

const AddFriendCodePage = () =>
{
	const {games, characters} = useLoaderData();

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
}

export async function loadData()
{
	const [games, characters] = await Promise.all([
		this.query('v1/games'),
		this.query('v1/users/characters'),
	]);

	return {games, characters};
}

export default AddFriendCodePage;
