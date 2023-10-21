import React from 'react';
import PropTypes from 'prop-types';
import { Form as ReactRouterForm } from 'react-router-dom';

import { Button } from '@form';
import { RequireUser } from '@behavior';

const Search = ({callback, children}) =>
{
	return (
		<RequireUser silent>
			<div className='Search'>
				<h3>Search:</h3>

				<ReactRouterForm method='get' action={callback} reloadDocument>
					<div className='Search_options'>
						{children}
					</div>

					<Button
						label='Search'
						type='submit'
					/>
				</ReactRouterForm>
			</div>
		</RequireUser>
	);
}

Search.propTypes = {
	children: PropTypes.any.isRequired,
	callback: PropTypes.string.isRequired,
};

export default Search;