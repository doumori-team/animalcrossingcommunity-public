import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import EditPoll from '@/components/admin/EditPoll.tsx';
import { APIThisType, PollType } from '@types';

const EditWeeklyPollPage = () =>
{
	const { poll } = useLoaderData() as EditWeeklyPollPageProps;

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
};

export async function loadData(this: APIThisType, { id }: { id: string }): Promise<EditWeeklyPollPageProps>
{
	const [poll] = await Promise.all([
		this.query('v1/poll', { id }),
	]);

	return { poll };
}

type EditWeeklyPollPageProps = {
	poll: PollType
};

export default EditWeeklyPollPage;
