import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';

import { RequireClientJS } from '@behavior';
import { constants } from '@utils';
import { UserContext } from '@contexts';
import { ErrorMessage } from '@layout';
import { Select } from '@form';
import * as iso from 'common/iso.js';

const DonateButton = ({donate}) =>
{
	const userContext = useContext(UserContext);

	const [chosenUserId, setChosenUserId] = useState(userContext ? userContext.id : '');

	const getButton = () =>
	{
		return (
			<button type='submit'>
				<img src='/images/layout/donate.png' className='DonateButton' alt='Donate' />
			</button>
		);
	}

	const onUsernameChange = (userId) =>
	{
		setChosenUserId(userId);
	}

	const handleUserLookup = async (query) =>
	{
		let params = new FormData();
		params.append('query', query);

		return iso.query(null, 'v1/users', params)
			.then(async users =>
			{
				return users;
			})
			.catch(error =>
			{
				console.error('Error attempting to get users.');
				console.error(error);

				return [];
			})
	}

	return (
		donate ? (
			<RequireClientJS fallback={
				<ErrorMessage identifier='javascript-required' />
			}>
				<form action={!constants.LIVE_SITE ? 'https://www.sandbox.paypal.com/donate' : 'https://www.paypal.com/donate'} method='post' target='_top'>
					<input type='hidden' name='hosted_button_id' value={process.env.PAYPAL_BUTTON_ID} />

					{userContext ? (
						<>
						<input type='hidden' name='custom' value={`${chosenUserId}|${userContext.id}`} />

						<Select
							name='users'
							label='User To Donate For'
							options={[{id: userContext.id, username: userContext.username}]}
							optionsMapping={{value: 'id', label: 'username'}}
							async
							value={chosenUserId}
							changeHandler={onUsernameChange}
							loadOptionsHandler={handleUserLookup}
						/>
						</>
					) : (
						<input type='hidden' name='custom' value='Anonymous' />
					)}

					{getButton()}
				</form>
			</RequireClientJS>
		) : (
			<form action='/donate'>
				{getButton()}
			</form>
		)
	);
}

DonateButton.propTypes = {
	donate: PropTypes.bool.isRequired,
};

DonateButton.defaultProps = {
	donate: false,
}

export default DonateButton;