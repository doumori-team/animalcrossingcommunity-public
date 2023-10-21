import React from 'react';
import { useAsyncValue } from 'react-router-dom';

import { RequireUser } from '@behavior';
import Node from '@/components/nodes/Node.js';
import { utils } from '@utils';
import { Header, Section, Grid, Pagination } from '@layout';

const ThreadsPage = () =>
{
	const {user, threads, page, pageSize, totalCount} = getData(useAsyncValue());

	return (
		<RequireUser>
			<div className='ThreadsPage'>
				<Header
					name={`${utils.getPossessiveNoun(user.username)} Threads`}
					link={`/profile/${encodeURIComponent(user.id)}`}
				/>

				<Section>
					<Grid name='thread' options={threads}>
						{threads.map(node =>
							<Node {...node} key={node.id} followNode={true} />
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`threads/${encodeURIComponent(user.id)}`}
					/>
				</Section>
			</div>
		</RequireUser>
	);
}

export async function loadData({userId}, {page})
{
	return Promise.all([
		this.query('v1/users/threads', {id: userId, page: page ? page : 1}),
		this.query('v1/user_lite', {id: userId}),
	]);
}

function getData(data)
{
	const [returnValue, user] = data;

	return {
		user: user,
		threads: returnValue.results,
		page: returnValue.page,
		totalCount: returnValue.totalCount,
		pageSize: returnValue.pageSize,
	};
}

export default ThreadsPage;
