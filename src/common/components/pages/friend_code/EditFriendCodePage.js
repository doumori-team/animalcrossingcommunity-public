import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditFriendCode from '@/components/friend_codes/EditFriendCode.js';
import { Section } from '@layout';

const EditFriendCodePage = () =>
{
	const {friendCode, characters} = useLoaderData();

	return (
		<div className='EditFriendCodePage'>
			<RequireUser id={friendCode.userId} permission='use-friend-codes'>
				<Section>
					<EditFriendCode
						friendCode={friendCode}
						characters={characters}
					/>
				</Section>
			</RequireUser>
		</div>
	);
}

export async function loadData({friendCodeId})
{
	const [friendCode, characters] = await Promise.all([
		this.query('v1/friend_code', {id: friendCodeId}),
		this.query('v1/users/characters'),
	]);

	return {friendCode, characters};
}

export default EditFriendCodePage;
