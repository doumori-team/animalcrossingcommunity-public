import React from 'react';

import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import EditPoll from '@/components/admin/EditPoll.js';

const AddWeeklyPollPage = () =>
{
	return (
		<div className='AddWeeklyPollPage'>
			<RequirePermission permission='polls-admin'>
				<Header
					name='Weekly Polls'
					link='/admin/weekly-polls'
				/>

				<EditPoll />
			</RequirePermission>
		</div>
	);
}

export default AddWeeklyPollPage;
