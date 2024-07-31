import React from 'react';

import { RequireUser } from '@behavior';
import EditTune from '@/components/tunes/EditTune.tsx';
import { Header, Section } from '@layout';

const AddTunePage = () =>
{
	return (
		<div className='AddTunePage'>
			<RequireUser permission='modify-tunes'>
				<Header name='Town Tunes' link='/town-tunes' />

				<Section>
					<EditTune />
				</Section>
			</RequireUser>
		</div>
	);
}

export default AddTunePage;
