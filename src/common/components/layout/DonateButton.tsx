import React, { useState, useContext } from 'react';

import { RequireClientJS } from '@behavior';
import { constants } from '@utils';
import { UserContext } from '@contexts';
import ErrorMessage from '@/components/layout/ErrorMessage.tsx';
import { Select } from '@form';
import * as iso from 'common/iso.js';
import { UsersType } from '@types';

const DonateButton = ({
	donate = false,
}: DonateButtonProps) =>
{
	const userContext = useContext(UserContext);

	const [chosenUserId, setChosenUserId] = useState<number>(userContext ? userContext.id : 0);

	const getButton = (): any =>
	{
		return (
			<button type='submit'>
				<img src={`${constants.AWS_URL}/images/layout/donate.png`} className='DonateButton' alt='Donate' />
			</button>
		);
	};

	const onUsernameChange = (userId: string): void =>
	{
		setChosenUserId(Number(userId));
	};

	const handleUserLookup = async (query: string): Promise<UsersType[]> =>
	{
		let params = new FormData();
		params.append('query', query);

		return (iso as any).query(null, 'v1/users', params)
			.then(async (users: UsersType[]) =>
			{
				return users;
			})
			.catch((error: any) =>
			{
				console.error('Error attempting to get users.');
				console.error(error);

				return [];
			});
	};

	return (
		donate ?
			<RequireClientJS fallback={
				<ErrorMessage identifier='javascript-required' />
			}
			>
				<form action={!constants.LIVE_SITE ? 'https://www.sandbox.paypal.com/donate' : 'https://www.paypal.com/donate'} method='post' target='_top'>
					<input type='hidden' name='hosted_button_id' value={process.env.PAYPAL_BUTTON_ID} />

					{userContext ?
						<>
							<input type='hidden' name='custom' value={`${chosenUserId}|${userContext.id}`} />

							<Select
								name='users'
								label='User To Donate For'
								options={[{ id: userContext.id, username: userContext.username }]}
								optionsMapping={{ value: 'id', label: 'username' }}
								async
								value={chosenUserId}
								changeHandler={onUsernameChange}
								loadOptionsHandler={handleUserLookup}
							/>
						</>
						:
						<input type='hidden' name='custom' value='Anonymous' />
					}

					{getButton()}
				</form>
			</RequireClientJS>
			:
			<form action='/donate'>
				{getButton()}
			</form>

	);
};

type DonateButtonProps = {
	donate?: boolean
};

export default DonateButton;
