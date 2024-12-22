import React from 'react';
import { Form as ReactRouterForm } from 'react-router-dom';

import { Button } from '@form';
import { RequireUser } from '@behavior';

const Search = ({
	callback,
	children,
}: SearchProps) =>
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
};

type SearchProps = {
	children: React.ReactNode | string
	callback: string
};

export default Search;
