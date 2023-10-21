import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import EditPoll from '@/components/admin/EditPoll.js';

const EditWeeklyPollPage = () =>
{
	const {poll} = useLoaderData();

	return (
		<div className='EditWeeklyPollPage'>
			<RequirePermission permission='polls-admin'>
				<Header
					name='Weekly Polls'
					link='/admin/weekly-polls'
				/>

				<EditPoll
					{...poll}
				/>
			</RequirePermission>
		</div>
	);
}

export async function loadData({id})
{
	const [poll] = await Promise.all([
		this.query('v1/poll', {id}),
	]);

	return {poll};
}

export default EditWeeklyPollPage;
